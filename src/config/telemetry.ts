import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import * as dotenv from "dotenv";

dotenv.config();

// Configure the trace exporter
const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "http://localhost:4318/v1/traces",
  headers: {},
});

// Create and configure the OpenTelemetry SDK
export const otelSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "ph-observability-chatbot",
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: true },
      "@opentelemetry/instrumentation-express": { enabled: true },
      "@opentelemetry/instrumentation-http": { enabled: true },
      "@opentelemetry/instrumentation-winston": { enabled: true },
    }),
  ],
});

// Initialize OpenTelemetry
export function initTelemetry() {
  try {
    otelSDK.start();
    console.log("OpenTelemetry instrumentation initialized");
  } catch (error) {
    console.error("Error initializing OpenTelemetry", error);
  }
}
