// Bootstrap secrets Key Vault parameters.
// See infra/secrets.bicep for setup instructions.

using 'secrets.bicep'

// Must match the vault name referenced in main.bicepparam's getSecret() call.
param name = 'kbh-secrets-prod'

param location = 'westeurope'

param tags = {
  application: 'kwintbaseharmony'
  purpose: 'bootstrap-secrets'
}

// Object ID (not client ID) of the GitHub Actions service principal.
// Find it with: az ad sp show --id $AZURE_CLIENT_ID --query id -o tsv
// Or in the Azure Portal: App registrations → your app → Overview → Object ID
param deployingPrincipalObjectId = '<service-principal-object-id>'
