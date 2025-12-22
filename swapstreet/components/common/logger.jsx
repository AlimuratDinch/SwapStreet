import { Logger } from "tslog";

const isDev = process.env.NODE_ENV === "development";

export const logger = new Logger({
  name: "client",
  minLevel: isDev ? "debug" : "info",
  prettyLogTemplate:
    "{{hh}}:{{mm}}:{{ss}} {{logLevelName}} {{name}} →",
});