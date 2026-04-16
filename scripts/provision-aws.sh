#!/usr/bin/env bash
set -euo pipefail

# AWS Infrastructure Provisioning Script for Space Visualiser
# Purpose: Idempotently provision ECS, RDS, ElastiCache, Secrets Manager, and IAM resources
# Usage: ./scripts/provision-aws.sh
# Prerequisites: AWS CLI configured with credentials, jq installed
#
# WARNINGS:
#   - RDS is set to --publicly-accessible for simplicity; restrict security group in production
#   - ElastiCache has no auth token; restrict security group to ECS task SG in production
#   - RDS and ElastiCache take 10-20 minutes to become available; monitor AWS console
#   - Update NASA_API_KEY in Secrets Manager before deploying
#   - Database password is generated on first run and stored in Secrets Manager immediately

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME="space-visualiser"
BACKEND_REPO="space-visualiser-api"
FRONTEND_REPO="space-visualiser-frontend"
DB_INSTANCE_ID="space-visualiser-db"
DB_NAME="spacedb"
DB_USER="space_admin"
DB_PORT="5432"
REDIS_ID="space-visualiser-redis"
SECRET_NAME="space-visualiser/api-secrets"
EXECUTION_ROLE_NAME="ecsTaskExecutionRole"
LOG_GROUP="/ecs/space-visualiser"
TASK_FAMILY="space-visualiser"

echo "=========================================="
echo "Space Visualiser AWS Infrastructure Setup"
echo "=========================================="
echo "Region:  $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# ============================================================================
# 1. ECS Cluster
# ============================================================================
echo "[1/8] Setting up ECS Cluster..."
if aws ecs describe-clusters --clusters "$CLUSTER_NAME" \
      --region "$REGION" \
      --query "clusters[?status=='ACTIVE'].clusterName" \
      --output text 2>/dev/null | grep -q "$CLUSTER_NAME"; then
    echo "  [SKIP] ECS cluster $CLUSTER_NAME already exists"
else
    aws ecs create-cluster --cluster-name "$CLUSTER_NAME" --region "$REGION" > /dev/null
    echo "  [OK] Created ECS cluster $CLUSTER_NAME"
fi
echo ""

# ============================================================================
# 2. ECR Repositories
# ============================================================================
echo "[2/8] Setting up ECR Repositories..."
for REPO in "$BACKEND_REPO" "$FRONTEND_REPO"; do
    if aws ecr describe-repositories --repository-names "$REPO" \
          --region "$REGION" 2>/dev/null | grep -q "repositoryName"; then
        echo "  [SKIP] ECR repo $REPO exists"
    else
        aws ecr create-repository --repository-name "$REPO" --region "$REGION" > /dev/null
        echo "  [OK] Created ECR repo $REPO"
    fi
done
echo ""

# ============================================================================
# 3. RDS PostgreSQL
# ============================================================================
echo "[3/8] Setting up RDS PostgreSQL..."
if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" \
      --region "$REGION" 2>/dev/null | grep -q "DBInstanceIdentifier"; then
    echo "  [SKIP] RDS instance $DB_INSTANCE_ID exists"
else
    # Generate a secure random password (stored in Secrets Manager in step 5)
    DB_PASSWORD=$(openssl rand -base64 24)
    echo "  Creating RDS instance (this takes ~10-15 minutes)..."
    aws rds create-db-instance \
        --db-instance-identifier "$DB_INSTANCE_ID" \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --engine-version "16" \
        --master-username "$DB_USER" \
        --master-user-password "$DB_PASSWORD" \
        --db-name "$DB_NAME" \
        --allocated-storage 20 \
        --no-multi-az \
        --publicly-accessible \
        --no-deletion-protection \
        --region "$REGION" > /dev/null
    echo "  [OK] Created RDS instance (password stored in Secrets Manager)"
fi
echo ""

# ============================================================================
# 4. ElastiCache Redis
# ============================================================================
echo "[4/8] Setting up ElastiCache Redis..."
if aws elasticache describe-cache-clusters --cache-cluster-id "$REDIS_ID" \
      --region "$REGION" 2>/dev/null | grep -q "CacheClusterId"; then
    echo "  [SKIP] ElastiCache cluster $REDIS_ID exists"
else
    echo "  Creating ElastiCache Redis cluster (this takes ~5-10 minutes)..."
    aws elasticache create-cache-cluster \
        --cache-cluster-id "$REDIS_ID" \
        --cache-node-type cache.t3.micro \
        --engine redis \
        --engine-version "7" \
        --num-cache-nodes 1 \
        --region "$REGION" > /dev/null
    echo "  [OK] Created ElastiCache Redis cluster"
fi
echo ""

# ============================================================================
# 5. Secrets Manager Secret
# ============================================================================
echo "[5/8] Setting up Secrets Manager..."
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" \
      --region "$REGION" 2>/dev/null | grep -q "ARN"; then
    echo "  [SKIP] Secret $SECRET_NAME exists"
    echo "  NOTE: Update NASA_API_KEY manually before deploying"
else
    # Use the password from step 3 if it was just generated, otherwise use a placeholder
    DB_PASSWORD=${DB_PASSWORD:-CHANGE_ME}
    SECRET_JSON=$(cat <<EOF
{
  "DB_PASSWORD": "$DB_PASSWORD",
  "NASA_API_KEY": "CHANGE_ME"
}
EOF
)
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --secret-string "$SECRET_JSON" \
        --region "$REGION" > /dev/null
    echo "  [OK] Created secret $SECRET_NAME"
fi
echo ""

# ============================================================================
# 6. IAM Task Execution Role
# ============================================================================
echo "[6/8] Setting up IAM Task Execution Role..."
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

if aws iam get-role --role-name "$EXECUTION_ROLE_NAME" 2>/dev/null | grep -q "Arn"; then
    echo "  [SKIP] IAM role $EXECUTION_ROLE_NAME exists"
else
    aws iam create-role \
        --role-name "$EXECUTION_ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" > /dev/null
    aws iam attach-role-policy \
        --role-name "$EXECUTION_ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy > /dev/null
    echo "  [OK] Created IAM role $EXECUTION_ROLE_NAME"
fi

# Attach SecretsManager inline policy (idempotent: always put, does not error if exists)
SECRETS_POLICY="{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
        \"Effect\": \"Allow\",
        \"Action\": [\"secretsmanager:GetSecretValue\"],
        \"Resource\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${SECRET_NAME}*\"
    }]
}"
aws iam put-role-policy \
    --role-name "$EXECUTION_ROLE_NAME" \
    --policy-name "SecretsManagerAccess" \
    --policy-document "$SECRETS_POLICY" > /dev/null
echo "  [OK] Attached SecretsManager policy to role"
echo ""

# ============================================================================
# 7. CloudWatch Log Group
# ============================================================================
echo "[7/8] Setting up CloudWatch Log Group..."
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" \
      --region "$REGION" 2>/dev/null | grep -q "logGroupName"; then
    echo "  [SKIP] Log group $LOG_GROUP exists"
else
    aws logs create-log-group --log-group-name "$LOG_GROUP" --region "$REGION" > /dev/null
    aws logs put-retention-policy \
        --log-group-name "$LOG_GROUP" \
        --retention-in-days 30 \
        --region "$REGION" > /dev/null
    echo "  [OK] Created log group $LOG_GROUP (retention: 30 days)"
fi
echo ""

# ============================================================================
# 8. Register Task Definition
# ============================================================================
echo "[8/8] Registering ECS Task Definition..."
if [ -f "ecs-task-definition.json" ]; then
    aws ecs register-task-definition \
        --cli-input-json file://ecs-task-definition.json \
        --region "$REGION" > /dev/null
    echo "  [OK] Registered task definition $TASK_FAMILY"
else
    echo "  [WARN] ecs-task-definition.json not found in current directory"
    echo "         Task definition registration skipped"
fi
echo ""

# ============================================================================
# Summary Output
# ============================================================================
echo "=========================================="
echo "PROVISIONING SUMMARY"
echo "=========================================="
echo ""
echo "✓ Account ID:     $ACCOUNT_ID"
echo "✓ Region:         $REGION"
echo ""

echo "ECS Resources:"
ECS_CLUSTER_ARN=$(aws ecs describe-clusters --clusters "$CLUSTER_NAME" \
    --query "clusters[0].clusterArn" --output text --region "$REGION" 2>/dev/null || echo "pending")
echo "  Cluster ARN: $ECS_CLUSTER_ARN"
echo ""

echo "ECR Repositories:"
echo "  Backend:  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${BACKEND_REPO}:latest"
echo "  Frontend: ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${FRONTEND_REPO}:latest"
echo ""

echo "Database (RDS PostgreSQL):"
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text --region "$REGION" 2>/dev/null || echo "pending (check AWS console)")
echo "  Endpoint: ${RDS_ENDPOINT}:${DB_PORT}"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
RDS_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --query "DBInstances[0].DBInstanceStatus" \
    --output text --region "$REGION" 2>/dev/null || echo "unknown")
echo "  Status:   $RDS_STATUS"
echo ""

echo "Cache (ElastiCache Redis):"
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id "$REDIS_ID" \
    --show-cache-node-info \
    --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" \
    --output text --region "$REGION" 2>/dev/null || echo "pending (check AWS console)")
echo "  Endpoint: ${REDIS_ENDPOINT}:6379"
REDIS_STATUS=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id "$REDIS_ID" \
    --query "CacheClusters[0].CacheClusterStatus" \
    --output text --region "$REGION" 2>/dev/null || echo "unknown")
echo "  Status:   $REDIS_STATUS"
echo ""

echo "Security & Configuration:"
SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" \
    --query "ARN" --output text --region "$REGION" 2>/dev/null || echo "pending")
echo "  Secret ARN: $SECRET_ARN"
ROLE_ARN=$(aws iam get-role --role-name "$EXECUTION_ROLE_NAME" \
    --query "Role.Arn" --output text 2>/dev/null || echo "pending")
echo "  Execution Role: $ROLE_ARN"
echo "  Log Group: $LOG_GROUP"
echo ""

echo "=========================================="
echo "⚠️  IMPORTANT NEXT STEPS"
echo "=========================================="
echo ""
echo "1. WAIT FOR RESOURCES TO BE READY:"
echo "   - RDS typically takes 10-15 minutes to reach 'available' state"
echo "   - ElastiCache typically takes 5-10 minutes to reach 'available' state"
echo "   - Monitor progress in AWS Console → RDS/ElastiCache"
echo ""
echo "2. UPDATE SECRETS MANAGER:"
echo "   - Set NASA_API_KEY to your actual key:"
echo "     aws secretsmanager update-secret --secret-id '$SECRET_NAME' \\"
echo "       --secret-string '{\"DB_PASSWORD\":\"<from-above>\",\"NASA_API_KEY\":\"<your-api-key>\"}'"
echo ""
echo "3. VERIFY DATABASE CONNECTIVITY:"
echo "   - Once RDS is 'available', test connectivity:"
echo "     psql -h $RDS_ENDPOINT -U $DB_USER -d $DB_NAME"
echo ""
echo "4. UPDATE TASK DEFINITION (if endpoints changed):"
echo "   - Edit ecs-task-definition.json with actual RDS and Redis endpoints"
echo "   - Ensure SPRING_DATASOURCE_URL and SPRING_DATA_REDIS_HOST are correct"
echo ""
echo "5. DEPLOY TO ECS:"
echo "   - Push code to main branch → GitHub Actions builds and deploys"
echo "   - Monitor: aws ecs describe-services --cluster $CLUSTER_NAME \\"
echo "     --services space-visualiser-svc --region $REGION"
echo ""
echo "=========================================="
