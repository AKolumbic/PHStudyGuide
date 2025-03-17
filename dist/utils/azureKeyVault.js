"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecret = exports.initializeKeyVault = void 0;
const identity_1 = require("@azure/identity");
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const logger_1 = require("../config/logger");
const api_1 = require("@opentelemetry/api");
// Use environment variables for configuration
const keyVaultName = process.env.AZURE_KEY_VAULT_NAME || "";
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
// Create a secret client using the default Azure credential
let secretClient = null;
/**
 * Initialize the Azure Key Vault client
 */
const initializeKeyVault = () => {
    try {
        if (!keyVaultName) {
            logger_1.log.warn("Azure Key Vault name not provided in environment variables");
            return;
        }
        const credential = new identity_1.DefaultAzureCredential();
        secretClient = new keyvault_secrets_1.SecretClient(keyVaultUrl, credential);
        logger_1.log.info("Azure Key Vault client initialized successfully");
    }
    catch (error) {
        logger_1.log.error("Failed to initialize Azure Key Vault client", { error });
    }
};
exports.initializeKeyVault = initializeKeyVault;
/**
 * Get a secret from Azure Key Vault
 */
const getSecret = async (secretName) => {
    const tracer = api_1.trace.getTracer("azure-key-vault");
    return tracer.startActiveSpan("get-secret", async (span) => {
        try {
            // If client is not initialized, try to initialize it
            if (!secretClient) {
                (0, exports.initializeKeyVault)();
                // If still not initialized, return undefined
                if (!secretClient) {
                    span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                    span.setAttribute("error.type", "client_not_initialized");
                    span.setAttribute("keyvault.name", keyVaultName);
                    logger_1.log.error("Key Vault client not initialized");
                    return undefined;
                }
            }
            span.setAttribute("keyvault.name", keyVaultName);
            span.setAttribute("secret.name", secretName);
            // Retrieve the secret
            const secret = await secretClient.getSecret(secretName);
            const secretValue = secret.value;
            if (!secretValue) {
                span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                span.setAttribute("error.type", "secret_not_found");
                logger_1.log.warn(`Secret '${secretName}' not found or empty`);
                return undefined;
            }
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            logger_1.log.info(`Successfully retrieved secret '${secretName}'`);
            return secretValue;
        }
        catch (error) {
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            span.setAttribute("error.type", error instanceof Error ? error.name : "unknown");
            span.setAttribute("error.message", error instanceof Error ? error.message : "Unknown error");
            logger_1.log.error(`Failed to retrieve secret '${secretName}'`, { error });
            return undefined;
        }
        finally {
            span.end();
        }
    });
};
exports.getSecret = getSecret;
