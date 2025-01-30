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
