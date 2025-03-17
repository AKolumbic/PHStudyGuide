import React, { useState, useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import StatusBar from "./StatusBar";
import "../styles/ChatApp.css";

interface Message {
  text: string;
  sender: "user" | "bot";
}

const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your retail assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("Connected");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

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
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="chat-container">
        <ChatHeader />
        <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        <StatusBar statusText={statusText} isLoading={isLoading} />
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatApp;
