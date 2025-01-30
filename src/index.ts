import { Command } from "@cliffy/command";

import {
  installDependencies,
  printSummary,
  runTestssl,
} from "./analysis/testssl.ts";

await new Command()
  .name("make-secure")
  .description("A tool to help you serving webserver content via TLS/SSL.")
  .version("v1.0.0")
  .action(async () => {
    await installDependencies();

    printSummary(await runTestssl("google.com"));
  })
  .parse();
