import { ChatService } from "../chatService";
import { Configuration, OpenAIApi } from "openai";

// Mock OpenAI
jest.mock("openai", () => {
  const mockOpenAIApi = {
    createChatCompletion: jest.fn().mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: "This is a mock response",
            },
          },
        ],
      },
    }),
  };

  return {
    Configuration: jest.fn().mockImplementation(() => ({})),
    OpenAIApi: jest.fn().mockImplementation(() => mockOpenAIApi),
  };
});

// Mock Azure Key Vault
jest.mock("../../utils/azureKeyVault", () => ({
  getSecret: jest.fn().mockResolvedValue("mock-api-key"),
}));

// Mock OpenTelemetry
jest.mock("@opentelemetry/api", () => {
  const mockSpan = {
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
  };

  const mockTracer = {
    startActiveSpan: jest.fn().mockImplementation((name, fn) => {
      return fn(mockSpan);
    }),
  };

  return {
    trace: {
      getTracer: jest.fn().mockReturnValue(mockTracer),
      SpanStatusCode: {
        OK: "ok",
        ERROR: "error",
      },
    },
  };
});

describe("ChatService", () => {
  let chatService: ChatService;

  beforeEach(() => {
    // Reset environment between tests
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4";

    chatService = new ChatService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("processMessage", () => {
    it("should process a message and return a response", async () => {
      const message = "Hello, chatbot!";

      const result = await chatService.processMessage(message);

      expect(result).toHaveProperty("response", "This is a mock response");
      expect(result).toHaveProperty("conversationId");
    });

    it("should use an existing conversation if ID is provided", async () => {
      // First message to create a conversation
      const firstResult = await chatService.processMessage("First message");
      const conversationId = firstResult.conversationId;

      // Second message using the same conversation
      const secondResult = await chatService.processMessage(
        "Second message",
        conversationId
      );

      expect(secondResult.conversationId).toBe(conversationId);
    });
  });

  describe("getHealth", () => {
    it("should return healthy status", () => {
      const status = chatService.getHealth();
      expect(status).toBe("healthy");
    });
  });
});
