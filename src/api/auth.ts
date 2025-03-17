import express from "express";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { log } from "../config/logger";
import { AuthService } from "../services/authService";

const router = express.Router();
const authService = new AuthService();

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
  const tracer = trace.getTracer("auth-api");

  return tracer.startActiveSpan("handle-login", async (span) => {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute("error.type", "validation_error");
        log.warn("Login attempt with missing credentials");

        span.end();
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      // Attempt login
      const token = await authService.login(username, password);

      if (!token) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute("error.type", "authentication_failed");

        span.end();
        return res.status(401).json({ error: "Invalid credentials" });
      }

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return res.status(200).json({ token });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.setAttribute(
        "error.type",
        error instanceof Error ? error.name : "unknown"
      );
      span.setAttribute(
        "error.message",
        error instanceof Error ? error.message : "Unknown error"
      );

      log.error("Login request error", { error });

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
  const tracer = trace.getTracer("auth-api");

  return tracer.startActiveSpan("handle-register", async (span) => {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute("error.type", "validation_error");
        log.warn("Registration attempt with missing fields");

        span.end();
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      // Attempt registration
      const success = await authService.register(username, password);

      if (!success) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute("error.type", "registration_failed");

        span.end();
        return res
          .status(400)
          .json({ error: "Registration failed. User may already exist." });
      }

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.setAttribute(
        "error.type",
        error instanceof Error ? error.name : "unknown"
      );
      span.setAttribute(
        "error.message",
        error instanceof Error ? error.message : "Unknown error"
      );

      log.error("Registration request error", { error });

      span.end();
      return res.status(500).json({ error: "Registration failed" });
    }
  });
});

export default router;
