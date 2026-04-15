# Infrastructure — Azure Container Apps (AVM Bicep)

KwintBaseHarmony is deployed to Azure Container Apps using [Azure Verified Modules (AVM)](https://aka.ms/avm) Bicep templates and a GitHub Actions CI/CD pipeline.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Container Apps Environment                          │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │  Frontend App   │──▶│  Backend API App          │ │
│  │  (ASP.NET Core) │   │  (ASP.NET Core + EF Core) │ │
│  └─────────────────┘   └──────────┬───────────────┘ │
└────────────────────────────────────┼────────────────┘
                                     │
            ┌────────────────────────┼──────────────────┐
            ▼                        ▼                   ▼
     Azure Container          Azure Database         Key Vault
      Registry (ACR)       for PostgreSQL            (secrets)
```

**Resources provisioned:**
- Log Analytics Workspace
- Azure Container Registry (Basic)
- User-Assigned Managed Identity (for ACR pull + Key Vault access)
- Azure Database for PostgreSQL Flexible Server (Burstable B1ms)
- Key Vault (stores the PostgreSQL connection string)
- Container Apps Environment
- Backend Container App (`kbh-api-*`)
- Frontend Container App (`kbh-frontend-*`)

## First-Time Setup

These one-time steps are required before the GitHub Actions pipeline can run.

### 1. Create an Azure Resource Group

```bash
az group create --name rg-kwintbaseharmony-prod --location westeurope
```

### 2. Create an Azure AD App Registration + Federated Credential

```bash
# Create app registration
APP_ID=$(az ad app create --display-name "kwintbaseharmony-cicd" --query appId -o tsv)

# Create service principal
SP_ID=$(az ad sp create --id $APP_ID --query id -o tsv)

# Assign Contributor on the resource group
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
az role assignment create \
  --role Contributor \
  --assignee $SP_ID \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-kwintbaseharmony-prod

# Add federated credential for GitHub Actions OIDC
TENANT_ID=$(az account show --query tenantId -o tsv)
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<your-org>/<your-repo>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'

echo "CLIENT_ID=$APP_ID  TENANT_ID=$TENANT_ID  SUBSCRIPTION_ID=$SUBSCRIPTION_ID"
```

### 3. Initial Bicep Deployment

The pipeline needs an ACR login server to push images. Bootstrap the infrastructure first:

```bash
az deployment group create \
  --resource-group rg-kwintbaseharmony-prod \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam \
  --parameters postgresAdminPassword='<your-strong-password>'
```

After this completes, retrieve the ACR login server:

```bash
az deployment group show \
  --resource-group rg-kwintbaseharmony-prod \
  --name main \
  --query properties.outputs.containerRegistryLoginServer.value \
  -o tsv
```

### 4. Configure GitHub Actions Variables and Secrets

In your GitHub repository → **Settings → Secrets and variables → Actions**:

**Variables** (not secret):

| Name | Value |
|------|-------|
| `AZURE_CLIENT_ID` | App registration Client ID from step 2 |
| `AZURE_TENANT_ID` | Azure AD Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID |
| `AZURE_RESOURCE_GROUP` | `rg-kwintbaseharmony-prod` |
| `AZURE_ACR_LOGIN_SERVER` | ACR login server from step 3 (e.g. `kbhacrXXXXXXXX.azurecr.io`) |

**Secrets**:

| Name | Value |
|------|-------|
| `POSTGRES_ADMIN_PASSWORD` | The PostgreSQL admin password |

### 5. Push to Main

Once the above is configured, every push to `main` triggers the pipeline which:
1. Builds and pushes Docker images to ACR (tagged with the commit SHA)
2. Runs `az deployment group create` with the image tags

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `environmentName` | `prod` | Environment label used in resource names |
| `location` | RG location | Azure region |
| `postgresAdminLogin` | `kbhadmin` | PostgreSQL admin username |
| `postgresAdminPassword` | *(required)* | PostgreSQL admin password — pipeline secret |
| `backendImageTag` | `latest` | Docker image tag for the backend |
| `frontendImageTag` | `latest` | Docker image tag for the frontend |

## Local Development

Local development still uses Docker Compose with the standard setup. See [RUNNING_LOCALLY.md](../RUNNING_LOCALLY.md).
