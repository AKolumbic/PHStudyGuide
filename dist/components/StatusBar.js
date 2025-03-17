"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const StatusBar = ({ statusText, isLoading }) => {
    return (react_1.default.createElement("div", { className: "status-bar" },
        react_1.default.createElement("span", { id: "statusText" }, statusText),
        react_1.default.createElement("span", { id: "loadingIndicator", className: "loading", style: { display: isLoading ? "inline-block" : "none" } })));
};
exports.default = StatusBar;
