"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const ChatHeader_1 = __importDefault(require("./ChatHeader"));
const ChatMessages_1 = __importDefault(require("./ChatMessages"));
const ChatInput_1 = __importDefault(require("./ChatInput"));
const StatusBar_1 = __importDefault(require("./StatusBar"));
require("../styles/ChatApp.css");
const ChatApp = () => {
    const [messages, setMessages] = (0, react_1.useState)([
        {
            text: "Hello! I'm your retail assistant. How can I help you today?",
            sender: "bot",
        },
    ]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [statusText, setStatusText] = (0, react_1.useState)("Connected");
    const [conversationId, setConversationId] = (0, react_1.useState)(null);
    const messagesEndRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const sendMessage = async (message) => {
        if (!message.trim())
            return;
        // Add user message to UI
        setMessages((prev) => [...prev, { text: message, sender: "user" }]);
        // Set loading state
        setIsLoading(true);
        setStatusText("Thinking...");
        try {
            // Send message to API
            const response = await fetch("/api/chatbot/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    ...(conversationId && { conversationId }),
                }),
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            // Add bot response to UI
            setMessages((prev) => [...prev, { text: data.response, sender: "bot" }]);
            // Update conversation ID for future messages
            setConversationId(data.conversationId);
            setStatusText("Connected");
        }
        catch (error) {
            console.error("Error sending message:", error);
            // Show error in UI
            setMessages((prev) => [
                ...prev,
                {
                    text: "Sorry, I encountered an error. Please try again.",
                    sender: "bot",
                },
            ]);
            setStatusText("Error occurred");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (react_1.default.createElement("div", { className: "container" },
        react_1.default.createElement("div", { className: "chat-container" },
            react_1.default.createElement(ChatHeader_1.default, null),
            react_1.default.createElement(ChatMessages_1.default, { messages: messages, messagesEndRef: messagesEndRef }),
            react_1.default.createElement(StatusBar_1.default, { statusText: statusText, isLoading: isLoading }),
            react_1.default.createElement(ChatInput_1.default, { onSendMessage: sendMessage, isLoading: isLoading }))));
};
exports.default = ChatApp;
