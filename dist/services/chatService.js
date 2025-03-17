"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const openai_1 = require("openai");
const uuid_1 = require("uuid");
const logger_1 = require("../config/logger");
const api_1 = require("@opentelemetry/api");
const azureKeyVault_1 = require("../utils/azureKeyVault");
// In-memory storage for conversation history
// In a production app, this would be stored in a database
const conversations = new Map();
class ChatService {
    constructor() {
        // Initialize OpenAI configuration
        const apiKey = process.env.OPENAI_API_KEY || "";
        const configuration = new openai_1.Configuration({ apiKey });
        this.openai = new openai_1.OpenAIApi(configuration);
        // Set the model from environment or default
        this.model = process.env.OPENAI_MODEL || "gpt-4";
        // System prompt for the chatbot
        this.systemPrompt =
            "You are an intelligent assistant for a retail store, helping customers with product information, " +
                "inventory checks, and general inquiries. Be friendly, helpful, and concise. " +
                "If you don't know the answer to a question, say so instead of making up information.";
    }
    /**
     * Initialize the service by retrieving secrets
     */
    async initialize() {
        const tracer = api_1.trace.getTracer("chatbot-service");
        return tracer.startActiveSpan("initialize-chat-service", async (span) => {
            try {
                // Attempt to get API key from Azure Key Vault if not in env
                if (!process.env.OPENAI_API_KEY) {
                    logger_1.log.info("Retrieving OpenAI API key from Azure Key Vault");
                    const apiKey = await (0, azureKeyVault_1.getSecret)("openai-api-key");
                    if (apiKey) {
                        const configuration = new openai_1.Configuration({ apiKey });
                        this.openai = new openai_1.OpenAIApi(configuration);
                        logger_1.log.info("Successfully configured OpenAI with key from Key Vault");
                    }
                    else {
                        logger_1.log.error("Failed to retrieve OpenAI API key from Key Vault");
                    }
                }
                span.setStatus({ code: api_1.trace.SpanStatusCode.OK });
            }
            catch (error) {
                span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
                span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
                logger_1.log.error("Failed to initialize chat service", { error });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Process a user message and get a response from the AI
     */
    async processMessage(message, conversationId) {
        const tracer = api_1.trace.getTracer("chatbot-service");
        return tracer.startActiveSpan("process-message", async (span) => {
            try {
                // Create a new conversation or get existing one
                const conversation = this.getOrCreateConversation(conversationId);
                // Add user message to history
                conversation.messages.push({
                    role: "user",
                    content: message,
                });
                // Update timestamp
                conversation.updatedAt = new Date();
                span.setAttribute("conversation.id", conversation.id);
                span.setAttribute("conversation.message_count", conversation.messages.length);
                // Get response from OpenAI
                const response = await this.getAIResponse(conversation.messages);
                // Add AI response to history
                conversation.messages.push({
                    role: "assistant",
                    content: response,
                });
                // Update conversation in storage
                conversations.set(conversation.id, conversation);
                span.setStatus({ code: api_1.trace.SpanStatusCode.OK });
                return {
                    response,
                    conversationId: conversation.id,
                };
            }
            catch (error) {
                span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
                span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
                logger_1.log.error("Failed to process message", { error });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Get or create a conversation
     */
    getOrCreateConversation(conversationId) {
        // If conversation ID is provided and exists, return it
        if (conversationId && conversations.has(conversationId)) {
            return conversations.get(conversationId);
        }
        // Create a new conversation
        const newConversation = {
            id: (0, uuid_1.v4)(),
            messages: [
                {
                    role: "system",
                    content: this.systemPrompt,
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Store the new conversation
        conversations.set(newConversation.id, newConversation);
        return newConversation;
    }
    /**
     * Get a response from OpenAI
     */
    async getAIResponse(messages) {
        const tracer = api_1.trace.getTracer("chatbot-service");
        return tracer.startActiveSpan("openai-completion", async (span) => {
            try {
                // Add metrics for the request
                span.setAttribute("openai.model", this.model);
                span.setAttribute("openai.message_count", messages.length);
                // Call OpenAI API
                const response = await this.openai.createChatCompletion({
                    model: this.model,
                    messages: messages,
                    max_tokens: 500,
                    temperature: 0.7,
                });
                // Extract and return the response text
                const responseText = response.data.choices[0]?.message?.content?.trim() ||
                    "Sorry, I could not generate a response.";
                span.setStatus({ code: api_1.trace.SpanStatusCode.OK });
                return responseText;
            }
            catch (error) {
                span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
                span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
                logger_1.log.error("OpenAI API request failed", { error });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Get service health status
     */
    getHealth() {
        return "healthy";
    }
}
exports.ChatService = ChatService;
