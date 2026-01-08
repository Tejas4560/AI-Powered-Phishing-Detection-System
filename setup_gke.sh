#!/bin/bash

# GKE Setup Automation Script
# This script automates the setup of a GKE cluster and related resources.

set -e  # Exit on error

# Configuration
CLUSTER_NAME="networksecurity-cluster"
ZONE="us-central1-a"
REGION="us-central1"
SERVICE_ACCOUNT_NAME="github-actions"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting GKE Setup...${NC}"

# Check for gcloud
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    exit 1
fi

# Get Project ID
PROJECT_ID=$(gcloud config get-value project)
echo "Using Project ID: $PROJECT_ID"

# 1. Enable APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable container.googleapis.com \
    artifactregistry.googleapis.com \
    iam.googleapis.com

# 2. Create GKE Cluster
echo -e "${GREEN}Creating GKE Cluster '$CLUSTER_NAME' (this may take a few minutes)...${NC}"
if ! gcloud container clusters describe $CLUSTER_NAME --zone $ZONE &> /dev/null; then
    gcloud container clusters create $CLUSTER_NAME \
        --zone $ZONE \
        --num-nodes 1 \
        --machine-type e2-medium \
        --scopes=https://www.googleapis.com/auth/cloud-platform
else
    echo "Cluster already exists."
fi

# 3. Get Credentials
echo -e "${GREEN}Getting cluster credentials...${NC}"
gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE

# 4. Create Kubernetes Secrets
echo -e "${GREEN}Creating Kubernetes Secrets...${NC}"
# Prompt for bucket name if not set
if [ -z "$GCS_BUCKET_NAME" ]; then
    read -p "Enter your GCS Bucket Name (e.g., networksecurity-data): " GCS_BUCKET_NAME
fi

# Check if secret exists, delete if so to update
if kubectl get secret networksecurity-secrets &> /dev/null; then
    kubectl delete secret networksecurity-secrets
fi

kubectl create secret generic networksecurity-secrets \
    --from-literal=GCS_BUCKET_NAME=$GCS_BUCKET_NAME \
    --from-literal=GCS_DATA_FILE=phisingData.csv

# 5. IAM Configuration for GitHub Actions
echo -e "${GREEN}Configuring IAM for GitHub Actions...${NC}"
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create SA if it doesn't exist
if ! gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions Service Account"
fi

# Add roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.writer"

echo -e "${GREEN}Setup Complete!${NC}"
echo "------------------------------------------------"
echo "Next Steps:"
echo "1. Add these secrets to your GitHub Repository:"
echo "   - GKE_CLUSTER_NAME: $CLUSTER_NAME"
echo "   - GKE_ZONE: $ZONE"
echo "   - GCP_PROJECT_ID: $PROJECT_ID"
echo "   (And ensure GCP_SA_KEY is updated if you rotated keys)"
echo ""
echo "2. Push your code to the 'main' branch to trigger deployment."
