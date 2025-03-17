"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_1 = require("@opentelemetry/api");
const logger_1 = require("../config/logger");
const chatService_1 = require("../services/chatService");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const chatService = new chatService_1.ChatService();
/**
 * @swagger
 * /api/chatbot/chat:
 *   post:
 *     summary: Send a message to the chatbot
 *     description: Process a user message and get a response from the chatbot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message
 *               conversationId:
 *                 type: string
 *                 description: Optional conversation ID for continuing a conversation
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: The chatbot's response
 *                 conversationId:
 *                   type: string
 *                   description: Conversation ID for future reference
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/chat", auth_1.authenticateToken, async (req, res) => {
    const tracer = api_1.trace.getTracer("chatbot-api");
    return tracer.startActiveSpan("handle-chat-request", async (span) => {
        try {
            const { message, conversationId } = req.body;
            // Validation
            if (!message) {
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "validation_error");
                logger_1.log.warn("Missing required field: message");
                return res.status(400).json({ error: "Message is required" });
            }
            span.setAttribute("message.length", message.length);
            span.setAttribute("conversation.id", conversationId || "new");
            // Process the chat message
            const result = await chatService.processMessage(message, conversationId);
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            return res.status(200).json(result);
        }
        catch (error) {
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
            span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
            logger_1.log.error("Error processing chat request", { error });
            return res.status(500).json({ error: "Failed to process request" });
        }
        finally {
            span.end();
        }
    });
});
/**
 * @swagger
 * /api/chatbot/health:
 *   get:
 *     summary: Check chatbot health
 *     description: Returns the health status of the chatbot service
 *     responses:
 *       200:
 *         description: Service is healthy
 *       500:
 *         description: Service is unhealthy
 */
router.get("/health", (req, res) => {
    try {
        // Simple health check that the chatbot service is available
        const status = chatService.getHealth();
        return res.status(200).json({ status });
    }
    catch (error) {
        logger_1.log.error("Chatbot health check failed", { error });
        return res
            .status(500)
            .json({ status: "unhealthy", error: "Service unavailable" });
    }
});
exports.default = router;
