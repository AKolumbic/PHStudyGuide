import React from "react";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  messagesEndRef,
}) => {
  return (
    <div className="chat-messages" id="chatMessages">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${
            message.sender === "user" ? "user-message" : "bot-message"
          }`}
        >
          {message.text}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
