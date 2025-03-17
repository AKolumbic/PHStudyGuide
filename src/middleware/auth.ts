import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { log } from "../config/logger";
import { trace } from "@opentelemetry/api";

// Define interface for JWT payload
interface TokenPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tracer = trace.getTracer("auth-middleware");

  return tracer.startActiveSpan("authenticate-token", (span) => {
    try {
      // Get the token from the Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN format

      if (!token) {
        span.setStatus({ code: trace.SpanStatusCode.ERROR });
        span.setAttribute("error.type", "missing_token");
        log.warn("Authentication failed: Missing token");

        span.end();
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        span.setStatus({ code: trace.SpanStatusCode.ERROR });
        span.setAttribute("error.type", "missing_secret");
        log.error("JWT secret is not configured");

        span.end();
        return res.status(500).json({ error: "Server configuration error" });
      }

      jwt.verify(token, secret, (err, payload) => {
        if (err) {
          span.setStatus({ code: trace.SpanStatusCode.ERROR });
          span.setAttribute("error.type", "invalid_token");
          span.setAttribute("error.message", err.message);
          log.warn("Authentication failed: Invalid token", {
            error: err.message,
          });

          span.end();
          return res.status(403).json({ error: "Invalid or expired token" });
        }

        // Add user data to request
        req.user = payload as TokenPayload;

        span.setAttribute("user.id", req.user.userId);
        span.setStatus({ code: trace.SpanStatusCode.OK });
        span.end();

        // Continue to the next middleware/route handler
        next();
      });
    } catch (error) {
      span.setStatus({ code: trace.SpanStatusCode.ERROR });
      span.setAttribute(
        "error.type",
        error instanceof Error ? error.name : "unknown"
      );
      span.setAttribute(
        "error.message",
        error instanceof Error ? error.message : "Unknown error"
      );

      log.error("Unexpected error in authentication", { error });

      span.end();
      return res.status(500).json({ error: "Authentication failed" });
    }
  });
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = (userId: string, username: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    log.error("JWT secret is not configured");
    throw new Error("JWT secret is not configured");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  return jwt.sign({ userId, username }, secret, { expiresIn });
};
