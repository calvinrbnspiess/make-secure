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
  directive: string,
  { silent = false } = {}
): string => {
  // Regex to match the directive, accounting for leading spaces, comments, and multiple lines
  const directiveRegex = new RegExp(
    `^\\s*#?\\s*${type.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}\\s+\\S+(:\\d+)?\\s*$`,
    "m"
  );

  if (!silent) {
    console.log(`Ensuring ${type} directive: ${directive}`);
  }

  // If the exact directive exists (commented or uncommented)
  if (directiveRegex.test(config)) {
    return config.replace(directiveRegex, directive);
  }

  // If it doesn't exist, append it at the end of the file
  return config.trim() + `\n${directive}\n`;
};

const ensureDirectiveInBlock = (
  config: string,
  type: string,
  directive: string,
  block: string,
  defaultArguments = ""
): string => {
  console.log(`Ensuring ${type} directive in ${block}: ${directive}`);

  const blockRegex = new RegExp(
    `<\\s*${block}\\s+[^>]*>([\\s\\S]*?)<\\s*/\\s*${block}\\s*>`,
    "m"
  );

  // extract block arguments or use default arguments
  const blockArgumentsRegex = new RegExp(`/<\s*${block}\s+([^>]+)>/`);
  const match = config.match(blockArgumentsRegex);

  const blockArguments = match ? match[0] : defaultArguments;
  const blockMatch = config.match(blockRegex);

  // if no block is found, add it to the end of the file
  if (!blockMatch || blockMatch.length === 0) {
    console.log(`Block ${block} not found in configuration file.`);
    return (
      config + `\n<${block} ${blockArguments}>\n${directive}\n</${block}>\n`
    );
  }

  const blockContent = blockMatch[1];

  const updatedBlockContent = ensureDirective(blockContent, type, directive, {
    silent: true,
  });

  return config.replace(
    blockMatch[0],
    `<${block} ${blockArguments}>\n${updatedBlockContent}\n</${block}>`
  );
};

const checkApache2Configuration = async () => {
  const command = new Deno.Command("apachectl", {
    args: ["configtest"],
  });

  const output = await command.output();

  const error = new TextDecoder().decode(output.stderr);

  if (error.match(/Syntax OK/)) {
    return true;
  } else {
    console.log(error);
    return false;
  }
};

const restartApache2 = async () => {
  const command = new Deno.Command("apachectl", {
    args: ["restart"],
  });

  const output = await command.output();

  console.log(new TextDecoder().decode(output.stderr));
};

const updateSSLConfig = async ({
  serverName,
  apache2SSLConfiguration,
  certFile,
  certKeyFile,
}: {
  serverName: string;
  apache2SSLConfiguration: string;
  certFile: string;
  certKeyFile: string;
}) => {
  console.log(`Adding certificate files.`, certFile, certKeyFile);

  let config = await Deno.readTextFile(apache2SSLConfiguration);

  const defaultBlockArguments = "_default_:443";

  config = ensureDirectiveInBlock(
    config,
    "ServerName",
    `ServerName ${serverName}`,
    "VirtualHost",
    defaultBlockArguments
  );

  config = ensureDirectiveInBlock(
    config,
    "SSLCertificateFile",
    `SSLCertificateFile ${certFile}`,
    "VirtualHost",
    defaultBlockArguments
  );

  config = ensureDirectiveInBlock(
    config,
    "SSLCertificateKeyFile",
    `SSLCertificateKeyFile ${certKeyFile}`,
    "VirtualHost",
    defaultBlockArguments
  );

  await Deno.writeTextFile(apache2SSLConfiguration, config);
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

  await updateSSLConfig({
    apache2SSLConfiguration,
    certFile,
    certKeyFile,
    serverName,
  });

  if (await checkApache2Configuration()) {
    console.log("Apache configuration is valid! 🎉");
  } else {
    console.log("Error in Apache configuration! 😱");
    return;
  }

  await restartApache2();

  console.log("Configuration changes completed. Apache restarted! 🚀");
};
