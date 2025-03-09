# Documentation de l'API Aloha Secourisme

## Introduction

Cette documentation détaille l'API RESTful d'Aloha Secourisme développée avec NestJS. L'API permet la gestion des formations de secourisme, des inscriptions, des documents, de la galerie d'images et diverses autres fonctionnalités administratives.

## URL de Base

```
https://api.aloha-secourisme.fr
```

En environnement de développement :
```
http://localhost:3000
```

## Authentification

L'API utilise l'authentification JWT (JSON Web Token). Pour accéder aux endpoints protégés, vous devez inclure le token dans l'en-tête HTTP de vos requêtes :

```
Authorization: Bearer <votre_token>
```

Pour obtenir un token, utilisez l'endpoint `/api/auth/login`.

## Format des Réponses

Toutes les réponses de l'API suivent une structure standard :

```json
{
  "data": {
    // Les données demandées
  },
  "statusCode": 200, // Code HTTP
  "timestamp": "2025-03-07T15:20:44.894Z", // Horodatage
  "path": "/api/formations", // Chemin de la requête
  "method": "GET", // Méthode HTTP
  "executionTimeMs": 54 // Temps d'exécution en millisecondes
}
```

## Gestion des Erreurs

En cas d'erreur, l'API renvoie une réponse formatée :

```json
{
  "statusCode": 400,
  "timestamp": "2025-03-07T15:20:44.894Z",
  "path": "/api/inscriptions",
  "method": "POST",
  "message": "Erreur de validation",
  "error": {
    "nom": "Le nom est requis",
    "email": "L'email doit être valide"
  }
}
```

## Endpoints par Module

### Module Santé (Health)

#### `GET /api/health`

Vérifie l'état de santé de l'API et de la base de données.

**Accès :** Public  
**Réponse :**
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2025-03-07T15:20:44.894Z",
    "uptime": 3600,
    "database": {
      "status": "ok"
    },
    "responseTime": "1.50ms",
    "environment": "production",
    "version": "1.0.0"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Authentification (Auth)

#### `POST /api/auth/login`

Authentifie un utilisateur et retourne un token JWT.

**Accès :** Public  
**Corps de la requête :**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "email": "admin@example.com",
      "nom": "Admin",
      "prenom": "Test",
      "role": "ADMIN"
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/auth/profile`

Récupère le profil de l'utilisateur connecté.

**Accès :** Authentifié  
**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "email": "admin@example.com",
    "nom": "Admin",
    "prenom": "Test",
    "role": "ADMIN"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Formations

#### `GET /api/formations`

Récupère la liste des formations disponibles au public.

**Accès :** Public  
**Paramètres de requête :**
- `type` (optionnel) : Filtre par type de formation (PSC1, SST, etc.)
- `month` (optionnel) : Filtre par mois au format "YYYY-MM"

**Réponse réussie :**
```json
{
  "data": [
    {
      "id": "1",
      "titre": "Formation PSC1",
      "type": "PSC1",
      "date": "2025-04-15T09:00:00.000Z",
      "duree": "7h",
      "placesTotal": 12,
      "placesDisponibles": 5,
      "prix": 59.99,
      "lieu": "Paris",
      "formateur": "Jean Formateur",
      "statut": "PLANIFIEE",
      "createdAt": "2025-03-01T10:00:00.000Z",
      "updatedAt": "2025-03-01T10:00:00.000Z",
      "_count": {
        "inscriptions": 7
      }
    },
    // autres formations
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/formations/admin`

Récupère la liste complète des formations (incluant celles qui ne sont pas publiques).

**Accès :** Admin  
**Paramètres de requête :**
- `type` (optionnel) : Filtre par type de formation
- `month` (optionnel) : Filtre par mois au format "YYYY-MM"
- `status` (optionnel) : Filtre par statut de formation (PLANIFIEE, EN_COURS, TERMINEE, ANNULEE)

**Réponse réussie :**
```json
{
  "data": [
    {
      "id": "1",
      "titre": "Formation PSC1",
      "type": "PSC1",
      "date": "2025-04-15T09:00:00.000Z",
      "duree": "7h",
      "placesTotal": 12,
      "placesDisponibles": 5,
      "prix": 59.99,
      "lieu": "Paris",
      "formateur": "Jean Formateur",
      "statut": "PLANIFIEE",
      "createdAt": "2025-03-01T10:00:00.000Z",
      "updatedAt": "2025-03-01T10:00:00.000Z",
      "_count": {
        "inscriptions": 7
      }
    },
    // autres formations
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/formations/admin/:id`

Récupère les détails d'une formation spécifique par son ID.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de la formation

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "titre": "Formation PSC1",
    "type": "PSC1",
    "date": "2025-04-15T09:00:00.000Z",
    "duree": "7h",
    "placesTotal": 12,
    "placesDisponibles": 5,
    "prix": 59.99,
    "lieu": "Paris",
    "formateur": "Jean Formateur",
    "statut": "PLANIFIEE",
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-01T10:00:00.000Z",
    "inscriptions": [
      {
        "id": "1",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "0612345678",
        "dateNaissance": "1990-01-15T00:00:00.000Z",
        "message": "Message de test",
        "formationId": "1",
        "statut": "ACCEPTEE",
        "notifie": true,
        "createdAt": "2025-03-05T14:30:00.000Z",
        "updatedAt": "2025-03-05T14:30:00.000Z"
      },
      // autres inscriptions
    ]
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/formations/admin`

Crée une nouvelle formation.

**Accès :** Admin  
**Corps de la requête :**
```json
{
  "titre": "Formation PSC1",
  "type": "PSC1",
  "date": "2025-04-15T09:00:00.000Z",
  "duree": "7h",
  "placesTotal": 12,
  "prix": 59.99,
  "lieu": "Paris",
  "formateur": "Jean Formateur"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "titre": "Formation PSC1",
    "type": "PSC1",
    "date": "2025-04-15T09:00:00.000Z",
    "duree": "7h",
    "placesTotal": 12,
    "placesDisponibles": 12,
    "prix": 59.99,
    "lieu": "Paris",
    "formateur": "Jean Formateur",
    "statut": "PLANIFIEE",
    "createdAt": "2025-03-07T15:30:00.000Z",
    "updatedAt": "2025-03-07T15:30:00.000Z"
  },
  "statusCode": 201,
  // autres métadonnées
}
```

#### `PUT /api/formations/admin/:id`

Met à jour une formation existante.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de la formation

**Corps de la requête :**
```json
{
  "titre": "Formation PSC1 mise à jour",
  "prix": 69.99,
  "placesTotal": 15
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "titre": "Formation PSC1 mise à jour",
    "type": "PSC1",
    "date": "2025-04-15T09:00:00.000Z",
    "duree": "7h",
    "placesTotal": 15,
    "placesDisponibles": 8,
    "prix": 69.99,
    "lieu": "Paris",
    "formateur": "Jean Formateur",
    "statut": "PLANIFIEE",
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-07T15:35:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `PUT /api/formations/admin/:id/status`

Met à jour le statut d'une formation.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de la formation

**Corps de la requête :**
```json
{
  "statut": "EN_COURS"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "titre": "Formation PSC1",
    "statut": "EN_COURS",
    // autres propriétés de la formation
    "updatedAt": "2025-03-07T15:40:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `DELETE /api/formations/admin/:id`

Supprime une formation.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de la formation

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "titre": "Formation PSC1",
    // autres propriétés de la formation
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Inscriptions

#### `POST /api/inscriptions`

Crée une nouvelle inscription à une formation.

**Accès :** Public  
**Corps de la requête :**
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@example.com",
  "telephone": "0612345678",
  "dateNaissance": "1990-01-15",
  "message": "Message optionnel",
  "formationId": "1"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "telephone": "0612345678",
    "dateNaissance": "1990-01-15T00:00:00.000Z",
    "message": "Message optionnel",
    "formationId": "1",
    "statut": "EN_ATTENTE",
    "notifie": false,
    "createdAt": "2025-03-07T15:45:00.000Z",
    "updatedAt": "2025-03-07T15:45:00.000Z",
    "formation": {
      "titre": "Formation PSC1",
      "type": "PSC1",
      "date": "2025-04-15T09:00:00.000Z",
      "duree": "7h",
      "lieu": "Paris"
    }
  },
  "statusCode": 201,
  // autres métadonnées
}
```

#### `GET /api/inscriptions/admin`

Récupère la liste des inscriptions.

**Accès :** Admin  
**Paramètres de requête :**
- `formationId` (optionnel) : Filtre par ID de formation
- `status` (optionnel) : Filtre par statut d'inscription (EN_ATTENTE, ACCEPTEE, REFUSEE, ANNULEE)
- `search` (optionnel) : Recherche par nom, prénom ou email

**Réponse réussie :**
```json
{
  "data": [
    {
      "id": "1",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com",
      "telephone": "0612345678",
      "dateNaissance": "1990-01-15T00:00:00.000Z",
      "message": "Message optionnel",
      "formationId": "1",
      "statut": "EN_ATTENTE",
      "notifie": false,
      "createdAt": "2025-03-07T15:45:00.000Z",
      "updatedAt": "2025-03-07T15:45:00.000Z",
      "formation": {
        "titre": "Formation PSC1",
        "type": "PSC1",
        "date": "2025-04-15T09:00:00.000Z",
        "duree": "7h",
        "lieu": "Paris"
      }
    },
    // autres inscriptions
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/inscriptions/admin/:id`

Récupère les détails d'une inscription spécifique.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'inscription

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "telephone": "0612345678",
    "dateNaissance": "1990-01-15T00:00:00.000Z",
    "message": "Message optionnel",
    "formationId": "1",
    "statut": "EN_ATTENTE",
    "notifie": false,
    "createdAt": "2025-03-07T15:45:00.000Z",
    "updatedAt": "2025-03-07T15:45:00.000Z",
    "formation": {
      "id": "1",
      "titre": "Formation PSC1",
      "type": "PSC1",
      "date": "2025-04-15T09:00:00.000Z",
      "duree": "7h",
      "placesTotal": 12,
      "placesDisponibles": 5,
      "prix": 59.99,
      "lieu": "Paris",
      "formateur": "Jean Formateur",
      "statut": "PLANIFIEE",
      "createdAt": "2025-03-01T10:00:00.000Z",
      "updatedAt": "2025-03-01T10:00:00.000Z"
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `PUT /api/inscriptions/admin/:id`

Met à jour une inscription existante.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'inscription

**Corps de la requête :**
```json
{
  "nom": "Dupont",
  "prenom": "Jean-Pierre",
  "telephone": "0687654321",
  "message": "Message mis à jour"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "nom": "Dupont",
    "prenom": "Jean-Pierre",
    "email": "jean.dupont@example.com",
    "telephone": "0687654321",
    "dateNaissance": "1990-01-15T00:00:00.000Z",
    "message": "Message mis à jour",
    "formationId": "1",
    "statut": "EN_ATTENTE",
    "notifie": false,
    "createdAt": "2025-03-07T15:45:00.000Z",
    "updatedAt": "2025-03-07T15:50:00.000Z",
    "formation": {
      // détails de la formation
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `PUT /api/inscriptions/admin/:id/status`

Met à jour le statut d'une inscription.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'inscription

**Corps de la requête :**
```json
{
  "statut": "ACCEPTEE"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "statut": "ACCEPTEE",
    // autres propriétés de l'inscription
    "updatedAt": "2025-03-07T15:55:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `DELETE /api/inscriptions/admin/:id`

Supprime une inscription.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'inscription

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    // autres propriétés de l'inscription
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Documents

#### `GET /api/documents`

Récupère la liste des documents publics.

**Accès :** Public  
**Paramètres de requête :**
- `category` (optionnel) : Filtre par catégorie de document

**Réponse réussie :**
```json
{
  "data": [
    {
      "id": "1",
      "title": "Fiche formation PSC1",
      "category": "FORMATIONS_PRO",
      "filename": "12345-fiche-psc1.pdf",
      "size": 1245678,
      "downloads": 42,
      "createdAt": "2025-03-01T10:00:00.000Z",
      "updatedAt": "2025-03-07T16:00:00.000Z"
    },
    // autres documents
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/documents/:id/download`

Télécharge un document.

**Accès :** Public  
**Paramètres de chemin :**
- `id` : ID du document

**Réponse réussie :**
Le fichier est retourné directement avec les en-têtes appropriés.

#### `POST /api/documents/:id/count`

Incrémente le compteur de téléchargements d'un document.

**Accès :** Public  
**Paramètres de chemin :**
- `id` : ID du document

**Réponse réussie :**
```json
{
  "data": {
    "downloads": 43
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/documents/:id/count`

Récupère le nombre de téléchargements d'un document.

**Accès :** Public  
**Paramètres de chemin :**
- `id` : ID du document

**Réponse réussie :**
```json
{
  "data": {
    "downloads": 43
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/documents/admin`

Téléverse un nouveau document.

**Accès :** Admin  
**Type de contenu :** `multipart/form-data`  
**Corps de la requête :**
- `title` : Titre du document
- `category` : Catégorie du document
- `file` : Fichier à téléverser

**Réponse réussie :**
```json
{
  "data": {
    "id": "2",
    "title": "Guide de premiers secours",
    "category": "FORMATIONS_GRAND_PUBLIC",
    "filename": "67890-guide-premiers-secours.pdf",
    "size": 2345678,
    "downloads": 0,
    "createdAt": "2025-03-07T16:05:00.000Z",
    "updatedAt": "2025-03-07T16:05:00.000Z"
  },
  "statusCode": 201,
  // autres métadonnées
}
```

#### `GET /api/documents/admin`

Récupère la liste complète des documents.

**Accès :** Admin  
**Paramètres de requête :**
- `category` (optionnel) : Filtre par catégorie de document

**Réponse réussie :**
```json
{
  "data": [
    // liste des documents similaire à GET /api/documents
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/documents/admin/:id`

Récupère les détails d'un document spécifique.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID du document

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "title": "Fiche formation PSC1",
    "category": "FORMATIONS_PRO",
    "filename": "12345-fiche-psc1.pdf",
    "size": 1245678,
    "downloads": 42,
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-07T16:00:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `PUT /api/documents/admin/:id`

Met à jour un document existant.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID du document

**Corps de la requête :**
```json
{
  "title": "Fiche formation PSC1 mise à jour",
  "category": "FORMATIONS_GRAND_PUBLIC"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "title": "Fiche formation PSC1 mise à jour",
    "category": "FORMATIONS_GRAND_PUBLIC",
    "filename": "12345-fiche-psc1.pdf",
    "size": 1245678,
    "downloads": 42,
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-07T16:10:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `DELETE /api/documents/admin/:id`

Supprime un document.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID du document

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    // autres propriétés du document
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Galerie

#### `GET /api/gallery`

Récupère la liste des images de la galerie.

**Accès :** Public  
**Paramètres de requête :**
- `category` (optionnel) : Filtre par catégorie d'image
- `mode` (optionnel) : Mode de récupération ('all' pour grouper par catégorie, 'random' pour images aléatoires)

**Réponse réussie :**
```json
{
  "data": [
    {
      "id": "1",
      "filename": "12345-formation-psc1.jpg",
      "alt": "Formation PSC1 - juin 2023",
      "category": "formations",
      "createdAt": "2025-03-01T10:00:00.000Z",
      "url": "/uploads/galerie/12345-formation-psc1.jpg"
    },
    // autres images
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/gallery/admin`

Téléverse une nouvelle image.

**Accès :** Admin  
**Type de contenu :** `multipart/form-data`  
**Corps de la requête :**
- `alt` : Texte alternatif de l'image
- `category` : Catégorie de l'image
- `image` : Fichier image à téléverser

**Réponse réussie :**
```json
{
  "data": {
    "id": "2",
    "filename": "67890-formation-sst.jpg",
    "alt": "Formation SST - mars 2025",
    "category": "formations",
    "createdAt": "2025-03-07T16:15:00.000Z",
    "updatedAt": "2025-03-07T16:15:00.000Z"
  },
  "statusCode": 201,
  // autres métadonnées
}
```

#### `GET /api/gallery/admin`

Récupère la liste complète des images.

**Accès :** Admin  
**Paramètres de requête :**
- `category` (optionnel) : Filtre par catégorie d'image

**Réponse réussie :**
```json
{
  "data": [
    // liste des images similaire à GET /api/gallery
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/gallery/admin/:id`

Récupère les détails d'une image spécifique.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'image

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "filename": "12345-formation-psc1.jpg",
    "alt": "Formation PSC1 - juin 2023",
    "category": "formations",
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-01T10:00:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `PUT /api/gallery/admin/:id`

Met à jour une image existante.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'image

**Corps de la requête :**
```json
{
  "alt": "Formation PSC1 - juin 2023 mise à jour",
  "category": "evenements"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "filename": "12345-formation-psc1.jpg",
    "alt": "Formation PSC1 - juin 2023 mise à jour",
    "category": "evenements",
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-07T16:20:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `DELETE /api/gallery/admin/:id`

Supprime une image.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'image

**Réponse réussie :**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Actualités (News)

#### `GET /api/news`

Récupère la liste des actualités publiées.

**Accès :** Public  
**Paramètres de requête :**
- `page` (optionnel) : Numéro de page pour la pagination (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 10)

**Réponse réussie :**
```json
{
  "data": {
    "news": [
      {
        "id": "1",
        "title": "Nouvelle formation PSC1",
        "content": "Contenu de l'actualité...",
        "author": "John Doe",
        "published": true,
        "createdAt": "2025-03-01T10:00:00.000Z",
        "updatedAt": "2025-03-01T10:00:00.000Z"
      },
      // autres actualités
    ],
    "pagination": {
      "total": 25,
      "totalPages": 3,
      "currentPage": 1,
      "itemsPerPage": 10
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/news/admin`

Récupère la liste complète des actualités (publiées et non publiées).

**Accès :** Admin  
**Réponse réussie :**
```json
{
  "data": {
    "news": [
      // actualités incluant celles non publiées
    ],
    "pagination": {
      // informations de pagination
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/news/admin/:id`

Récupère les détails d'une actualité spécifique.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'actualité

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "title": "Nouvelle formation PSC1",
    "content": "Contenu de l'actualité...",
    "author": "John Doe",
    "published": true,
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-01T10:00:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/news/admin`

Crée une nouvelle actualité.

**Accès :** Admin  
**Corps de la requête :**
```json
{
  "title": "Nouvelle formation SST",
  "content": "Contenu de l'actualité...",
  "author": "Jane Doe",
  "published": true
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "2",
    "title": "Nouvelle formation SST",
    "content": "Contenu de l'actualité...",
    "author": "Jane Doe",
    "published": true,
    "createdAt": "2025-03-07T16:25:00.000Z",
    "updatedAt": "2025-03-07T16:25:00.000Z"
  },
  "statusCode": 201,
  // autres métadonnées
}
```

#### `PUT /api/news/admin/:id`

Met à jour une actualité existante.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'actualité

**Corps de la requête :**
```json
{
  "title": "Nouvelle formation PSC1 mise à jour",
  "published": false
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "title": "Nouvelle formation PSC1 mise à jour",
    "content": "Contenu de l'actualité...",
    "author": "John Doe",
    "published": false,
    "createdAt": "2025-03-01T10:00:00.000Z",
    "updatedAt": "2025-03-07T16:30:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `DELETE /api/news/admin/:id`

Supprime une actualité.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'actualité

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    // autres propriétés de l'actualité
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Utilisateurs (Admin)

#### `GET /api/admin/users`

Récupère la liste des utilisateurs administrateurs.

**Accès :** Admin  
**Réponse réussie :**
```json
{
  "data": [
    {
      "id": "1",
      "email": "admin@example.com",
      "nom": "Admin",
      "prenom": "Test",
      "role": "ADMIN",
      "avatar": "/uploads/avatars/12345-avatar.jpg",
      "createdAt": "2025-03-01T10:00:00.000Z"
    },
    // autres utilisateurs
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/admin/users/:id`

Récupère les détails d'un utilisateur spécifique.

**Accès :** Admin  
**Paramètres de chemin :**
- `id` : ID de l'utilisateur

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "email": "admin@example.com",
    "nom": "Admin",
    "prenom": "Test",
    "role": "ADMIN",
    "avatar": "/uploads/avatars/12345-avatar.jpg",
    "createdAt": "2025-03-01T10:00:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/admin/users`

Crée un nouvel utilisateur administrateur.

**Accès :** Super Admin uniquement  
**Corps de la requête :**
```json
{
  "email": "nouveau-admin@example.com",
  "password": "Password123!",
  "nom": "Nouveau",
  "prenom": "Admin",
  "role": "ADMIN"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "2",
    "email": "nouveau-admin@example.com",
    "nom": "Nouveau",
    "prenom": "Admin",
    "role": "ADMIN",
    "createdAt": "2025-03-07T16:35:00.000Z"
  },
  "statusCode": 201,
  // autres métadonnées
}
```

#### `PUT /api/admin/users/:id`

Met à jour un utilisateur existant.

**Accès :** Super Admin uniquement  
**Paramètres de chemin :**
- `id` : ID de l'utilisateur

**Corps de la requête :**
```json
{
  "nom": "Admin mis à jour",
  "role": "SUPER_ADMIN"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "email": "admin@example.com",
    "nom": "Admin mis à jour",
    "prenom": "Test",
    "role": "SUPER_ADMIN",
    "avatar": "/uploads/avatars/12345-avatar.jpg",
    "createdAt": "2025-03-01T10:00:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `DELETE /api/admin/users/:id`

Supprime un utilisateur.

**Accès :** Super Admin uniquement  
**Paramètres de chemin :**
- `id` : ID de l'utilisateur

**Réponse réussie :**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/admin/users/profile`

Récupère le profil de l'utilisateur connecté.

**Accès :** Admin  
**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "email": "admin@example.com",
    "nom": "Admin",
    "prenom": "Test",
    "role": "ADMIN",
    "avatar": "/uploads/avatars/12345-avatar.jpg"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `PUT /api/admin/users/profile/password`

Change le mot de passe de l'utilisateur connecté.

**Accès :** Admin  
**Corps de la requête :**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Réponse réussie :**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `PUT /api/admin/users/profile/avatar`

Met à jour l'avatar de l'utilisateur connecté.

**Accès :** Admin  
**Type de contenu :** `multipart/form-data`  
**Corps de la requête :**
- `avatar` : Fichier image à téléverser

**Réponse réussie :**
```json
{
  "data": {
    "id": "1",
    "email": "admin@example.com",
    "nom": "Admin",
    "prenom": "Test",
    "role": "ADMIN",
    "avatar": "/uploads/avatars/67890-new-avatar.jpg"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Tableau de bord (Dashboard)

#### `GET /api/admin/dashboard/stats`

Récupère les statistiques générales pour le tableau de bord.

**Accès :** Admin  
**Réponse réussie :**
```json
{
  "data": {
    "overview": {
      "totalFormations": 25,
      "activeFormations": 12,
      "cancelledFormations": 2,
      "totalInscriptions": 150,
      "acceptedInscriptions": 120,
      "pendingInscriptions": 30,
      "totalUsers": 5,
      "totalDocuments": 15,
      "totalDownloads": 450,
      "totalImages": 30
    },
    "comparison": {
      "inscriptionsToday": 5,
      "inscriptionsThisWeek": 25,
      "inscriptionsThisMonth": 60,
      "inscriptionsLastMonth": 55,
      "monthlyGrowth": 9.09
    },
    "recentActivity": {
      "recentInscriptions": [
        // 5 inscriptions récentes
      ],
      "upcomingFormations": [
        // 5 formations à venir
      ]
    },
    "charts": {
      "formationsByType": [
        // Statistiques par type de formation
      ],
      "inscriptionsByMonth": [
        // Inscriptions par mois
      ],
      "occupationRate": [
        // Taux d'occupation des formations
      ],
      "inscriptionStatusDistribution": [
        // Distribution des statuts d'inscription
      ]
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/admin/dashboard/yearly-stats`

Récupère les statistiques annuelles.

**Accès :** Admin  
**Réponse réussie :**
```json
{
  "data": [
    {
      "year": 2023,
      "inscriptions": 500,
      "formations": 75
    },
    {
      "year": 2024,
      "inscriptions": 650,
      "formations": 90
    },
    {
      "year": 2025,
      "inscriptions": 150,
      "formations": 25
    }
  ],
  "statusCode": 200,
  // autres métadonnées
}
```

#### `GET /api/admin/dashboard/inscription-trends`

Récupère les tendances d'inscription.

**Accès :** Admin  
**Réponse réussie :**
```json
{
  "data": {
    "inscriptionsByType": [
      {
        "type": "PSC1",
        "count": 300
      },
      {
        "type": "SST",
        "count": 150
      },
      // autres types
    ],
    "monthlyTrendsByType": [
      {
        "month": "2025-01-01T00:00:00.000Z",
        "type": "PSC1",
        "count": 40
      },
      // autres données mensuelles
    ]
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Paramètres (Settings)

#### `GET /api/admin/settings`

Récupère les paramètres du système.

**Accès :** Admin  
**Réponse réussie :**
```json
{
  "data": {
    "contact": {
      "email": "contact@aloha-secourisme.fr",
      "phone": "06 12 34 56 78",
      "address": "123 rue de la Paix, 75000 Paris"
    },
    "social": {
      "facebook": "https://facebook.com/aloha-secourisme",
      "instagram": "https://instagram.com/aloha-secourisme"
    },
    "notifications": {
      "emailInscription": true,
      "emailContact": true
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/admin/settings`

Met à jour les paramètres du système.

**Accès :** Super Admin uniquement  
**Corps de la requête :**
```json
{
  "contact": {
    "email": "nouveau-contact@aloha-secourisme.fr"
  },
  "social": {
    "facebook": "https://facebook.com/aloha-secourisme-new"
  }
}
```

**Réponse réussie :**
```json
{
  "data": {
    "contact": {
      "email": "nouveau-contact@aloha-secourisme.fr",
      "phone": "06 12 34 56 78",
      "address": "123 rue de la Paix, 75000 Paris"
    },
    "social": {
      "facebook": "https://facebook.com/aloha-secourisme-new",
      "instagram": "https://instagram.com/aloha-secourisme"
    },
    "notifications": {
      "emailInscription": true,
      "emailContact": true
    }
  },
  "statusCode": 200,
  // autres métadonnées
}
```

### Module Base de données (Database)

#### `GET /api/admin/database/stats`

Récupère les statistiques de la base de données.

**Accès :** Super Admin uniquement  
**Réponse réussie :**
```json
{
  "data": {
    "admins": 5,
    "formations": 25,
    "inscriptions": 150,
    "documents": 15,
    "images": 30,
    "news": 10,
    "lastBackup": "2025-03-01T10:00:00.000Z"
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/admin/database/export`

Exporte la base de données au format JSON.

**Accès :** Super Admin uniquement  
**Réponse réussie :**
Un fichier JSON est retourné en téléchargement avec les données exportées.

#### `POST /api/admin/database/import`

Importe des données dans la base de données.

**Accès :** Super Admin uniquement  
**Type de contenu :** `multipart/form-data`  
**Corps de la requête :**
- `file` : Fichier JSON contenant les données à importer

**Réponse réussie :**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  // autres métadonnées
}
```

#### `POST /api/admin/database/reset`

Réinitialise la base de données (supprime toutes les données sauf les super administrateurs).

**Accès :** Super Admin uniquement  
**Réponse réussie :**
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  // autres métadonnées
}
```

## Énumérations

### Types de Formation (`TypeFormation`)

- `PSC1` : Prévention et Secours Civiques de niveau 1
- `SST` : Sauveteur Secouriste du Travail
- `PSE1` : Premiers Secours en Équipe de niveau 1
- `PSE2` : Premiers Secours en Équipe de niveau 2
- `BNSSA` : Brevet National de Sécurité et de Sauvetage Aquatique
- `GQS` : Gestes Qui Sauvent
- `FORMATEUR` : Formation de Formateur
- `RECYCLAGE` : Recyclage/Remise à niveau

### Statuts de Formation (`StatutFormation`)

- `PLANIFIEE` : Formation planifiée, non commencée
- `EN_COURS` : Formation en cours
- `TERMINEE` : Formation terminée
- `ANNULEE` : Formation annulée

### Statuts d'Inscription (`StatutInscription`)

- `EN_ATTENTE` : Inscription reçue, en attente de traitement
- `ACCEPTEE` : Inscription acceptée
- `REFUSEE` : Inscription refusée
- `ANNULEE` : Inscription annulée

### Catégories de Document (`DocumentCategory`)

- `FORMATIONS_PRO` : Documents pour les formations professionnelles
- `FORMATIONS_GRAND_PUBLIC` : Documents pour les formations grand public
- `ADMINISTRATIF` : Documents administratifs
- `RESSOURCES` : Ressources pédagogiques

### Catégories d'Image (`Category`)

- `formations` : Images des formations
- `evenements` : Images des événements
- `equipe` : Images de l'équipe
- `materiels` : Images des matériels

### Rôles Utilisateur (`Role`)

- `ADMIN` : Administrateur standard
- `SUPER_ADMIN` : Super administrateur avec accès complet

## Codes d'Erreur Courants

- `400 Bad Request` : La requête est mal formée ou les données sont invalides
- `401 Unauthorized` : Authentification requise ou échec d'authentification
- `403 Forbidden` : Pas les droits suffisants pour accéder à la ressource
- `404 Not Found` : Ressource non trouvée
- `409 Conflict` : Conflit (par exemple, email déjà utilisé)
- `500 Internal Server Error` : Erreur serveur interne

## Bonnes Pratiques

1. Utilisez toujours les endpoints adaptés à votre contexte (public vs admin)
2. Incluez toujours le token JWT pour les endpoints protégés
3. Gérez correctement les erreurs retournées par l'API
4. Respectez les formats de données attendus, notamment pour les dates et les énumérations
5. Pour les uploads de fichiers, utilisez toujours `multipart/form-data` et respectez les limites de taille

## Conclusion

Cette API RESTful offre une interface complète pour gérer l'application Aloha Secourisme. Elle suit les principes REST et utilise des conventions cohérentes pour faciliter son utilisation. N'hésitez pas à consulter la documentation Swagger disponible à l'URL `/docs` pour explorer interactivement les endpoints.