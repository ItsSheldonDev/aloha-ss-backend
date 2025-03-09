#!/bin/bash

# Vérifier si l'environnement est spécifié
ENV=${1:-development}
echo "Starting in $ENV mode..."

# Charger les variables d'environnement
if [ -f .env.$ENV ]; then
  export $(grep -v '^#' .env.$ENV | xargs)
elif [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Définir le fichier de composition approprié
if [ "$ENV" = "production" ]; then
  COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
else
  COMPOSE_FILE="docker-compose.yml -f docker-compose.dev.yml"
fi

# Construire et démarrer les conteneurs
docker-compose -f $COMPOSE_FILE up -d --build

echo "Application started successfully in $ENV mode."