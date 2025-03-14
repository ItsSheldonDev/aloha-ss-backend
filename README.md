# API Aloha Secourisme   
[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v3/monitor/1tvdq.svg)](https://uptime.betterstack.com/?utm_source=status_badge)

API REST complète pour la gestion de l'application Aloha Secourisme. Cette API permet de gérer les formations, les inscriptions, les documents, la galerie d'images, les actualités et l'administration du système.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Documentation API](#documentation-api)
- [Déploiement](#déploiement)
- [Tests](#tests)
- [Maintenance](#maintenance)
- [Contribution](#contribution)
- [Contact](#contact)

## ✨ Fonctionnalités

- 🧑‍🏫 **Gestion des formations** : Création, modification et suppression des sessions de formation
- 📝 **Gestion des inscriptions** : Suivi des inscriptions aux formations, avec gestion des statuts et notifications
- 📄 **Gestion des documents** : Upload et téléchargement de documents catégorisés
- 🖼️ **Galerie d'images** : Upload et gestion d'images optimisées
- 📰 **Actualités** : Publication d'articles et d'actualités
- 👤 **Administration** : Gestion des utilisateurs et des droits d'accès
- 📊 **Tableau de bord** : Statistiques et analyses de données
- ⚙️ **Paramètres système** : Configuration globale de l'application
- 💾 **Import/Export de données** : Sauvegarde et restauration de la base de données

## 🔧 Prérequis

- [Node.js](https://nodejs.org/) (v16 ou supérieur)
- [npm](https://www.npmjs.com/) (v7 ou supérieur)
- [PostgreSQL](https://www.postgresql.org/) (v14 ou supérieur)
- [Docker](https://www.docker.com/) (optionnel, pour le déploiement)

## 🚀 Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-organisation/aloha-secourisme-api.git
cd aloha-secourisme-api
```

2. Installer les dépendances :
```bash
npm install
```

3. Copier le fichier d'environnement exemple et le personnaliser :
```bash
cp .env.example .env
```

4. Générer les migrations Prisma et le client :
```bash
npx prisma migrate dev --name init
```

5. Créer un premier super administrateur :
```bash
npm run create-admin
```

6. Démarrer l'API en mode développement :
```bash
npm run start:dev
```

## ⚙️ Configuration

### Variables d'environnement

Principales variables à configurer dans le fichier `.env` :

```
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aloha_secourisme

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# Admin
ADMIN_EMAIL=contact@aloha-secourisme.fr

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=noreply@example.com
SMTP_PASS=your_smtp_password

# Logging
LOG_LEVEL=info
```

### Base de données

Cette API utilise PostgreSQL avec Prisma comme ORM. La structure de la base de données est définie dans le fichier `prisma/schema.prisma`.

### Configuration des emails

Pour que les notifications par email fonctionnent correctement, configurez les paramètres SMTP dans le fichier `.env`.

## 🛠️ Utilisation

### Scripts disponibles

- `npm run start:dev` : Démarrer l'API en mode développement avec hot-reload
- `npm run build` : Compiler le projet TypeScript
- `npm run start:prod` : Démarrer l'API en mode production
- `npm run lint` : Exécuter ESLint pour vérifier le code
- `npm run test` : Exécuter les tests unitaires
- `npm run test:e2e` : Exécuter les tests end-to-end
- `npm run create-admin` : Créer un compte super administrateur
- `npm run prisma:studio` : Ouvrir Prisma Studio pour explorer la base de données

### Accès à l'API

Une fois démarrée, l'API est accessible à l'adresse `http://localhost:3000/api`.

### Documentation Swagger

La documentation Swagger est disponible à l'adresse `http://localhost:3000/docs`.

## 📐 Architecture

L'API est construite avec NestJS, un framework progressif pour Node.js. Son architecture est modulaire et respecte les principes SOLID.

### Structure des dossiers

```
src/
├── common/             # Filtres, gardes, intercepteurs et outils communs
├── config/             # Configuration de l'application
├── modules/            # Modules fonctionnels de l'API
│   ├── admin/          # Module d'administration
│   ├── auth/           # Authentification et autorisation
│   ├── dashboard/      # Statistiques et tableaux de bord
│   ├── database/       # Import/Export de la base de données
│   ├── documents/      # Gestion des documents
│   ├── emails/         # Service d'envoi d'emails
│   ├── formations/     # Gestion des formations
│   ├── gallery/        # Gestion de la galerie d'images
│   ├── health/         # Vérification de l'état de l'API
│   ├── inscriptions/   # Gestion des inscriptions
│   ├── news/           # Gestion des actualités
│   ├── settings/       # Paramètres du système
│   └── users/          # Gestion des utilisateurs
├── prisma/             # Configuration Prisma et modèles de données
├── scripts/            # Scripts utilitaires
├── templates/          # Templates d'emails
├── app.module.ts       # Module principal de l'application
└── main.ts             # Point d'entrée de l'application
```

### Patterns utilisés

- **Repository Pattern** : Séparation de la logique d'accès aux données
- **Dependency Injection** : Injection de dépendances pour une meilleure testabilité
- **DTO Pattern** : Data Transfer Objects pour valider et transférer les données
- **Service Layer** : Séparation de la logique métier
- **Module Pattern** : Organisation du code en modules fonctionnels

## 📘 Documentation API

La documentation complète de l'API est disponible via Swagger à l'adresse `http://localhost:3000/docs`. Elle inclut :

- Une description détaillée de chaque endpoint
- Les paramètres attendus et leur format
- Les réponses possibles et leurs structures
- Des exemples de requêtes et de réponses
- La documentation des modèles de données

## 🚢 Déploiement

### Avec Docker

1. Construire et démarrer les conteneurs :
```bash
# En mode développement
./start.sh development

# En mode production
./start.sh production
```

2. Accéder à l'API déployée :
```
API : http://localhost:3000
Documentation Swagger : http://localhost:3000/docs
PGAdmin : http://localhost:5050
```

### Configuration de production

Pour un déploiement en production, assurez-vous de :
- Définir `NODE_ENV=production` dans `.env`
- Utiliser un secret JWT fort et unique
- Configurer correctement les paramètres SMTP
- Utiliser HTTPS pour sécuriser les communications
- Configurer un proxy inverse comme Nginx devant l'API

## 🧪 Tests

### Tests unitaires

Les tests unitaires vérifient le comportement des services et des contrôleurs isolément :

```bash
npm run test
```

### Tests end-to-end

Les tests end-to-end vérifient le comportement de l'API complète :

```bash
npm run test:e2e
```

### Couverture de tests

Pour générer un rapport de couverture des tests :

```bash
npm run test:cov
```

## 🔄 Maintenance

### Migrations de base de données

Pour créer une nouvelle migration après modification du schéma Prisma :

```bash
npx prisma migrate dev --name nom_de_la_migration
```

Pour appliquer les migrations en production :

```bash
npx prisma migrate deploy
```

### Mise à jour des dépendances

Pour mettre à jour les dépendances :

```bash
npm update
```

Pour vérifier les vulnérabilités :

```bash
npm audit
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Forker le dépôt
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Effectuer des commits clairs et descriptifs (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pousser vos modifications (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

### Normes de code

- Suivre les normes de style d'Airbnb pour TypeScript
- Documenter toutes les fonctions et classes
- Ajouter des tests pour les nouvelles fonctionnalités
- Respecter l'architecture existante

## 📞 Contact

Pour toute question ou suggestion concernant cette API, contactez-nous :

- Email : contact@aloha-secourisme.fr
- Site web : https://www.aloha-secourisme.fr

---

© 2023-2025 Aloha Secourisme. Tous droits réservés.
