#!/bin/bash

set -e

echo "Waiting for postgres..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "postgres" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - executing migrations"

# Exécuter les migrations de Prisma
npx prisma migrate deploy

# En mode développement, générer le client Prisma
if [ "$NODE_ENV" = "development" ]; then
  echo "Running in development mode - generating Prisma client"
  npx prisma generate
fi

# Créer un super admin initial si aucun n'existe
node dist/scripts/create-admin.js

echo "Starting application"
exec "$@"