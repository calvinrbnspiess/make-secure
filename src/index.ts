import { Command } from "@cliffy/command";

await new Command()
  .name("make-secure")
  .description("A tool to help you serving webserver content via TLS/SSL.")
  .version("v1.0.0")
  .action(() => {
    console.log("Hello World!");
  })
  .parse();
