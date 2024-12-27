#!/bin/bash

# Configurações
DEPLOY_ENV=$1
VERSION=$2
APP_NAME="tournament-mode"
DOCKER_REGISTRY="your-registry.com"

# Validar parâmetros
if [ -z "$DEPLOY_ENV" ] || [ -z "$VERSION" ]; then
    echo "Usage: ./rollback.sh [staging|production] [version]"
    exit 1
fi

echo "🔄 Iniciando rollback para $DEPLOY_ENV versão $VERSION..."

# Parar serviços atuais
echo "⏹️ Parando serviços atuais..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml down

# Fazer pull da versão anterior
echo "⬇️ Baixando versão $VERSION..."
docker pull $DOCKER_REGISTRY/$APP_NAME:$VERSION

# Tag da imagem
docker tag $DOCKER_REGISTRY/$APP_NAME:$VERSION $APP_NAME:$DEPLOY_ENV

# Subir serviços com versão anterior
echo "🔄 Subindo versão anterior..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d

# Verificar status
echo "✅ Verificando status após rollback..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml ps

# Validar serviços
echo "🔍 Validando serviços..."
./scripts/validate-$DEPLOY_ENV.sh

if [ $? -eq 0 ]; then
    echo "✅ Rollback completado com sucesso!"
else
    echo "❌ Falha no rollback! Iniciando procedimento de emergência..."
    # Adicionar procedimentos de emergência aqui
    exit 1
fi 