# OpenTelemetry

OpenTelemetry is a Cloud Native Computing Foundation (CNCF) project that provides a set of APIs, libraries, agents, and instrumentation to create and manage telemetry data (metrics, logs, and traces). It aims to standardize how we collect and transmit telemetry data to observability backends.

## OpenTelemetry's Architecture and Components

OpenTelemetry provides a complete observability framework with several key components working together.

### Core Components

#### API

The OpenTelemetry API defines the interfaces for generating telemetry data:

- **Tracer API**: Creates spans and manages context
- **Meter API**: Creates and records metrics
- **Logger API**: Captures log records
- **Context API**: Propagates metadata across service boundaries

#### SDK

The OpenTelemetry SDK implements the API with configurable backends:

- **Trace SDK**: Processing of spans, sampling strategies
- **Metric SDK**: Aggregation and processing of metrics
- **Log SDK**: Processing of logs
- **Resource SDK**: Metadata about the entity producing telemetry

#### Semantic Conventions

Standardized attributes for common concepts:

- HTTP request attributes (method, status code, etc.)
- Database operation attributes (system, statement, etc.)
- Messaging system attributes (system, destination, etc.)
- Resource attributes (service name, host, etc.)

### Data Types

#### Traces

A trace in OpenTelemetry represents the end-to-end journey of a request through a distributed system:

- **Spans**: Basic unit of work with start/end time and attributes
- **Trace Context**: Information that links spans together
- **Span Events**: Time-stamped annotations within a span
- **Span Links**: References to related spans

```
Trace
├── Span A (Parent)
│   ├── Attribute 1: Value 1
│   ├── Attribute 2: Value 2
│   └── Event: "Interesting occurrence", timestamp: ...
├── Span B (Child of A)
│   ├── Attribute 3: Value 3
│   └── Link to Span in another trace
└── Span C (Child of A)
    └── Attribute 4: Value 4
```

#### Metrics

OpenTelemetry supports several metric types:

- **Counter**: Monotonically increasing values (e.g., request count)
- **Gauge**: Values that can go up and down (e.g., memory usage)
- **Histogram**: Distribution of values (e.g., request duration)
- **UpDownCounter**: Non-monotonic counter for increment/decrement
- **Summary**: Pre-calculated summary statistics (deprecated in favor of histograms)

#### Logs

OpenTelemetry integrates logs with traces and metrics:

- **Log Records**: Individual log entries
- **Severity Levels**: Standardized logging levels
- **Trace Context**: Links logs to related trace spans
- **Structured Logging**: Key-value pairs for better querying

### Architecture Diagram

```
┌───────────────────────────────────────────────────────────┐
│                      Your Application                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │   Auto/Manual   │   │ Interceptors │   │  Resource  │  │
│  │ Instrumentation │   │  & Plugins   │   │ Detection  │  │
│  └────────┬────────┘   └───────┬──────┘   └─────┬──────┘  │
│           │                    │                 │         │
│  ┌────────▼────────────────────▼─────────────────▼──────┐  │
│  │                    OpenTelemetry API                  │  │
│  └────────────────────────────┬───────────────────────┬─┘  │
│                               │                       │     │
│  ┌─────────────────────────┐  │  ┌───────────────────▼──┐  │
│  │      Context API        │  │  │   OpenTelemetry SDK  │  │
│  │  (Propagation, Baggage) │◄─┘  │  (Processing, Export)│  │
│  └─────────────────────────┘     └──────────┬───────────┘  │
│                                             │              │
└─────────────────────────────────────────────┼──────────────┘
                                              │
                          ┌───────────────────▼───────────────┐
                          │    OpenTelemetry Collector        │
                          │ (Receive, Process, Export)        │
                          └───────────────────┬───────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────┐
                    │                         │                     │
           ┌────────▼─────────┐     ┌─────────▼─────────┐   ┌──────▼───────┐
           │  Metrics Backend │     │  Tracing Backend  │   │  Log Backend │
           │   (Prometheus)   │     │   (Jaeger/Zipkin) │   │   (Fluentd)  │
           └──────────────────┘     └───────────────────┘   └──────────────┘
```

## Instrumentation of Node.js Applications with OpenTelemetry

OpenTelemetry offers multiple ways to instrument Node.js applications.

### Auto-Instrumentation

Auto-instrumentation requires minimal code changes and automatically captures telemetry from common libraries:

```javascript
// Simply require the auto-instrumentation package at the start of your app
const opentelemetry = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const { Resource } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");

// Configure the SDK with auto-instrumentation
const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "my-service",
  }),
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// Initialize the SDK and register with the OpenTelemetry API
sdk.start();

// Graceful shutdown
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing terminated"))
    .catch((error) => console.log("Error terminating tracing", error))
    .finally(() => process.exit(0));
});
```

Auto-instrumentation supports many popular libraries:

- HTTP/HTTPS
- Express, Koa, Fastify, NestJS
- MongoDB, Redis, PostgreSQL, MySQL
- gRPC, GraphQL
- AWS SDK, Azure SDK
- and many more

### Manual Instrumentation

For custom business logic and more detailed spans:

```javascript
const { trace } = require("@opentelemetry/api");

// Get a tracer instance
const tracer = trace.getTracer("my-service-tracer");

// Wrap business logic with custom spans
function processOrder(orderId) {
  // Create and activate a new span
  return tracer.startActiveSpan("processOrder", async (span) => {
    try {
      // Add attributes to the span
      span.setAttribute("orderId", orderId);

      // Create a child span for a sub-operation
      const result = await tracer.startActiveSpan(
        "validateOrder",
        async (childSpan) => {
          try {
            // Business logic here
            const isValid = await validateOrderInDatabase(orderId);
            childSpan.setAttribute("valid", isValid);
            return isValid;
          } catch (error) {
            // Record errors
            childSpan.recordException(error);
            childSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            throw error;
          } finally {
            // End the child span
            childSpan.end();
          }
        }
      );

      // Record events
      span.addEvent("order_processed", {
        result: result ? "success" : "failure",
      });

      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      // End the parent span
      span.end();
    }
  });
}
```

### Hybrid Approach

In real-world applications, a combination works best:

- Use auto-instrumentation for frameworks and libraries
- Add manual instrumentation for business logic
- Enrich existing spans with additional attributes or events

### Metrics in Node.js

```javascript
const { metrics } = require("@opentelemetry/api");

// Get a meter instance
const meter = metrics.getMeter("my-service-metrics");

// Create instruments
const requestCounter = meter.createCounter("http.requests.total", {
  description: "Total number of HTTP requests",
});

const requestDurationHistogram = meter.createHistogram(
  "http.request.duration",
  {
    description: "HTTP request duration in milliseconds",
    unit: "ms",
  }
);

// Use in Express middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  // Count the request
  requestCounter.add(1, {
    method: req.method,
    route: req.route?.path || "unknown",
  });

  // Track duration
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    requestDurationHistogram.record(duration, {
      method: req.method,
      route: req.route?.path || "unknown",
      status_code: res.statusCode,
    });
  });

  next();
});
```

## Context Propagation Across Service Boundaries

Context propagation is essential for tracing requests across service boundaries in distributed systems.

### Propagation Basics

Context propagation involves:

1. **Injection**: Serializing trace context into a carrier (HTTP headers, message metadata)
2. **Extraction**: Deserializing context from a carrier in the receiving service
3. **Continuation**: Creating new spans as children of the received context

```javascript
// In the sending service
const { trace, context, propagation } = require("@opentelemetry/api");
const axios = require("axios");

async function makeDownstreamRequest(url, data) {
  return tracer.startActiveSpan("makeDownstreamRequest", async (span) => {
    try {
      // Prepare headers object for context injection
      const headers = {};

      // Inject current context into headers
      propagation.inject(context.active(), headers);

      // Make HTTP request with propagated context
      const response = await axios.post(url, data, { headers });

      return response.data;
    } finally {
      span.end();
    }
  });
}

// In the receiving service (e.g., Express middleware)
app.use((req, res, next) => {
  // Extract context from incoming request headers
  const extractedContext = propagation.extract(context.active(), req.headers);

  // Create a new context with the extracted information
  const withExtractedContext = context.with(extractedContext, () => {
    // All spans created in this scope will be properly parented
    next();
  });
});
```

### W3C Trace Context Standard

OpenTelemetry implements the W3C Trace Context standard (traceparent, tracestate headers):

```
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
             │  │                               │               │
             │  │                               │               ┕ Flags (sampled)
             │  │                               ┕ Parent span ID
             │  ┕ Trace ID
             ┕ Version
```

### Context Propagation in Different Protocols

#### HTTP/REST

```javascript
// HTTP headers are used for propagation
const headers = {
  // W3C trace context headers will be added here
};
propagation.inject(context.active(), headers);
```

#### gRPC

```javascript
// Metadata object is used for propagation
const metadata = new grpc.Metadata();
propagation.inject(context.active(), metadata);
```

#### Message Queues

```javascript
// For Kafka
const messageHeaders = {};
propagation.inject(context.active(), messageHeaders);
const kafkaMessage = {
  key: "order-123",
  value: JSON.stringify(orderData),
  headers: messageHeaders,
};

// For RabbitMQ
const properties = {
  headers: {},
};
propagation.inject(context.active(), properties.headers);
channel.publish(
  "exchange",
  "routingKey",
  Buffer.from(JSON.stringify(data)),
  properties
);
```

### Baggage

OpenTelemetry Baggage allows passing arbitrary key-value pairs across service boundaries:

```javascript
const { propagation, context } = require("@opentelemetry/api");
const { getBaggage, setBaggage } = require("@opentelemetry/core");

// Set baggage values
const userId = "12345";
const currentBaggage = getBaggage(context.active()) || {};
const newBaggage = setBaggage(currentBaggage, "user.id", userId);

// Create new context with updated baggage
const ctxWithBaggage = setBaggage(context.active(), newBaggage);

// Execute within that context
context.with(ctxWithBaggage, () => {
  // Make downstream calls with propagated baggage
  makeDownstreamRequest("/api/orders");
});

// In downstream service, read the baggage
app.use((req, res, next) => {
  const extractedContext = propagation.extract(context.active(), req.headers);
  const baggage = getBaggage(extractedContext);
  const userId = baggage.getEntry("user.id")?.value;

  if (userId) {
    console.log(`Processing request for user: ${userId}`);
  }

  next();
});
```

## Exporting Telemetry Data to Backends like Splunk

OpenTelemetry supports various exporters to send telemetry data to observability backends.

### Exporter Types

OpenTelemetry provides several exporter types:

- **OTLP Exporters**: OpenTelemetry Protocol (HTTP/gRPC)
- **Vendor-Specific Exporters**: Direct integration with platforms like Jaeger, Zipkin
- **Console Exporter**: Outputs to console (debugging)
- **File Exporter**: Writes to local files

### Exporting to Splunk

Splunk Observability Cloud supports OpenTelemetry through the OTLP exporter:

```javascript
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const {
  OTLPMetricExporter,
} = require("@opentelemetry/exporter-metrics-otlp-http");

// Trace exporter configuration for Splunk
const traceExporter = new OTLPTraceExporter({
  url: "https://ingest.us0.signalfx.com/v2/trace/otlp",
  headers: {
    "X-SF-TOKEN": "YOUR_SPLUNK_ACCESS_TOKEN",
  },
});

// Metric exporter configuration for Splunk
const metricExporter = new OTLPMetricExporter({
  url: "https://ingest.us0.signalfx.com/v2/datapoint/otlp",
  headers: {
    "X-SF-TOKEN": "YOUR_SPLUNK_ACCESS_TOKEN",
  },
});

// Use these exporters in the SDK
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export metrics every minute
  }),
  // Other configurations
});
```

### Using Multiple Exporters

You can configure multiple exporters to send data to different backends:

```javascript
const { CompositeExporter } = require("@opentelemetry/sdk-trace-base");

// Create multiple exporters
const splunkExporter = new OTLPTraceExporter({
  /*...*/
});
const jaegerExporter = new JaegerExporter({
  /*...*/
});
const consoleExporter = new ConsoleSpanExporter();

// Combine into a composite exporter
const compositeExporter = new CompositeExporter({
  exporters: [splunkExporter, jaegerExporter, consoleExporter],
});

// Use in SDK configuration
const sdk = new opentelemetry.NodeSDK({
  spanProcessor: new BatchSpanProcessor(compositeExporter),
  // Other configurations
});
```

### Sampling Strategies

Control the volume of telemetry data sent to backends:

```javascript
const {
  ParentBasedSampler,
  TraceIdRatioBased,
} = require("@opentelemetry/sdk-trace-node");

// Sample 10% of traces
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBased(0.1),
});

// Alternatively, use always-on sampling for errors
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBased(0.1),
  remoteParentSampled: new AlwaysOnSampler(),
  remoteParentNotSampled: new TraceIdRatioBased(0.1),
  localParentSampled: new AlwaysOnSampler(),
  localParentNotSampled: new TraceIdRatioBased(0.1),
});

// Use in SDK
const sdk = new opentelemetry.NodeSDK({
  sampler,
  // Other configurations
});
```

### Batch Processing

Optimize network usage with batch processing:

```javascript
const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");

const batchProcessor = new BatchSpanProcessor(exporter, {
  // Send batch when 512 spans collected or...
  maxExportBatchSize: 512,
  // ...when 5 seconds has passed since the first span
  scheduledDelayMillis: 5000,
  // How long to wait for export before dropping
  exportTimeoutMillis: 30000,
});

// Use in SDK
const sdk = new opentelemetry.NodeSDK({
  spanProcessor: batchProcessor,
  // Other configurations
});
```

## OpenTelemetry Collector Deployment and Configuration

The OpenTelemetry Collector is a standalone service that receives, processes, and exports telemetry data.

### Collector Architecture

The Collector consists of three main components:

1. **Receivers**: Accept telemetry data from various sources
2. **Processors**: Transform, filter, and enrich telemetry data
3. **Exporters**: Send data to observability backends

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   OpenTelemetry Collector                   │
│                                                             │
│  ┌───────────┐      ┌────────────┐      ┌──────────────┐   │
│  │ Receivers │ ───► │ Processors │ ───► │  Exporters   │   │
│  └───────────┘      └────────────┘      └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Options

#### Sidecar Pattern

Deploy a Collector instance alongside each service:

```
┌────────────────────────────────┐
│           Pod/Host             │
│                                │
│  ┌────────────┐ ┌───────────┐  │
│  │            │ │           │  │
│  │ Application│►│ Collector │  │
│  │            │ │           │  │
│  └────────────┘ └─────┬─────┘  │
│                       │        │
└───────────────────────┼────────┘
                        ▼
                 ┌─────────────┐
                 │ Observability│
                 │   Backend   │
                 └─────────────┘
```

Benefits:

- Reduced network hops
- Isolation between services
- Local buffering
- Service-specific configurations

#### Gateway Pattern

Deploy Collector as a centralized service:

```
┌────────────┐   ┌────────────┐   ┌────────────┐
│            │   │            │   │            │
│ Application│   │ Application│   │ Application│
│            │   │            │   │            │
└──────┬─────┘   └──────┬─────┘   └──────┬─────┘
       │                │                │
       └──────┬───────┴──────┬───────┘
                │                │
        ┌───────▼────┐  ┌─────▼─────┐
        │                │ │                │
        │   Collector    │ │   Collector    │ (HA Pair)
        │                │ │                │
        └───────┬────────┘ └────────┬───────┘
                │                   │
                └─────────┬─────────┘
                          │
                    ┌─────▼──────┐
                    │            │
                    │  Backend   │
                    │            │
                    └────────────┘
```

Benefits:

- Centralized configuration
- Reduced Collector instances
- Advanced processing
- Protocol translation

#### Agent + Gateway Pattern

Combine both approaches for larger deployments:

```
┌───────────┐  ┌───────────┐  ┌───────────┐
│ App + Agent│  │ App + Agent│  │ App + Agent│
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │
      └──────┬───────┴──────┬───────┘
             │              │
     ┌───────▼────┐  ┌──────▼─────┐
     │  Gateway   │  │  Gateway   │
     │ Collector  │  │ Collector  │
     └─────┬──────┘  └─────┬──────┘
           │               │
           └───────┬───────┘
                   │
           ┌───────▼──────┐
           │  Backend(s)  │
           └──────────────┘
```

Benefits:

- Local preprocessing with centralized control
- Horizontal scalability
- Advanced configurations for gateways

### Collector Configuration

Configuration is typically done via YAML:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  jaeger:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14250
  prometheus:
    config:
      scrape_configs:
        - job_name: "otel-collector"
          scrape_interval: 10s
          static_configs:
            - targets: ["0.0.0.0:8888"]

processors:
  batch:
    send_batch_size: 10000
    timeout: 10s
  memory_limiter:
    check_interval: 5s
    limit_mib: 1000
  resourcedetection:
    detectors: [env, system]
  filter:
    metrics:
      include:
        match_type: regexp
        metric_names:
          - .*cpu.*
          - .*memory.*

exporters:
  otlp:
    endpoint: "backend.example.com:4317"
    tls:
      cert_file: /certs/client.crt
      key_file: /certs/client.key
  logging:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp, jaeger]
      processors: [memory_limiter, batch]
      exporters: [otlp, logging]
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, filter, batch]
      exporters: [otlp, logging]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp, logging]
```

### Kubernetes Deployment

Deploy the Collector on Kubernetes with Helm:

```bash
# Add OpenTelemetry Collector Helm repository
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts

# Update Helm repositories
helm repo update

# Install the Collector
helm install my-otel-collector open-telemetry/opentelemetry-collector \
  --set mode=deployment \
  --set config.file=/conf/otel-collector-config.yaml \
  --set configMap.create=true \
  --set configMap.data."otel-collector-config\.yaml"="$(cat config.yaml)"
```

### Using the Collector with Node.js

Configure your Node.js application to send telemetry to the Collector:

```javascript
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");

const traceExporter = new OTLPTraceExporter({
  // Endpoint for Collector (default values shown)
  url: "http://localhost:4318/v1/traces",
});

// Use in SDK configuration
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  // Other configurations
});
```

## Custom Metrics and Spans in OpenTelemetry

Creating custom metrics and spans allows you to track business-specific telemetry data.

### Custom Spans

Custom spans enable detailed tracing of business operations:

```javascript
const { trace, context, SpanStatusCode } = require("@opentelemetry/api");

// Get a tracer
const tracer = trace.getTracer("order-processing");

async function processPayment(orderId, amount) {
  // Create a new span
  return tracer.startActiveSpan("process-payment", async (span) => {
    try {
      // Add business-relevant attributes
      span.setAttribute("order.id", orderId);
      span.setAttribute("payment.amount", amount);
      span.setAttribute("payment.currency", "USD");

      // Record the start of an important operation
      span.addEvent("payment_initiated", {
        time: Date.now(),
        "payment.gateway": "stripe",
      });

      // Perform business logic
      const result = await processPaymentWithGateway(orderId, amount);

      // Add result attributes
      span.setAttribute("payment.success", result.success);
      span.setAttribute("payment.transaction_id", result.transactionId);

      // Record completion event
      span.addEvent("payment_completed", {
        time: Date.now(),
        "payment.status": result.status,
      });

      return result;
    } catch (error) {
      // Record error information
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `Payment processing failed: ${error.message}`,
      });
      throw error;
    } finally {
      // Always end the span
      span.end();
    }
  });
}
```

### Span Attributes Best Practices

- Use semantic conventions where applicable
- Create domain-specific attributes for business context
- Use consistent naming (dot notation)
- Keep attribute cardinality under control
- Consider attribute length limits
- Add enough context for troubleshooting

### Custom Metrics

Create custom metrics to measure business-specific data:

```javascript
const { metrics } = require("@opentelemetry/api");

// Get a meter
const meter = metrics.getMeter("business-metrics");

// Counter example - tracks total values
const orderCounter = meter.createCounter("orders.count", {
  description: "Total number of orders placed",
  unit: "{orders}",
});

// Record a new order with attributes
function recordNewOrder(order) {
  orderCounter.add(1, {
    "order.channel": order.channel,
    "customer.type": order.customerType,
    "order.payment_method": order.paymentMethod,
  });
}

// Histogram example - tracks value distributions
const orderValueHistogram = meter.createHistogram("order.value", {
  description: "Distribution of order values",
  unit: "USD",
});

// Record the value of an order
function recordOrderValue(order) {
  orderValueHistogram.record(order.totalAmount, {
    "order.channel": order.channel,
    "product.category": order.primaryCategory,
  });
}

// UpDownCounter example - tracks values that go up and down
const activeUserCounter = meter.createUpDownCounter("users.active", {
  description: "Number of currently active users",
  unit: "{users}",
});

// Track user logins and logouts
function trackUserActivity(userId, action) {
  if (action === "login") {
    activeUserCounter.add(1);
  } else if (action === "logout") {
    activeUserCounter.add(-1);
  }
}

// Observable gauge example - tracks current values
const inventoryGauge = meter.createObservableGauge("inventory.level", {
  description: "Current inventory levels by product",
  unit: "{items}",
});

// Register callback to provide current values
inventoryGauge.addCallback(async (observableResult) => {
  // Get current inventory levels
  const products = await getInventoryLevels();

  // Record each product's inventory level
  for (const product of products) {
    observableResult.observe(product.quantity, {
      "product.id": product.id,
      "product.category": product.category,
      "warehouse.id": product.warehouseId,
    });
  }
});
```

### Asynchronous Metrics

For values that require computation or external calls:

```javascript
const databaseConnectionGauge = meter.createObservableGauge(
  "database.connections",
  {
    description: "Current database connections",
    unit: "{connections}",
  }
);

// Register callback that will be called when metrics are collected
databaseConnectionGauge.addCallback(async (observableResult) => {
  try {
    // Get current connection count from pool
    const connectionStats = await dbPool.getStats();

    observableResult.observe(connectionStats.activeConnections, {
      "database.name": "customers",
      "database.type": "postgresql",
    });

    observableResult.observe(connectionStats.idleConnections, {
      "database.name": "customers",
      "database.type": "postgresql",
      "connection.state": "idle",
    });
  } catch (error) {
    console.error("Failed to collect database metrics:", error);
  }
});
```

### Business Metrics Examples

Track user behavior and business outcomes:

```javascript
// User engagement metrics
const pageViewCounter = meter.createCounter("page_views.count");
const userSessionDuration = meter.createHistogram("user.session_duration", {
  unit: "s",
});

// Conversion metrics
const conversionCounter = meter.createCounter("funnel.conversion");
function trackFunnelConversion(step, success) {
  conversionCounter.add(1, {
    "funnel.step": step,
    "conversion.success": success,
  });
}

// Revenue metrics
const revenueCounter = meter.createCounter("business.revenue", {
  unit: "USD",
});
function trackRevenue(amount, product) {
  revenueCounter.add(amount, {
    "product.id": product.id,
    "product.category": product.category,
    "sale.type": product.saleType,
  });
}
```

### Custom Views for Metric Configuration

Use Views to configure metric aggregation:

```javascript
const {
  MeterProvider,
  View,
  Aggregation,
} = require("@opentelemetry/sdk-metrics");

// Configure explicit buckets for order value histogram
const orderValueView = new View({
  instrumentName: "order.value",
  instrumentType: InstrumentType.HISTOGRAM,
  aggregation: new Aggregation.ExplicitBucketHistogram({
    boundaries: [10, 50, 100, 500, 1000, 5000, 10000],
  }),
});

// Configure view to drop high-cardinality attributes
const filteredOrderView = new View({
  instrumentName: "orders.count",
  instrumentType: InstrumentType.COUNTER,
  attributeKeys: ["order.channel", "customer.type"], // Only keep these attributes
});

// Set up MeterProvider with custom views
const meterProvider = new MeterProvider({
  views: [orderValueView, filteredOrderView],
});

// Register as global meter provider
metrics.setGlobalMeterProvider(meterProvider);
```

### Integrating Traces and Metrics

Connect traces and metrics for better context:

```javascript
const { trace, metrics, context } = require("@opentelemetry/api");

async function processOrder(order) {
  return trace
    .getTracer("order-service")
    .startActiveSpan("process-order", async (span) => {
      try {
        // Add business context to span
        span.setAttribute("order.id", order.id);

        // Get the current trace and span ID
        const spanContext = span.spanContext();
        const traceId = spanContext.traceId;
        const spanId = spanContext.spanId;

        // Record metric with trace context
        metrics
          .getMeter("order-metrics")
          .createCounter("orders.processed")
          .add(1, {
            "order.id": order.id,
            "trace.id": traceId,
            "span.id": spanId,
          });

        // Process the order
        const result = await fulfillOrder(order);

        return result;
      } finally {
        span.end();
      }
    });
}
```

### Exemplars

Link metrics to traces with exemplars (supported in newer versions):

```javascript
const { ExemplarFilter } = require("@opentelemetry/sdk-metrics");

// Configure MeterProvider with exemplar support
const meterProvider = new MeterProvider({
  exemplarFilter: new ExemplarFilter.AlwaysOn(),
});

// Usage in application code
function recordAPILatency(endpoint, duration) {
  // Current span context will be attached as exemplar
  apiLatencyHistogram.record(duration, {
    endpoint: endpoint,
  });
}
```

### Correlation with Logs

Connect logs with trace context:

```javascript
const { trace } = require("@opentelemetry/api");
const winston = require("winston");

// Configure Winston to include trace context
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format((info) => {
      const span = trace.getSpan(context.active());
      if (span) {
        const spanContext = span.spanContext();
        info.trace_id = spanContext.traceId;
        info.span_id = spanContext.spanId;
        info.trace_flags = spanContext.traceFlags.toString(16);
      }
      return info;
    })()
  ),
  transports: [new winston.transports.Console()],
});

// Usage in application code
function processPayment(orderId, amount) {
  return tracer.startActiveSpan("process-payment", (span) => {
    try {
      // Log will automatically include trace context
      logger.info("Processing payment", { orderId, amount });

      // Business logic
      const result = paymentGateway.charge(orderId, amount);

      logger.info("Payment processed successfully", {
        orderId,
        transactionId: result.transactionId,
      });

      return result;
    } catch (error) {
      logger.error("Payment processing failed", {
        orderId,
        error: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```
