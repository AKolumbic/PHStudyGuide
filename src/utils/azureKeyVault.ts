import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { log } from "../config/logger";
import { trace, SpanStatusCode } from "@opentelemetry/api";

// Use environment variables for configuration
const keyVaultName = process.env.AZURE_KEY_VAULT_NAME || "";
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;

// Create a secret client using the default Azure credential
let secretClient: SecretClient | null = null;

/**
 * Initialize the Azure Key Vault client
 */
export const initializeKeyVault = (): void => {
  try {
    if (!keyVaultName) {
      log.warn("Azure Key Vault name not provided in environment variables");
      return;
    }

    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(keyVaultUrl, credential);

    log.info("Azure Key Vault client initialized successfully");
  } catch (error) {
    log.error("Failed to initialize Azure Key Vault client", { error });
  }
};

/**
 * Get a secret from Azure Key Vault
 */
export const getSecret = async (
  secretName: string
): Promise<string | undefined> => {
  const tracer = trace.getTracer("azure-key-vault");

  return tracer.startActiveSpan("get-secret", async (span) => {
    try {
      // If client is not initialized, try to initialize it
      if (!secretClient) {
        initializeKeyVault();

        // If still not initialized, return undefined
        if (!secretClient) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.setAttribute("error.type", "client_not_initialized");
          span.setAttribute("keyvault.name", keyVaultName);

          log.error("Key Vault client not initialized");
          return undefined;
        }
      }

      span.setAttribute("keyvault.name", keyVaultName);
      span.setAttribute("secret.name", secretName);

      // Retrieve the secret
      const secret = await secretClient.getSecret(secretName);
      const secretValue = secret.value;

      if (!secretValue) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute("error.type", "secret_not_found");

        log.warn(`Secret '${secretName}' not found or empty`);
        return undefined;
      }

      span.setStatus({ code: SpanStatusCode.OK });
      log.info(`Successfully retrieved secret '${secretName}'`);

      return secretValue;
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

      log.error(`Failed to retrieve secret '${secretName}'`, { error });

      return undefined;
    } finally {
      span.end();
    }
  });
};
