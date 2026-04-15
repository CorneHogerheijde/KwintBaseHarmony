// This file is used ONLY for local snapshot testing.
// The postgresAdminPassword here is a placeholder — never use this value in a real deployment.
using 'main.bicep'

param environmentName = 'test'
param location = 'westeurope'
param postgresAdminLogin = 'kbhadmin'
param postgresAdminPassword = 'Placeholder_P@ssw0rd_ForSnapshotOnly!'
param backendImageTag = 'abc1234'
param frontendImageTag = 'abc1234'
