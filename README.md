# PH Observability Chatbot

A cloud-native intelligent chatbot with comprehensive observability features designed to demonstrate integration of technologies highlighted in the PH Observability Team interview study guide.

## Features

- **Cloud-Native Architecture**: Built with Node.js and TypeScript following cloud-native best practices
- **Observability Integration**: Comprehensive OpenTelemetry instrumentation for metrics, logs, and traces
- **AI Integration**: Powered by OpenAI's GPT models for intelligent responses
- **Secure Authentication**: JWT-based authentication for API security
- **Cloud Integration**: Azure Key Vault for secrets management
- **Documentation**: API documentation with Swagger
- **Containerization**: Docker support for easy deployment
- **CI/CD Pipeline**: Azure DevOps pipeline configuration

## Technology Stack

- **Backend**: Node.js, TypeScript, Express
- **Observability**: OpenTelemetry, Winston for logging
- **AI**: OpenAI GPT models
- **Authentication**: JWT
- **Cloud Services**: Azure Key Vault, Azure App Service
- **Documentation**: Swagger/OpenAPI
- **DevOps**: Docker, Azure DevOps

## Getting Started

### Prerequisites

- Node.js 18 or later
- OpenAI API key
- (Optional) Azure subscription for Key Vault and deployment

### Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ph-observability-chatbot.git
   cd ph-observability-chatbot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your OpenAI API key and other configuration values.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. The application will be available at http://localhost:3000. API documentation is available at http://localhost:3000/api-docs.

### Docker Deployment

1. Build the Docker image:

   ```bash
   docker build -t ph-observability-chatbot .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env ph-observability-chatbot
   ```

## Observability Features

### Metrics, Logs, and Traces

The application is fully instrumented with OpenTelemetry to provide:

- **Metrics**: Performance metrics including API request rates, response times, and error rates
- **Logs**: Structured logging with correlation IDs for request tracing
- **Traces**: Distributed tracing across API calls, database operations, and external services

### Integration with Splunk

Traces are exported in OTLP format, which can be ingested by Splunk Observability Cloud or any other OpenTelemetry-compatible backend.

## API Documentation

API documentation is available at `/api-docs` when the application is running. The documentation is generated using Swagger/OpenAPI.

## CI/CD Pipeline

The repository includes an Azure DevOps pipeline configuration (`azure-pipelines.yml`) that:

1. Builds and tests the application
2. Creates a Docker image
3. Pushes the image to Azure Container Registry
4. Deploys the container to Azure App Service

## Architecture

The application follows a clean architecture pattern with the following components:

- **API Layer**: Express routes and controllers
- **Service Layer**: Business logic and external service integration
- **Data Layer**: Conversational state management (in-memory for the demo)
- **Infrastructure**: Observability, authentication, and cloud service integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
