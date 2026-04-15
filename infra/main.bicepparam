// KwintBaseHarmony — Bicep parameters for Azure Container Apps deployment
// Usage:
//   az deployment group create \
//     --resource-group <your-rg> \
//     --template-file infra/main.bicep \
//     --parameters infra/main.bicepparam
//
// Secrets (postgresAdminPassword) should be passed from pipeline secrets, e.g.:
//   --parameters postgresAdminPassword=${{ secrets.POSTGRES_ADMIN_PASSWORD }}

using 'main.bicep'

// Short label for this environment — used in all resource names.
param environmentName = 'prod'

// Azure region. Must match the resource group region.
param location = 'westeurope'

// PostgreSQL administrator username.
param postgresAdminLogin = 'kbhadmin'

// DO NOT set postgresAdminPassword here — pass it as a pipeline secret.
// param postgresAdminPassword = '<set-via-pipeline-secret>'

// Image tags are overridden by the CI/CD pipeline on each deployment.
param backendImageTag = 'latest'
param frontendImageTag = 'latest'
