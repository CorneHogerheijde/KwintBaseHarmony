// KwintBaseHarmony — Bootstrap secrets Key Vault
// Stores admin credentials (e.g. the PostgreSQL admin password) used during
// deployment. This vault is separate from the application Key Vault created
// by main.bicep and is deployed ONCE before the first main deployment.
//
// ─── One-time setup ────────────────────────────────────────────────────────
// 1. Deploy this template:
//      az deployment group create \
//        --resource-group <your-rg> \
//        --template-file infra/secrets.bicep \
//        --parameters infra/secrets.bicepparam
//
// 2. Store the PostgreSQL admin password:
//      az keyvault secret set \
//        --vault-name kbh-secrets-prod \
//        --name postgres-admin-password \
//        --value '<your-secure-password>'
//
// main.bicepparam then resolves the password via getSecret() at deploy time.
// ───────────────────────────────────────────────────────────────────────────

targetScope = 'resourceGroup'

@description('Globally unique name for the bootstrap secrets Key Vault (3–24 chars, alphanumeric and hyphens).')
param name string = 'kbh-secrets-prod'

@description('Azure region. Should match the resource group region.')
param location string = resourceGroup().location

@description('Resource tags.')
param tags object = {
  application: 'kwintbaseharmony'
  purpose: 'bootstrap-secrets'
}

@description('Object ID of the service principal that runs the CI/CD pipeline. Required so getSecret() can resolve secrets during az deployment group create.')
param deployingPrincipalObjectId string

module secretsKeyVault 'br/public:avm/res/key-vault/vault:0.13.3' = {
  name: 'secrets-key-vault'
  params: {
    name: name
    location: location
    tags: tags
    sku: 'standard'
    enablePurgeProtection: true
    softDeleteRetentionInDays: 7
    enableRbacAuthorization: true
    roleAssignments: [
      {
        // Grant the CI/CD service principal read access so getSecret() works during deployment.
        principalId: deployingPrincipalObjectId
        roleDefinitionIdOrName: 'Key Vault Secrets User'
        principalType: 'ServicePrincipal'
      }
    ]
  }
}

output vaultName string = secretsKeyVault.outputs.name
output vaultResourceId string = secretsKeyVault.outputs.resourceId
