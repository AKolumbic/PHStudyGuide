"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../config/logger");
const api_1 = require("@opentelemetry/api");
/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
    const tracer = api_1.trace.getTracer("auth-middleware");
    return tracer.startActiveSpan("authenticate-token", (span) => {
        try {
            // Get the token from the Authorization header
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN format
            if (!token) {
                span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "missing_token");
                logger_1.log.warn("Authentication failed: Missing token");
                span.end();
                return res.status(401).json({ error: "Authentication required" });
            }
            // Verify token
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "missing_secret");
                logger_1.log.error("JWT secret is not configured");
                span.end();
                return res.status(500).json({ error: "Server configuration error" });
            }
            jsonwebtoken_1.default.verify(token, secret, (err, payload) => {
                if (err) {
                    span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                    span.setAttribute("error.type", "invalid_token");
                    span.setAttribute("error.message", err.message);
                    logger_1.log.warn("Authentication failed: Invalid token", {
                        error: err.message,
                    });
                    span.end();
                    return res.status(403).json({ error: "Invalid or expired token" });
                }
                // Add user data to request
                req.user = payload;
                span.setAttribute("user.id", req.user.userId);
                span.setStatus({ code: api_1.trace.SpanStatusCode.OK });
                span.end();
                // Continue to the next middleware/route handler
                next();
            });
        }
        catch (error) {
            span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
            span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
            span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
            logger_1.log.error("Unexpected error in authentication", { error });
            span.end();
            return res.status(500).json({ error: "Authentication failed" });
        }
    });
};
exports.authenticateToken = authenticateToken;
/**
 * Generate a JWT token for a user
 */
const generateToken = (userId, username) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        logger_1.log.error("JWT secret is not configured");
        throw new Error("JWT secret is not configured");
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
    return jsonwebtoken_1.default.sign({ userId, username }, secret, { expiresIn });
};
exports.generateToken = generateToken;
