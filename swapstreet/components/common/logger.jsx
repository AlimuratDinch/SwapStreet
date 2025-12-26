const isDev = process.env.NODE_ENV === "development";
const isServer = typeof window === "undefined";

// Create a logger that works in both server and client environments
// tslog is only used server-side to avoid client-side bundling issues
let logger;

if (isServer) {
  // Server-side: use tslog
  try {
    // Use require to avoid static analysis by webpack for client bundles
    const tslogModule = require("tslog");
    const { Logger } = tslogModule;
    logger = new Logger({
      name: "client",
      minLevel: isDev ? "debug" : "info",
      prettyLogTemplate: "{{hh}}:{{mm}}:{{ss}} {{logLevelName}} {{name}} →",
    });
  } catch (error) {
    // Fallback to console if tslog fails to load
    logger = createConsoleLogger();
  }
} else {
  // Client-side: use console with similar API
  logger = createConsoleLogger();
}

function createConsoleLogger() {
  const prefix = "[client]";
  const timestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  };

  return {
    debug: (...args) => {
      if (isDev) {
        console.debug(`${timestamp()} DEBUG ${prefix} →`, ...args);
      }
    },
    info: (...args) => {
      console.info(`${timestamp()} INFO ${prefix} →`, ...args);
    },
    warn: (...args) => {
      console.warn(`${timestamp()} WARN ${prefix} →`, ...args);
    },
    error: (...args) => {
      console.error(`${timestamp()} ERROR ${prefix} →`, ...args);
    },
  };
}

export { logger };
