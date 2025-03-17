"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const ChatMessages = ({ messages, messagesEndRef, }) => {
    return (react_1.default.createElement("div", { className: "chat-messages", id: "chatMessages" },
        messages.map((message, index) => (react_1.default.createElement("div", { key: index, className: `message ${message.sender === "user" ? "user-message" : "bot-message"}` }, message.text))),
        react_1.default.createElement("div", { ref: messagesEndRef })));
};
exports.default = ChatMessages;
