"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.otelSDK = void 0;
exports.initTelemetry = initTelemetry;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Configure the trace exporter
const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
        "http://localhost:4318/v1/traces",
    headers: {},
});
// Create and configure the OpenTelemetry SDK
exports.otelSDK = new sdk_node_1.NodeSDK({
    resource: new resources_1.Resource({
        [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: "ph-observability-chatbot",
        [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
        environment: process.env.NODE_ENV || "development",
    }),
    traceExporter,
    instrumentations: [
        (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
            "@opentelemetry/instrumentation-fs": { enabled: true },
            "@opentelemetry/instrumentation-express": { enabled: true },
            "@opentelemetry/instrumentation-http": { enabled: true },
            "@opentelemetry/instrumentation-winston": { enabled: true },
        }),
    ],
});
// Initialize OpenTelemetry
function initTelemetry() {
    try {
        exports.otelSDK.start();
        console.log("OpenTelemetry instrumentation initialized");
    }
    catch (error) {
        console.error("Error initializing OpenTelemetry", error);
    }
}
