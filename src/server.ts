import "dotenv/config";
import express from "express";
// @ts-ignore
import cors from "cors";
import helmet from "helmet";
// @ts-ignore
import swaggerUi from "swagger-ui-express";
import path from "path";
import { initTelemetry } from "./config/telemetry";
import { log } from "./config/logger";
import chatbotRoutes from "./api/chatbot";
import authRoutes from "./api/auth";
import swaggerSpec from "./api/swagger";

// Initialize OpenTelemetry - must be done before any other imports
initTelemetry();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
  })
);
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/auth", authRoutes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, "../dist/public")));

// For all other routes, send the index.html file
app.get("*", (req, res) => {
  if (req.url.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

// Start server
app.listen(port, () => {
  log.info(`Server running on port ${port}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  log.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  log.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

export default app;
