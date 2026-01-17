const isDev = process.env.NODE_ENV === "development";

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function createConsoleLogger(): Logger {
  const prefix = "[client]";
  const timestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  };

  return {
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(`${timestamp()} DEBUG ${prefix} →`, ...args);
      }
    },
    info: (...args: unknown[]) => {
      console.info(`${timestamp()} INFO ${prefix} →`, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(`${timestamp()} WARN ${prefix} →`, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(`${timestamp()} ERROR ${prefix} →`, ...args);
    },
  };
}

export const logger = createConsoleLogger();