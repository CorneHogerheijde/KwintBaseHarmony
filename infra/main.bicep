// KwintBaseHarmony — Azure Container Apps infrastructure
// Uses Azure Verified Modules (AVM) for all resources.
// Deploy with:
//   az deployment group create \
//     --resource-group <rg-name> \
//     --template-file infra/main.bicep \
//     --parameters infra/main.bicepparam

targetScope = 'resourceGroup'

// ── Parameters ────────────────────────────────────────────────────────────────

@description('Short name for the environment (e.g. prod, staging). Used in resource names.')
@minLength(1)
@maxLength(10)
param environmentName string

@description('Azure region for all resources. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('PostgreSQL admin login name.')
param postgresAdminLogin string = 'kbhadmin'

@description('PostgreSQL admin password. Store this in a pipeline secret — never commit it.')
@secure()
param postgresAdminPassword string

@description('Backend Docker image tag to deploy (e.g. sha of the latest commit).')
param backendImageTag string = 'latest'

@description('Frontend Docker image tag to deploy.')
param frontendImageTag string = 'latest'

// ── Naming ────────────────────────────────────────────────────────────────────

// A short, unique, lowercase token derived from the resource group and environment name.
// Keeps all resource names globally unique without being too long.
var resourceToken = take(toLower(uniqueString(resourceGroup().id, environmentName)), 8)

var acrName         = 'kbhacr${resourceToken}'              // alphanumeric only, max 50 chars
var lawName         = 'kbh-law-${resourceToken}'
var kvName          = 'kbh-kv-${resourceToken}'             // max 24 chars
var pgName          = 'kbh-pg-${resourceToken}'
var identityName    = 'kbh-id-${resourceToken}'
var caeName         = 'kbh-cae-${resourceToken}'
var backendAppName  = 'kbh-api-${resourceToken}'
var frontendAppName = 'kbh-frontend-${resourceToken}'

var tags = {
  application: 'kwintbaseharmony'
  environment: environmentName
}

// ── Log Analytics Workspace ───────────────────────────────────────────────────

module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.15.0' = {
  name: 'log-analytics'
  params: {
    name: lawName
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
  }
}

// ── Container Registry ────────────────────────────────────────────────────────

module acr 'br/public:avm/res/container-registry/registry:0.12.1' = {
  name: 'container-registry'
  params: {
    name: acrName
    location: location
    tags: tags
    acrSku: 'Basic'
    // Best practice: never allow anonymous pull
    anonymousPullEnabled: false
    // Grant the managed identity AcrPull so Container Apps can pull images.
    roleAssignments: [
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'AcrPull'
        principalType: 'ServicePrincipal'
      }
    ]
  }
}

// ── Managed Identity ──────────────────────────────────────────────────────────
// Used by Container Apps to pull images from ACR and read secrets from Key Vault.

module managedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.5.0' = {
  name: 'managed-identity'
  params: {
    name: identityName
    location: location
    tags: tags
  }
}

// ── ACR role assignment: AcrPull → managed identity is defined within the ACR module above ──

// ── PostgreSQL Flexible Server ────────────────────────────────────────────────

module postgres 'br/public:avm/res/db-for-postgre-sql/flexible-server:0.15.2' = {
  name: 'postgresql'
  params: {
    name: pgName
    location: location
    tags: tags
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    skuName: 'Standard_B1ms'
    tier: 'Burstable'
    version: '16'
    availabilityZone: -1
    highAvailability: 'Disabled'
    backupRetentionDays: 7
    databases: [
      {
        name: 'kwintbaseharmony'
        charset: 'UTF8'
        collation: 'en_US.utf8'
      }
    ]
    // Allow all Azure-internal traffic (0.0.0.0 → 0.0.0.0 is the Azure services rule)
    firewallRules: [
      {
        name: 'AllowAzureServices'
        startIpAddress: '0.0.0.0'
        endIpAddress: '0.0.0.0'
      }
    ]
  }
}

// ── Key Vault ─────────────────────────────────────────────────────────────────
// Stores the PostgreSQL connection string; never hardcode credentials in Bicep.

module keyVault 'br/public:avm/res/key-vault/vault:0.13.3' = {
  name: 'key-vault'
  params: {
    name: kvName
    location: location
    tags: tags
    sku: 'standard'
    // Best practice: always enable purge protection on Key Vault
    enablePurgeProtection: true
    softDeleteRetentionInDays: 7
    enableRbacAuthorization: true
    secrets: [
      {
        name: 'postgres-connection-string'
        #disable-next-line use-safe-access
        value: 'Host=${postgres.outputs.fqdn};Port=5432;Database=kwintbaseharmony;Username=${postgresAdminLogin};Password=${postgresAdminPassword};SslMode=Require'
      }
    ]
    roleAssignments: [
      {
        principalId: managedIdentity.outputs.principalId
        roleDefinitionIdOrName: 'Key Vault Secrets User'
        principalType: 'ServicePrincipal'
      }
    ]
  }
}

// ── Container Apps Environment ────────────────────────────────────────────────

module containerAppsEnv 'br/public:avm/res/app/managed-environment:0.13.2' = {
  name: 'container-apps-env'
  params: {
    name: caeName
    location: location
    tags: tags
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsWorkspaceResourceId: logAnalytics.outputs.resourceId
    }
  }
}

// ── Backend Container App ─────────────────────────────────────────────────────
// The frontend FQDN is constructed from known names + the environment's default domain.
// This avoids a circular dependency (backend CORS ← frontend FQDN ← backend URL).

var frontendFqdn = '${frontendAppName}.${containerAppsEnv.outputs.defaultDomain}'

module backendApp 'br/public:avm/res/app/container-app:0.22.0' = {
  name: 'backend-container-app'
  params: {
    name: backendAppName
    location: location
    tags: tags
    environmentResourceId: containerAppsEnv.outputs.resourceId
    managedIdentities: {
      userAssignedResourceIds: [
        managedIdentity.outputs.resourceId
      ]
    }
    // Reference the PostgreSQL connection string from Key Vault via the managed identity.
    secrets: [
      {
        name: 'postgres-connection-string'
        keyVaultUrl: 'https://${kvName}${environment().suffixes.keyvaultDns}/secrets/postgres-connection-string'
        identity: managedIdentity.outputs.resourceId
      }
    ]
    // Grant the Container App permission to pull images from ACR.
    registries: [
      {
        server: acr.outputs.loginServer
        identity: managedIdentity.outputs.resourceId
      }
    ]
    containers: [
      {
        name: 'api'
        image: '${acr.outputs.loginServer}/kwintbaseharmony-api:${backendImageTag}'
        resources: {
          cpu: any('0.5')
          memory: '1Gi'
        }
        env: [
          {
            name: 'ASPNETCORE_ENVIRONMENT'
            value: 'Production'
          }
          {
            name: 'ConnectionStrings__DefaultConnection'
            secretRef: 'postgres-connection-string'
          }
          // Allow the frontend Container App as a CORS origin.
          {
            name: 'Cors__AllowedOrigins__0'
            value: 'https://${frontendFqdn}'
          }
        ]
      }
    ]
    // Best practice: match ingressTargetPort to the port the container listens on.
    // .NET 10 runtime images default to port 8080 (ASPNETCORE_HTTP_PORTS=8080).
    ingressExternal: true
    ingressTargetPort: 8080
    ingressAllowInsecure: false
    // Dapr sidecar for service-to-service invocation
    dapr: {
      enabled: true
      appId: 'kwintbaseharmony-api'
      appPort: 8080
      appProtocol: 'http'
    }
    scaleSettings: {
      minReplicas: 1
      maxReplicas: 5
    }
  }
}

// ── Frontend Container App ────────────────────────────────────────────────────

var backendFqdn = '${backendAppName}.${containerAppsEnv.outputs.defaultDomain}'

module frontendApp 'br/public:avm/res/app/container-app:0.22.0' = {
  name: 'frontend-container-app'
  params: {
    name: frontendAppName
    location: location
    tags: tags
    environmentResourceId: containerAppsEnv.outputs.resourceId
    managedIdentities: {
      userAssignedResourceIds: [
        managedIdentity.outputs.resourceId
      ]
    }
    registries: [
      {
        server: acr.outputs.loginServer
        identity: managedIdentity.outputs.resourceId
      }
    ]
    containers: [
      {
        name: 'frontend'
        image: '${acr.outputs.loginServer}/kwintbaseharmony-frontend:${frontendImageTag}'
        resources: {
          cpu: any('0.25')
          memory: '0.5Gi'
        }
        env: [
          {
            name: 'ASPNETCORE_ENVIRONMENT'
            value: 'Production'
          }
          // Tells the /app-config.js endpoint what URL the JS should call for the API.
          {
            name: 'API_BASE_URL'
            value: 'https://${backendFqdn}'
          }
        ]
      }
    ]
    ingressExternal: true
    ingressTargetPort: 8080
    ingressAllowInsecure: false
    dapr: {
      enabled: true
      appId: 'kwintbaseharmony-frontend'
      appPort: 8080
      appProtocol: 'http'
    }
    scaleSettings: {
      minReplicas: 1
      maxReplicas: 3
    }
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

output containerRegistryLoginServer string = acr.outputs.loginServer
output containerRegistryName string = acr.outputs.name
output backendUrl string = 'https://${backendApp.outputs.fqdn}'
output frontendUrl string = 'https://${frontendApp.outputs.fqdn}'
output keyVaultName string = keyVault.outputs.name
output postgresServerName string = postgres.outputs.name
