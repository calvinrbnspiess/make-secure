import { colors } from "@cliffy/ansi/colors";

export const getOperatingSystem = async () => {
  return Deno.build.os;
};

export const checkPlatformRequirements = async () => {
  if (!/linux/.test(await getOperatingSystem())) {
    console.error("This script is only available on Linux operating systems.");
    Deno.exit(1);
  }

  const shCommand = await new Deno.Command("sh").output();

  if (shCommand.code !== 0) {
    console.error("sh is not available on your system.");
    Deno.exit(1);
  }

  console.log("Checking if apt is available...");

  const aptCheckCommand = new Deno.Command("sh", {
    args: ["-c", "command -v apt"],
  });

  const output = await aptCheckCommand.output();

  const aptExecutablePath = new TextDecoder().decode(output.stdout).trim();

  if (aptExecutablePath !== "/usr/bin/apt") {
    console.error("apt is not available on your system.");
    Deno.exit(1);
  }

  console.log(`apt is available at ${aptExecutablePath}`);

  console.log("Installing dependencies...");
};

export const updateApt = async () => {
  console.log("Update repositories...");

  const updateAptCommand = new Deno.Command("apt", {
    args: ["-y", "update"],
  });

  const output = await updateAptCommand.output();

  console.log(new TextDecoder().decode(output.stderr));
};

export const installDependencies = async () => {
  await checkPlatformRequirements();

  await updateApt();

  console.log("Installing testssl.sh...");

  const installDependenciesCommand = new Deno.Command("apt", {
    args: ["install", "-y", "testssl.sh"],
  });

  const output = await installDependenciesCommand.output();

  console.log(new TextDecoder().decode(output.stderr));

  console.log("Successfully installed testssl.sh.");
};

export const runTestssl = async (publicAddress: string) => {
  console.log(
    `Running testssl.sh against ${publicAddress} for further analysis. This process can take some minutes ...`
  );

  const date = new Date();
  const testsslOutputPath = `/tmp/make-secure/testssl-${date.getTime()}.json`;

  // make sure output directory exists
  await Deno.mkdir("/tmp/make-secure", { recursive: true });

  // make sure empty output file exists
  await Deno.writeTextFile(testsslOutputPath, "", { create: true });

  const runTestsslCommand = new Deno.Command("testssl", {
    args: ["--jsonfile", testsslOutputPath, publicAddress],
  });

  const output = await runTestsslCommand.output();

  console.log(new TextDecoder().decode(output.stderr));

  try {
    const testsslOutput = await Deno.readTextFile(testsslOutputPath);
    let jsonOutput = JSON.parse(testsslOutput);

    return jsonOutput;
  } catch (error) {
    console.error("Could not read testssl output file.");
    Deno.exit(1);
  }
};

type TestSSLEntry = {
  id: string;
  ip: string;
  port: string;
  severity: string;
  finding: string;
};

export const printSummary = (jsonOutput: TestSSLEntry[]) => {
  let properties = {
    ALPN: "ALPN",
    TLS1: "TLS1",
    TLS1_2: "TLS1.2",
    TLS1_3: "TLS1.3",
    banner_server: "Banner Server",
    HTTP_status_code: "HTTP Status Code",
    cert_fingerprintSHA256: "Certificate Fingerprint",
    cert_caIssuers: "Certificate Issuer",
    cert_trust: "Certificate Trust",
    cert_chain_of_trust: "Certificate Chain of Trust",
    cert_expirationStatus: "Certificate Expiration",
  };

  // iterate key/value of properties

  for (const [key, friendlyName] of Object.entries(properties)) {
    let finding = jsonOutput.find((entry) => entry.id === key);

    if (!finding) {
      continue;
    }

    console.log(
      `${colors.rgb24(">", 0x000000)} ${colors.bold.rgb24(
        friendlyName,
        0xd4d4d4
      )}${colors.rgb24(":", 0x000000)} ${colors.rgb24(
        finding.finding,
        0xd4d4d4
      )}`
    );
  }
};
