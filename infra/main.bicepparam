// KwintBaseHarmony — Bicep parameters for Azure Container Apps deployment
//
// Prerequisites — run once before the first deployment:
//   1. Deploy the bootstrap secrets Key Vault:
//        az deployment group create \
//          --resource-group <your-rg> \
//          --template-file infra/secrets.bicep \
//          --parameters infra/secrets.bicepparam
//
//   2. Store the PostgreSQL admin password in it:
//        az keyvault secret set \
//          --vault-name kbh-secrets-prod \
//          --name postgres-admin-password \
//          --value '<your-secure-password>'
//
//   3. Fill in your subscription ID and resource group in the getSecret() call below.
//
// Subsequent deployments:
//   az deployment group create \
//     --resource-group <your-rg> \
//     --template-file infra/main.bicep \
//     --parameters infra/main.bicepparam

using 'main.bicep'

// Short label for this environment — used in all resource names.
param environmentName = 'prod'

// Azure region. Must match the resource group region.
param location = 'westeurope'

// PostgreSQL administrator username.
param postgresAdminLogin = 'kbhadmin'

// PostgreSQL admin password — pulled from the bootstrap Key Vault at deploy time.
// The deploying service principal must have Key Vault Secrets User on kbh-secrets-prod.
// Replace <subscription-id> and <resource-group> with your actual values.
param postgresAdminPassword = getSecret('<subscription-id>', '<resource-group>', 'kbh-secrets-prod', 'postgres-admin-password')

// Image tags are overridden by the CI/CD pipeline on each deployment.
param backendImageTag = 'latest'
param frontendImageTag = 'latest'
