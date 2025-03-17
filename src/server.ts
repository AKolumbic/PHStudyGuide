import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { initTelemetry } from "./config/telemetry";
import { log } from "./config/logger";
import chatbotRoutes from "./api/chatbot";
import authRoutes from "./api/auth";
import swaggerSpec from "./api/swagger";

// Initialize OpenTelemetry - must be done before any other imports
initTelemetry();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static("public"));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
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
