#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Iniciando validação do ambiente de staging..."

# Verificar se os serviços estão rodando
echo -e "\n${YELLOW}Verificando status dos serviços:${NC}"
services=("app" "redis" "monitoring")
for service in "${services[@]}"; do
    if docker-compose -f docker-compose.staging.yml ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✓ $service está rodando${NC}"
    else
        echo -e "${RED}✗ $service não está rodando${NC}"
        exit 1
    fi
done

# Verificar conexão com Supabase
echo -e "\n${YELLOW}Verificando conexão com Supabase:${NC}"
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  && echo -e "${GREEN}✓ Conexão com Supabase OK${NC}" \
  || (echo -e "${RED}✗ Falha na conexão com Supabase${NC}" && exit 1)

# Verificar endpoints da API
echo -e "\n${YELLOW}Verificando endpoints principais:${NC}"
endpoints=("/api/health" "/api/tournaments" "/api/matches")
for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ $endpoint está respondendo${NC}"
    else
        echo -e "${RED}✗ $endpoint retornou $response${NC}"
        exit 1
    fi
done

# Verificar métricas
echo -e "\n${YELLOW}Verificando métricas:${NC}"
if curl -s "http://localhost:3000/metrics" | grep -q "tournament_"; then
    echo -e "${GREEN}✓ Métricas estão sendo coletadas${NC}"
else
    echo -e "${RED}✗ Métricas não encontradas${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Validação concluída com sucesso!${NC}" 