###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:18-alpine As development

# Créer le répertoire de l'application
WORKDIR /usr/src/app

# Copier les fichiers de dépendances et installer les packages
COPY --chown=node:node package*.json ./
RUN npm ci

# Copier le reste des fichiers du projet
COPY --chown=node:node . .

# Utilisez l'utilisateur non-root fourni par l'image node
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

# Exécuter la commande de build
RUN npm run build

# Installer uniquement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

# Copier le fichier de migration Prisma nécessaire
COPY --chown=node:node --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client

# Définir la variable NODE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Créer le répertoire de l'application
WORKDIR /usr/src/app

# Copier les fichiers nécessaires
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma
COPY --chown=node:node package*.json ./

# Créer les répertoires uploads
RUN mkdir -p public/uploads/documents public/uploads/galerie public/uploads/avatars uploads/temp

# Donner les permissions appropriées
RUN chown -R node:node public uploads

# Utiliser l'utilisateur non-root
USER node

# Commande pour démarrer l'application
CMD ["node", "dist/main"]