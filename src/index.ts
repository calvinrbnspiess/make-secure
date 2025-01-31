import { Command } from "@cliffy/command";
import { Input, Select } from "@cliffy/prompt";

import {
  installDependencies,
  printSummary,
  runTestssl,
} from "./analysis/testssl.ts";
import { checkConnection } from "./utils/network.ts";

await new Command()
  .name("make-secure")
  .description("A tool to help you serving webserver content via TLS/SSL.")
  .version("v1.0.0")
  .action(async () => {
    await installDependencies();

    const serverName: string = await Input.prompt({
      message: `How is the server reachable publicly? (Do not provide http:// or https:// in front of the address)`,
      default: "localhost",
      minLength: 3,
    });

    const { httpAvailable, httpsAvailable } = await checkConnection(serverName);

    if (httpAvailable) {
      console.log("HTTP okay");
    } else {
      console.error(
        "Provided address via HTTP not available. Please check your server configuration."
      );
      Deno.exit(1);
    }

    if (httpsAvailable) {
      console.log("HTTPS okay");
    } else {
      console.error("HTTPS not okay. We will try to fix that.");
    }

    printSummary(await runTestssl(serverName, { httpOnly: !httpsAvailable }));

    const certFile: string = await Input.prompt({
      message: `Where is your certificate file located? This is the public key part which is shared to the world.`,
      default: "/usr/local/apache2/certificates/cert.pem",
      minLength: 3,
    });

    const certKeyFile: string = await Input.prompt({
      message: `Where is your certificate key file located? This is the private key part which should be kept secret.`,
      default: "/usr/local/apache2/certificates/key.pem",
      minLength: 3,
    });

    const webserver: string = await Select.prompt({
      message: "What webserver do you use?",
      options: [
        { name: "apache2", value: "apache2" },
        { name: "nginx", value: "nginx", disabled: true },
        { name: "tomcat", value: "tomcat", disabled: true },
      ],
    });

    console.log(`Running configuration upgrade for ${webserver}...`);

    // pick runUpgrade() function dynamically based on webserver from ./webserver folder
    const { runUpgrade } = await import(`./webserver/${webserver}.ts`);

    await runUpgrade({ serverName: serverName, certFile, certKeyFile });

    const networkTestAfterUpgrade = await checkConnection(serverName);

    if (networkTestAfterUpgrade.httpAvailable) {
      console.log("HTTP okay");
    } else {
      console.error(
        "Provided address via HTTP not available anymore. Please check your server configuration."
      );
    }

    if (networkTestAfterUpgrade.httpsAvailable) {
      console.log("HTTPS okay");
    } else {
      console.log(
        "HTTPS still not available. (This could be due to a self-signed certificate which is not trusted by this wizard. Don't worry, a check with testssl.sh will be performed now)"
      );
    }

    printSummary(await runTestssl(serverName));

    console.log(`🎉 Completed.`);
  })

  .parse();
