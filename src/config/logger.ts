import winston from "winston";
import { trace } from "@opentelemetry/api";

// Create a Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "ph-observability-chatbot" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add trace context to logs
export const log = {
  error: (message: string, meta?: Record<string, any>) => {
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    logger.error(message, {
      ...meta,
      traceId,
      spanId,
    });
  },
  warn: (message: string, meta?: Record<string, any>) => {
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    logger.warn(message, {
      ...meta,
      traceId,
      spanId,
    });
  },
  info: (message: string, meta?: Record<string, any>) => {
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    logger.info(message, {
      ...meta,
      traceId,
      spanId,
    });
  },
  debug: (message: string, meta?: Record<string, any>) => {
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    logger.debug(message, {
      ...meta,
      traceId,
      spanId,
    });
  },
};

export default logger;
