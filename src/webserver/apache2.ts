// Set the ServerName directive in the Apache configuration (do not replace comments, remove duplicates, append if not present)
const setServerName = async ({
  apache2ConfigurationFile,
  serverName,
}: {
  apache2ConfigurationFile: string;
  serverName: string;
}) => {
  console.log(`Updating server name.`);
  const command = new Deno.Command("sed", {
    args: [
      "-i",
      `/^[^#]*ServerName /d; $a ServerName ${serverName}`,
      apache2ConfigurationFile,
    ],
  });

  const output = await command.output();

  console.log(new TextDecoder().decode(output.stderr));
};

const enableSSL = async ({
  apache2ConfigurationFile,
}: {
  apache2ConfigurationFile: string;
}) => {
  console.log(`Enabling SSL/TLS.`);
  const command = new Deno.Command("sed", {
    args: [
      "-i",
      "-e",
      "s/^#(Include .*httpd-ssl.conf)/\\1/",
      "-e",
      "s/^#(LoadModule .*mod_ssl.so)/\\1/",
      "-e",
      "s/^#(LoadModule .*mod_socache_shmcb.so)/\\1/",
      apache2ConfigurationFile,
    ],
  });

  const output = await command.output();

  console.log(new TextDecoder().decode(output.stderr));
};

const addCertificateFiles = async ({
  apache2SSLConfiguration,
}: {
  apache2SSLConfiguration: string;
}) => {
  const certFile = "/usr/local/apache2/certificates/cert.pem";
  const certKeyFile = "/usr/local/apache2/certificates/cert.pem";

  console.log(`Adding certificate files.`);

  // Make sure to set up certificate files inside <VirtualHost> blocks
  const command1 = new Deno.Command("sed", {
    args: [
      "-i",
      "/<VirtualHost/,/<\\/VirtualHost>/",
      "{",
      "/^[^#]*SSLCertificateFile /d",
      `/<VirtualHost.*>/a\\`,
      "SSLCertificateFile",
      certFile,
      "}",
      apache2SSLConfiguration,
    ],
  });

  const output1 = await command1.output();

  console.log(new TextDecoder().decode(output1.stderr));

  const command2 = new Deno.Command("sed", {
    args: [
      "-i",
      "/<VirtualHost/,/<\\/VirtualHost>/",
      "{",
      "/^[^#]*SSLCertificateKeyFile /d",
      `/<VirtualHost.*>/a\\`,
      "SSLCertificateKeyFile",
      certKeyFile,
      "}",
      apache2SSLConfiguration,
    ],
  });

  const output2 = await command2.output();

  console.log(new TextDecoder().decode(output2.stderr));
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

export const runUpgrade = async ({ serverName }: { serverName: string }) => {
  const apache2ConfigurationFile = "/usr/local/apache2/conf/httpd.conf";
  const apache2SSLConfiguration =
    "/usr/local/apache2/conf/extra/httpd-ssl.conf";

  await setServerName({
    serverName,
    apache2ConfigurationFile: apache2ConfigurationFile,
  });
  await enableSSL({ apache2ConfigurationFile: apache2ConfigurationFile });
  await addCertificateFiles({
    apache2SSLConfiguration: apache2SSLConfiguration,
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
