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

    console.log(jsonOutput);

    return jsonOutput;
  } catch (error) {
    console.error("Could not read testssl output file.");
    Deno.exit(1);
  }
};
