import { generateToken } from "../middleware/auth";
import { log } from "../config/logger";
import { trace } from "@opentelemetry/api";

// Simple in-memory user storage for demo
// In a real application, this would be stored in a database
const users = new Map<
  string,
  {
    userId: string;
    username: string;
    password: string; // In a real app, this would be hashed
  }
>();

// Initialize with a test user
users.set("test", {
  userId: "1",
  username: "test",
  password: "password123", // Would be hashed in production
});

export class AuthService {
  /**
   * Authenticate a user and generate a JWT token
   */
  public async login(
    username: string,
    password: string
  ): Promise<string | null> {
    const tracer = trace.getTracer("auth-service");

    return tracer.startActiveSpan("login-user", async (span) => {
      try {
        span.setAttribute("auth.username", username);

        // Find user
        const user = users.get(username);

        if (!user) {
          span.setStatus({ code: trace.SpanStatusCode.ERROR });
          span.setAttribute("error.type", "user_not_found");

          log.warn(`Login failed: User ${username} not found`);
          return null;
        }

        // Check password
        if (user.password !== password) {
          span.setStatus({ code: trace.SpanStatusCode.ERROR });
          span.setAttribute("error.type", "invalid_password");

          log.warn(`Login failed: Invalid password for user ${username}`);
          return null;
        }

        // Generate token
        const token = generateToken(user.userId, user.username);

        span.setStatus({ code: trace.SpanStatusCode.OK });
        log.info(`User ${username} logged in successfully`);

        return token;
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

        log.error("Login error", { error });

        return null;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Register a new user
   */
  public async register(username: string, password: string): Promise<boolean> {
    const tracer = trace.getTracer("auth-service");

    return tracer.startActiveSpan("register-user", async (span) => {
      try {
        span.setAttribute("auth.username", username);

        // Check if user already exists
        if (users.has(username)) {
          span.setStatus({ code: trace.SpanStatusCode.ERROR });
          span.setAttribute("error.type", "user_already_exists");

          log.warn(`Registration failed: User ${username} already exists`);
          return false;
        }

        // Create new user
        const userId = `${users.size + 1}`;
        users.set(username, {
          userId,
          username,
          password, // Would be hashed in production
        });

        span.setStatus({ code: trace.SpanStatusCode.OK });
        log.info(`User ${username} registered successfully`);

        return true;
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

        log.error("Registration error", { error });

        return false;
      } finally {
        span.end();
      }
    });
  }
}
