"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const winston_1 = __importDefault(require("winston"));
const api_1 = require("@opentelemetry/api");
// Create a Winston logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    defaultMeta: { service: "ph-observability-chatbot" },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
    ],
});
// Add trace context to logs
exports.log = {
    error: (message, meta) => {
        const span = api_1.trace.getActiveSpan();
        const traceId = span?.spanContext().traceId;
        const spanId = span?.spanContext().spanId;
        logger.error(message, {
            ...meta,
            traceId,
            spanId,
        });
    },
    warn: (message, meta) => {
        const span = api_1.trace.getActiveSpan();
        const traceId = span?.spanContext().traceId;
        const spanId = span?.spanContext().spanId;
        logger.warn(message, {
            ...meta,
            traceId,
            spanId,
        });
    },
    info: (message, meta) => {
        const span = api_1.trace.getActiveSpan();
        const traceId = span?.spanContext().traceId;
        const spanId = span?.spanContext().spanId;
        logger.info(message, {
            ...meta,
            traceId,
            spanId,
        });
    },
    debug: (message, meta) => {
        const span = api_1.trace.getActiveSpan();
        const traceId = span?.spanContext().traceId;
        const spanId = span?.spanContext().spanId;
        logger.debug(message, {
            ...meta,
            traceId,
            spanId,
        });
    },
};
exports.default = logger;
