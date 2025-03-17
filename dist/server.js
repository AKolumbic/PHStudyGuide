"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const telemetry_1 = require("./config/telemetry");
const logger_1 = require("./config/logger");
const chatbot_1 = __importDefault(require("./api/chatbot"));
const auth_1 = __importDefault(require("./api/auth"));
const swagger_1 = __importDefault(require("./api/swagger"));
// Initialize OpenTelemetry - must be done before any other imports
(0, telemetry_1.initTelemetry)();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable for development
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use("/api/chatbot", chatbot_1.default);
app.use("/api/auth", auth_1.default);
// Swagger documentation
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
// Serve static files from dist/public
app.use(express_1.default.static(path_1.default.join(__dirname, "../dist/public")));
// For all other routes, send the index.html file
app.get("*", (req, res) => {
    if (req.url.startsWith("/api")) {
        return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path_1.default.join(__dirname, "../dist/public/index.html"));
});
// Start server
app.listen(port, () => {
    logger_1.log.info(`Server running on port ${port}`);
});
// Handle graceful shutdown
process.on("SIGTERM", () => {
    logger_1.log.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", () => {
    logger_1.log.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});
exports.default = app;
