#!/bin/bash

# Configurações
DEPLOY_ENV=$1
APP_NAME="tournament-mode"
DOCKER_REGISTRY="your-registry.com"

# Validar ambiente
if [ "$DEPLOY_ENV" != "staging" ] && [ "$DEPLOY_ENV" != "production" ]; then
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

# Carregar variáveis de ambiente
if [ "$DEPLOY_ENV" == "staging" ]; then
    source .env.staging
else
    source .env.production
fi

echo "🚀 Iniciando deploy para $DEPLOY_ENV..."

# Build da imagem
echo "📦 Building Docker image..."
docker build -t $APP_NAME:$DEPLOY_ENV .

# Tag da imagem
docker tag $APP_NAME:$DEPLOY_ENV $DOCKER_REGISTRY/$APP_NAME:$DEPLOY_ENV

# Push para registry
echo "⬆️ Pushing to registry..."
docker push $DOCKER_REGISTRY/$APP_NAME:$DEPLOY_ENV

# Deploy
echo "🎯 Deploying to $DEPLOY_ENV..."
if [ "$DEPLOY_ENV" == "staging" ]; then
    # Deploy para staging
    docker-compose -f docker-compose.staging.yml up -d
else
    # Deploy para produção
    docker-compose -f docker-compose.production.yml up -d
fi

# Verificar status
echo "✅ Verificando status do deploy..."
docker-compose ps

echo "🎉 Deploy completo!" 