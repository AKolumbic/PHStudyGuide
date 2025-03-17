"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_1 = require("@opentelemetry/api");
const logger_1 = require("../config/logger");
const authService_1 = require("../services/authService");
const router = express_1.default.Router();
const authService = new authService_1.AuthService();
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get token
 *     description: Login with username and password to get a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username
 *               password:
 *                 type: string
 *                 description: The user's password
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", async (req, res) => {
    const tracer = api_1.trace.getTracer("auth-api");
    return tracer.startActiveSpan("handle-login", async (span) => {
        try {
            const { username, password } = req.body;
            // Validation
            if (!username || !password) {
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "validation_error");
                logger_1.log.warn("Login attempt with missing credentials");
                span.end();
                return res
                    .status(400)
                    .json({ error: "Username and password are required" });
            }
            // Attempt login
            const token = await authService.login(username, password);
            if (!token) {
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "authentication_failed");
                span.end();
                return res.status(401).json({ error: "Invalid credentials" });
            }
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            span.end();
            return res.status(200).json({ token });
        }
        catch (error) {
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
            span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
            logger_1.log.error("Login request error", { error });
            span.end();
            return res.status(500).json({ error: "Authentication failed" });
        }
    });
});
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username
 *               password:
 *                 type: string
 *                 description: The user's password
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
router.post("/register", async (req, res) => {
    const tracer = api_1.trace.getTracer("auth-api");
    return tracer.startActiveSpan("handle-register", async (span) => {
        try {
            const { username, password } = req.body;
            // Validation
            if (!username || !password) {
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "validation_error");
                logger_1.log.warn("Registration attempt with missing fields");
                span.end();
                return res
                    .status(400)
                    .json({ error: "Username and password are required" });
            }
            // Attempt registration
            const success = await authService.register(username, password);
            if (!success) {
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "registration_failed");
                span.end();
                return res
                    .status(400)
                    .json({ error: "Registration failed. User may already exist." });
            }
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            span.end();
            return res.status(201).json({ message: "User registered successfully" });
        }
        catch (error) {
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
            span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
            logger_1.log.error("Registration request error", { error });
            span.end();
            return res.status(500).json({ error: "Registration failed" });
        }
    });
});
exports.default = router;
