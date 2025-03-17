provider "azurerm" {
  features {}
}

variable "location" {
  description = "The Azure region where resources should be created"
  default     = "East US"
}

variable "resource_group_name" {
  description = "The name of the resource group"
  default     = "ph-observability-chatbot-rg"
}

variable "app_name" {
  description = "Base name for the application resources"
  default     = "ph-chatbot"
}

variable "environment" {
  description = "Environment (dev, test, prod)"
  default     = "dev"
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
  
  tags = {
    Environment = var.environment
    Application = "PH Observability Chatbot"
  }
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "${replace(var.app_name, "-", "")}acr"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Standard"
  admin_enabled       = true
  
  tags = {
    Environment = var.environment
    Application = "PH Observability Chatbot"
  }
}

# Azure Key Vault
resource "azurerm_key_vault" "kv" {
  name                       = "${var.app_name}-kv"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    
    key_permissions = [
      "Get", "List", "Create", "Delete", "Update",
    ]
    
    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge",
    ]
  }
  
  tags = {
    Environment = var.environment
    Application = "PH Observability Chatbot"
  }
}

# App Service Plan
resource "azurerm_app_service_plan" "plan" {
  name                = "${var.app_name}-plan"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  kind                = "Linux"
  reserved            = true
  
  sku {
    tier = "Standard"
    size = "S1"
  }
  
  tags = {
    Environment = var.environment
    Application = "PH Observability Chatbot"
  }
}

# App Service
resource "azurerm_app_service" "app" {
  name                = "${var.app_name}-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  app_service_plan_id = azurerm_app_service_plan.plan.id
  
  # Configure as container app
  site_config {
    linux_fx_version = "DOCKER|${azurerm_container_registry.acr.login_server}/${var.app_name}:latest"
    always_on        = "true"
  }
  
  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_REGISTRY_SERVER_URL"          = "https://${azurerm_container_registry.acr.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"     = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"     = azurerm_container_registry.acr.admin_password
    "NODE_ENV"                            = "production"
    "AZURE_KEY_VAULT_NAME"                = azurerm_key_vault.kv.name
    "OTEL_EXPORTER_OTLP_ENDPOINT"         = "https://ingest.us0.signalfx.com/v2/trace/otlp"
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  tags = {
    Environment = var.environment
    Application = "PH Observability Chatbot"
  }
}

# Key Vault access policy for App Service
resource "azurerm_key_vault_access_policy" "app_policy" {
  key_vault_id = azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_app_service.app.identity.0.principal_id
  
  secret_permissions = [
    "Get", "List",
  ]
}

# Application Insights for monitoring
resource "azurerm_application_insights" "insights" {
  name                = "${var.app_name}-insights"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "web"
  
  tags = {
    Environment = var.environment
    Application = "PH Observability Chatbot"
  }
}

# Get current client configuration
data "azurerm_client_config" "current" {}

# Outputs
output "app_url" {
  value = "https://${azurerm_app_service.app.default_site_hostname}"
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "key_vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}

output "app_insights_key" {
  value     = azurerm_application_insights.insights.instrumentation_key
  sensitive = true
} 