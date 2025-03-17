"use strict";
// Define swagger spec directly without using swagger-jsdoc
Object.defineProperty(exports, "__esModule", { value: true });
// Remove module declaration
// declare module "swagger-jsdoc";
const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "PH Observability Chatbot API",
        version: "1.0.0",
        description: "An intelligent chatbot API with comprehensive observability",
        license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT",
        },
        contact: {
            name: "API Support",
            email: "support@example.com",
        },
    },
    servers: [
        {
            url: "/api",
            description: "Development server",
        },
    ],
    paths: {
        "/auth/login": {
            post: {
                summary: "Authenticate user and get token",
                description: "Login with username and password to get a JWT token",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password"],
                                properties: {
                                    username: {
                                        type: "string",
                                        description: "The user's username",
                                    },
                                    password: {
                                        type: "string",
                                        description: "The user's password",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Successful login",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        token: {
                                            type: "string",
                                            description: "JWT token for authentication",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "401": {
                        description: "Invalid credentials",
                    },
                    "500": {
                        description: "Server error",
                    },
                },
            },
        },
        "/auth/register": {
            post: {
                summary: "Register a new user",
                description: "Create a new user account",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password"],
                                properties: {
                                    username: {
                                        type: "string",
                                        description: "The user's username",
                                    },
                                    password: {
                                        type: "string",
                                        description: "The user's password",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "User created",
                    },
                    "400": {
                        description: "Invalid input or user already exists",
                    },
                    "500": {
                        description: "Server error",
                    },
                },
            },
        },
        "/chatbot/chat": {
            post: {
                summary: "Send a message to the chatbot",
                description: "Process a user message and get a response from the chatbot",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["message"],
                                properties: {
                                    message: {
                                        type: "string",
                                        description: "The user's message",
                                    },
                                    conversationId: {
                                        type: "string",
                                        description: "Optional conversation ID for continuing a conversation",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Successful response",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        response: {
                                            type: "string",
                                            description: "The chatbot's response",
                                        },
                                        conversationId: {
                                            type: "string",
                                            description: "Conversation ID for future reference",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": {
                        description: "Bad request",
                    },
                    "401": {
                        description: "Unauthorized",
                    },
                    "500": {
                        description: "Server error",
                    },
                },
            },
        },
        "/chatbot/health": {
            get: {
                summary: "Check chatbot health",
                description: "Returns the health status of the chatbot service",
                responses: {
                    "200": {
                        description: "Service is healthy",
                    },
                    "500": {
                        description: "Service is unhealthy",
                    },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ChatRequest: {
                type: "object",
                required: ["message"],
                properties: {
                    message: {
                        type: "string",
                        description: "The message to send to the chatbot",
                    },
                    conversationId: {
                        type: "string",
                        description: "Optional conversation ID for continuing a conversation",
                    },
                },
            },
            ChatResponse: {
                type: "object",
                properties: {
                    response: {
                        type: "string",
                        description: "The chatbot response",
                    },
                    conversationId: {
                        type: "string",
                        description: "Conversation ID for future reference",
                    },
                },
            },
            Error: {
                type: "object",
                properties: {
                    error: {
                        type: "string",
                        description: "Error message",
                    },
                },
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};
exports.default = swaggerSpec;
