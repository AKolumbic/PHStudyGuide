"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_1 = require("../middleware/auth");
const logger_1 = require("../config/logger");
const api_1 = require("@opentelemetry/api");
// Simple in-memory user storage for demo
// In a real application, this would be stored in a database
const users = new Map();
// Initialize with a test user
users.set("test", {
    userId: "1",
    username: "test",
    password: "password123", // Would be hashed in production
});
class AuthService {
    /**
     * Authenticate a user and generate a JWT token
     */
    async login(username, password) {
        const tracer = api_1.trace.getTracer("auth-service");
        return tracer.startActiveSpan("login-user", async (span) => {
            try {
                span.setAttribute("auth.username", username);
                // Find user
                const user = users.get(username);
                if (!user) {
                    span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                    span.setAttribute("error.type", "user_not_found");
                    logger_1.log.warn(`Login failed: User ${username} not found`);
                    return null;
                }
                // Check password
                if (user.password !== password) {
                    span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                    span.setAttribute("error.type", "invalid_password");
                    logger_1.log.warn(`Login failed: Invalid password for user ${username}`);
                    return null;
                }
                // Generate token
                const token = (0, auth_1.generateToken)(user.userId, user.username);
                span.setStatus({ code: api_1.trace.SpanStatusCode.OK });
                logger_1.log.info(`User ${username} logged in successfully`);
                return token;
            }
            catch (error) {
                span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
                span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
                logger_1.log.error("Login error", { error });
                return null;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Register a new user
     */
    async register(username, password) {
        const tracer = api_1.trace.getTracer("auth-service");
        return tracer.startActiveSpan("register-user", async (span) => {
            try {
                span.setAttribute("auth.username", username);
                // Check if user already exists
                if (users.has(username)) {
                    span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                    span.setAttribute("error.type", "user_already_exists");
                    logger_1.log.warn(`Registration failed: User ${username} already exists`);
                    return false;
                }
                // Create new user
                const userId = `${users.size + 1}`;
                users.set(username, {
                    userId,
                    username,
                    password, // Would be hashed in production
                });
                span.setStatus({ code: api_1.trace.SpanStatusCode.OK });
                logger_1.log.info(`User ${username} registered successfully`);
                return true;
            }
            catch (error) {
                span.setStatus({ code: api_1.trace.SpanStatusCode.ERROR });
                span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
                span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
                logger_1.log.error("Registration error", { error });
                return false;
            }
            finally {
                span.end();
            }
        });
    }
}
exports.AuthService = AuthService;
