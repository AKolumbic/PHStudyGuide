import { Configuration, OpenAIApi } from "openai";
import { v4 as uuidv4 } from "uuid";
import { log } from "../config/logger";
import { trace } from "@opentelemetry/api";
import { getSecret } from "../utils/azureKeyVault";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationHistory {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for conversation history
// In a production app, this would be stored in a database
const conversations = new Map<string, ConversationHistory>();

export class ChatService {
  private openai: OpenAIApi;
  private systemPrompt: string;
  private model: string;

  constructor() {
    // Initialize OpenAI configuration
    const apiKey = process.env.OPENAI_API_KEY || "";
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);

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
  public async initialize(): Promise<void> {
    const tracer = trace.getTracer("chatbot-service");

    return tracer.startActiveSpan("initialize-chat-service", async (span) => {
      try {
        // Attempt to get API key from Azure Key Vault if not in env
        if (!process.env.OPENAI_API_KEY) {
          log.info("Retrieving OpenAI API key from Azure Key Vault");

          const apiKey = await getSecret("openai-api-key");

          if (apiKey) {
            const configuration = new Configuration({ apiKey });
            this.openai = new OpenAIApi(configuration);

            log.info("Successfully configured OpenAI with key from Key Vault");
          } else {
            log.error("Failed to retrieve OpenAI API key from Key Vault");
          }
        }

        span.setStatus({ code: trace.SpanStatusCode.OK });
      } catch (error) {
        span.setStatus({ code: trace.SpanStatusCode.ERROR });
        span.setAttribute(
          "error.type",
          error instanceof Error ? error.name : "unknown"
        );
        span.setAttribute(
          "error.message",
          error instanceof Error ? error.message : "Unknown error"
        );

        log.error("Failed to initialize chat service", { error });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Process a user message and get a response from the AI
   */
  public async processMessage(
    message: string,
    conversationId?: string
  ): Promise<{ response: string; conversationId: string }> {
    const tracer = trace.getTracer("chatbot-service");

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
        span.setAttribute(
          "conversation.message_count",
          conversation.messages.length
        );

        // Get response from OpenAI
        const response = await this.getAIResponse(conversation.messages);

        // Add AI response to history
        conversation.messages.push({
          role: "assistant",
          content: response,
        });

        // Update conversation in storage
        conversations.set(conversation.id, conversation);

        span.setStatus({ code: trace.SpanStatusCode.OK });

        return {
          response,
          conversationId: conversation.id,
        };
      } catch (error) {
        span.setStatus({ code: trace.SpanStatusCode.ERROR });
        span.setAttribute(
          "error.type",
          error instanceof Error ? error.name : "unknown"
        );
        span.setAttribute(
          "error.message",
          error instanceof Error ? error.message : "Unknown error"
        );

        log.error("Failed to process message", { error });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Get or create a conversation
   */
  private getOrCreateConversation(
    conversationId?: string
  ): ConversationHistory {
    // If conversation ID is provided and exists, return it
    if (conversationId && conversations.has(conversationId)) {
      return conversations.get(conversationId)!;
    }

    // Create a new conversation
    const newConversation: ConversationHistory = {
      id: uuidv4(),
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
  private async getAIResponse(messages: ChatMessage[]): Promise<string> {
    const tracer = trace.getTracer("chatbot-service");

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
        const responseText =
          response.data.choices[0]?.message?.content?.trim() ||
          "Sorry, I could not generate a response.";

        span.setStatus({ code: trace.SpanStatusCode.OK });

        return responseText;
      } catch (error) {
        span.setStatus({ code: trace.SpanStatusCode.ERROR });
        span.setAttribute(
          "error.type",
          error instanceof Error ? error.name : "unknown"
        );
        span.setAttribute(
          "error.message",
          error instanceof Error ? error.message : "Unknown error"
        );

        log.error("OpenAI API request failed", { error });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Get service health status
   */
  public getHealth(): string {
    return "healthy";
  }
}
