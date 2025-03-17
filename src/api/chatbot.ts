import express from "express";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { log } from "../config/logger";
import { ChatService } from "../services/chatService";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const chatService = new ChatService();

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
router.post("/chat", authenticateToken, async (req, res) => {
  const tracer = trace.getTracer("chatbot-api");

  return tracer.startActiveSpan("handle-chat-request", async (span) => {
    try {
      const { message, conversationId } = req.body;

      // Validation
      if (!message) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute("error.type", "validation_error");
        log.warn("Missing required field: message");
        return res.status(400).json({ error: "Message is required" });
      }

      span.setAttribute("message.length", message.length);
      span.setAttribute("conversation.id", conversationId || "new");

      // Process the chat message
      const result = await chatService.processMessage(message, conversationId);

      span.setStatus({ code: SpanStatusCode.OK });

      return res.status(200).json(result);
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.setAttribute(
        "error.type",
        error instanceof Error ? error.name : "unknown"
      );
      span.setAttribute(
        "error.message",
        error instanceof Error ? error.message : "Unknown error"
      );

      log.error("Error processing chat request", { error });

      return res.status(500).json({ error: "Failed to process request" });
    } finally {
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
  } catch (error) {
    log.error("Chatbot health check failed", { error });
    return res
      .status(500)
      .json({ status: "unhealthy", error: "Service unavailable" });
  }
});

export default router;
