const ensureApacheCtlIsInstalled = async () => {
  const apacheCtlCommand = new Deno.Command("sh", {
    args: ["-c", "command -v apachectl"],
  });

  const output = await apacheCtlCommand.output();

  const aptExecutablePath = new TextDecoder().decode(output.stdout).trim();

  if (aptExecutablePath !== "/usr/local/apache2/bin/apachectl") {
    console.error("apachectl is not available on your system.");
    Deno.exit(1);
  }
};

const ensureDirective = (
  config: string,
  type: string,
  directive: string
): string => {
  const directiveRegex = new RegExp(
    `^#?\\s*${type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+\\S+:\\d+$`,
    "m"
  );

  console.log(`Ensuring ${type} directive: ${directive}`);

  // If the exact directive exists (commented or uncommented), ensure it's uncommented
  if (directiveRegex.test(config)) {
    return config.replace(directiveRegex, directive);
  }

  // If it doesn't exist, append it at the end of the file
  return config.trim() + `\n${directive}\n`;
};

const checkApache2Configuration = async () => {
  const command = new Deno.Command("apachectl", {
    args: ["configtest"],
  });

  const output = await command.output();

  console.log(new TextDecoder().decode(output.stderr));

  return new TextDecoder().decode(output.stdout) === "Syntax OK";
};

const restartApache2 = async () => {
  const command = new Deno.Command("apachectl", {
    args: ["restart"],
  });

  const output = await command.output();

  console.log(new TextDecoder().decode(output.stderr));
};

const addCertificateFiles = async ({
  apache2SSLConfiguration,
  certFile,
  certKeyFile,
}: {
  apache2SSLConfiguration: string;
  certFile: string;
  certKeyFile: string;
}) => {
  console.log(`Adding certificate files.`, certFile, certKeyFile);
};

export const runUpgrade = async ({
  serverName,
  certFile,
  certKeyFile,
}: {
  serverName: string;
  certFile: string;
  certKeyFile: string;
}) => {
  const apache2ConfigurationFile = "/usr/local/apache2/conf/httpd.conf";
  const apache2SSLConfiguration =
    "/usr/local/apache2/conf/extra/httpd-ssl.conf";

  ensureApacheCtlIsInstalled();

  let config = await Deno.readTextFile(apache2ConfigurationFile);

  // Set the ServerName directive in the Apache configuration (do not replace comments, remove duplicates, append if not present)
  config = ensureDirective(config, "ServerName", `ServerName ${serverName}`);

  // Enable SSL
  config = ensureDirective(
    config,
    "Include",
    `Include ${apache2SSLConfiguration}`
  );
  config = ensureDirective(
    config,
    "LoadModule",
    "LoadModule ssl_module modules/mod_ssl.so"
  );
  config = ensureDirective(
    config,
    "LoadModule",
    "LoadModule socache_shmcb_module modules/mod_socache_shmcb.so"
  );

  await Deno.writeTextFile(apache2ConfigurationFile, config);

  await addCertificateFiles({ apache2SSLConfiguration, certFile, certKeyFile });

  if (await checkApache2Configuration()) {
    console.log("Apache configuration is valid! 🎉");
  } else {
    console.log("Error in Apache configuration! 😱");
    return;
  }

  await restartApache2();

  console.log("Configuration changes completed. Apache restarted! 🚀");
};
