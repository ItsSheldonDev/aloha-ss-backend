# Documentation des Endpoints Admin - API Aloha Secourisme

Cette documentation détaille tous les endpoints réservés aux administrateurs dans l'API Aloha Secourisme. Ces endpoints nécessitent une authentification avec un token JWT.

## Authentification

### Se connecter
```
POST /api/auth/login
```
Authentifie un administrateur et retourne un token JWT.

**Corps de la requête**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clk123456",
      "email": "admin@example.com",
      "nom": "Dupont",
      "prenom": "Jean",
      "role": "ADMIN"
    }
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

### Récupérer le profil connecté
```
GET /api/auth/profile
```
Récupère les informations du profil administrateur connecté.

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clk123456",
    "email": "admin@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "ADMIN"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:32:00.000Z",
  "path": "/api/auth/profile",
  "method": "GET"
}
```

## Formations

### Télécharger un fichier Excel des formations
```
POST /api/formations/upload
```
Permet aux administrateurs de télécharger un nouveau fichier Excel contenant les formations.

**Corps de la requête**: 
`multipart/form-data` avec un champ `file` contenant le fichier Excel.

**Exemple de réponse**:
```json
{
  "data": {
    "success": true,
    "message": "Fichier Excel téléchargé et traité avec succès. 15 formations importées."
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:34:00.000Z",
  "path": "/api/formations/upload",
  "method": "POST"
}
```

## Documents

### Récupérer tous les documents (admin)
```
GET /api/documents/admin
```
Récupère la liste de tous les documents pour l'administration.

**Paramètres de requête**:
- `category` (optionnel): Filtre par catégorie

**Exemple de réponse**: Similaire à l'endpoint public mais avec des informations supplémentaires.

### Récupérer un document spécifique
```
GET /api/documents/admin/:id
```
Récupère les détails d'un document spécifique.

**Paramètres de chemin**:
- `id`: ID du document

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clj123456",
    "title": "Fiche formation PSC1",
    "filename": "fiche-psc1.pdf",
    "category": "FORMATIONS_PRO",
    "size": 524288,
    "downloads": 42,
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-03-17T10:15:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:36:00.000Z",
  "path": "/api/documents/admin/clj123456",
  "method": "GET"
}
```

### Créer un nouveau document
```
POST /api/documents/admin
```
Ajoute un nouveau document au système.

**Corps de la requête**: 
`multipart/form-data` avec les champs:
- `title`: Titre du document
- `category`: Catégorie du document
- `file`: Fichier à télécharger

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clp123456",
    "title": "Nouveau document",
    "filename": "1646231948123-document.pdf",
    "category": "FORMATIONS_PRO",
    "size": 262144,
    "downloads": 0,
    "createdAt": "2023-03-17T10:39:00.000Z",
    "updatedAt": "2023-03-17T10:39:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2023-03-17T10:39:00.000Z",
  "path": "/api/documents/admin",
  "method": "POST"
}
```

### Mettre à jour un document
```
PUT /api/documents/admin/:id
```
Met à jour les informations d'un document existant.

**Paramètres de chemin**:
- `id`: ID du document

**Corps de la requête**:
```json
{
  "title": "Titre mis à jour",
  "category": "CGV"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clj123456",
    "title": "Titre mis à jour",
    "filename": "fiche-psc1.pdf",
    "category": "CGV",
    "size": 524288,
    "downloads": 42,
    "createdAt": "2023-01-15T14:30:00.000Z",
    "updatedAt": "2023-03-17T10:41:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:41:00.000Z",
  "path": "/api/documents/admin/clj123456",
  "method": "PUT"
}
```

### Supprimer un document
```
DELETE /api/documents/admin/:id
```
Supprime un document du système.

**Paramètres de chemin**:
- `id`: ID du document

**Exemple de réponse**:
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:43:00.000Z",
  "path": "/api/documents/admin/clj123456",
  "method": "DELETE"
}
```

## Galerie

### Récupérer toutes les images (admin)
```
GET /api/gallery/admin
```
Récupère la liste de toutes les images pour l'administration.

**Paramètres de requête**:
- `category` (optionnel): Filtre par catégorie

**Exemple de réponse**: Similaire à l'endpoint public mais avec des informations supplémentaires.

### Récupérer une image spécifique
```
GET /api/gallery/admin/:id
```
Récupère les détails d'une image spécifique.

**Paramètres de chemin**:
- `id`: ID de l'image

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clk123456",
    "filename": "formation-psc1-juin-2023.jpg",
    "alt": "Formation PSC1 - juin 2023",
    "category": "Formations",
    "createdAt": "2023-06-15T16:30:00.000Z",
    "updatedAt": "2023-06-15T16:30:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:45:00.000Z",
  "path": "/api/gallery/admin/clk123456",
  "method": "GET"
}
```

### Télécharger une nouvelle image
```
POST /api/gallery/admin
```
Ajoute une nouvelle image à la galerie.

**Corps de la requête**: 
`multipart/form-data` avec les champs:
- `alt`: Description de l'image
- `category`: Catégorie de l'image
- `image`: Fichier image à télécharger

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clq123456",
    "filename": "1646234592123-image.jpg",
    "alt": "Nouvelle image",
    "category": "Formations",
    "createdAt": "2023-03-17T10:47:00.000Z",
    "updatedAt": "2023-03-17T10:47:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2023-03-17T10:47:00.000Z",
  "path": "/api/gallery/admin",
  "method": "POST"
}
```

### Mettre à jour une image
```
PUT /api/gallery/admin/:id
```
Met à jour les informations d'une image existante.

**Paramètres de chemin**:
- `id`: ID de l'image

**Corps de la requête**:
```json
{
  "alt": "Description mise à jour",
  "category": "Evenements"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clk123456",
    "filename": "formation-psc1-juin-2023.jpg",
    "alt": "Description mise à jour",
    "category": "Evenements",
    "createdAt": "2023-06-15T16:30:00.000Z",
    "updatedAt": "2023-03-17T10:49:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:49:00.000Z",
  "path": "/api/gallery/admin/clk123456",
  "method": "PUT"
}
```

### Supprimer une image
```
DELETE /api/gallery/admin/:id
```
Supprime une image de la galerie.

**Paramètres de chemin**:
- `id`: ID de l'image

**Exemple de réponse**:
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:51:00.000Z",
  "path": "/api/gallery/admin/clk123456",
  "method": "DELETE"
}
```

## News (Actualités)

### Récupérer toutes les actualités (admin)
```
GET /api/news/admin
```
Récupère la liste de toutes les actualités pour l'administration.

**Exemple de réponse**: Liste complète des actualités, incluant celles non publiées.

### Récupérer une actualité spécifique
```
GET /api/news/admin/:id
```
Récupère les détails d'une actualité spécifique.

**Paramètres de chemin**:
- `id`: ID de l'actualité

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clm123456",
    "title": "Nouvelle formation PSC1",
    "content": "Nous sommes heureux de vous annoncer le lancement d'une nouvelle session...",
    "author": "Équipe Aloha",
    "published": true,
    "createdAt": "2023-02-20T10:00:00.000Z",
    "updatedAt": "2023-02-20T10:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:53:00.000Z",
  "path": "/api/news/admin/clm123456",
  "method": "GET"
}
```

### Créer une nouvelle actualité
```
POST /api/news/admin
```
Crée une nouvelle actualité.

**Corps de la requête**:
```json
{
  "title": "Nouvelle actualité",
  "content": "Contenu de l'actualité...",
  "author": "Admin",
  "published": true
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clr123456",
    "title": "Nouvelle actualité",
    "content": "Contenu de l'actualité...",
    "author": "Admin",
    "published": true,
    "createdAt": "2023-03-17T10:55:00.000Z",
    "updatedAt": "2023-03-17T10:55:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2023-03-17T10:55:00.000Z",
  "path": "/api/news/admin",
  "method": "POST"
}
```

### Mettre à jour une actualité
```
PUT /api/news/admin/:id
```
Met à jour une actualité existante.

**Paramètres de chemin**:
- `id`: ID de l'actualité

**Corps de la requête**:
```json
{
  "title": "Titre mis à jour",
  "content": "Contenu mis à jour...",
  "published": false
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clm123456",
    "title": "Titre mis à jour",
    "content": "Contenu mis à jour...",
    "author": "Équipe Aloha",
    "published": false,
    "createdAt": "2023-02-20T10:00:00.000Z",
    "updatedAt": "2023-03-17T10:57:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:57:00.000Z",
  "path": "/api/news/admin/clm123456",
  "method": "PUT"
}
```

### Supprimer une actualité
```
DELETE /api/news/admin/:id
```
Supprime une actualité.

**Paramètres de chemin**:
- `id`: ID de l'actualité

**Exemple de réponse**:
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:59:00.000Z",
  "path": "/api/news/admin/clm123456",
  "method": "DELETE"
}
```

## Tableau de bord (Dashboard)

### Récupérer les statistiques pour le tableau de bord
```
GET /api/admin/dashboard/stats
```
Récupère les statistiques générales pour le tableau de bord d'administration.

**Exemple de réponse**:
```json
{
  "data": {
    "overview": {
      "totalFormations": 15,
      "activeFormations": 8,
      "totalAdmins": 3,
      "totalDocuments": 25,
      "totalDownloads": 352,
      "totalImages": 48,
      "totalNews": 12
    },
    "comparison": {
      "formationsThisMonth": 3,
      "formationsLastMonth": 2,
      "formationsThisYear": 12,
      "formationsLastYear": 10
    },
    "recentActivity": {
      "upcomingFormations": [...]
    },
    "charts": {
      "formationsByType": [...],
      "formationsByMonth": [...],
      "categoriesDistribution": [...]
    }
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:01:00.000Z",
  "path": "/api/admin/dashboard/stats",
  "method": "GET"
}
```

### Récupérer les statistiques annuelles
```
GET /api/admin/dashboard/yearly-stats
```
Récupère les statistiques annuelles pour le tableau de bord.

**Exemple de réponse**:
```json
{
  "data": [
    {
      "year": 2023,
      "formations": 12,
      "documents": 0,
      "images": 0,
      "news": 0
    },
    {
      "year": 2022,
      "formations": 10,
      "documents": 0,
      "images": 0,
      "news": 0
    },
    {
      "year": 2021,
      "formations": 8,
      "documents": 0,
      "images": 0,
      "news": 0
    }
  ],
  "statusCode": 200,
  "timestamp": "2023-03-17T11:03:00.000Z",
  "path": "/api/admin/dashboard/yearly-stats",
  "method": "GET"
}
```

### Récupérer les tendances des formations
```
GET /api/admin/dashboard/formation-trends
```
Récupère les tendances des formations pour le tableau de bord.

**Exemple de réponse**:
```json
{
  "data": {
    "formationsByType": [
      {
        "type": "PSC1",
        "count": 6
      },
      {
        "type": "BNSSA",
        "count": 3
      },
      ...
    ],
    "monthlyTrendsByType": [...]
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:05:00.000Z",
  "path": "/api/admin/dashboard/formation-trends",
  "method": "GET"
}
```

## Gestion des utilisateurs (Admin)

### Récupérer tous les administrateurs
```
GET /api/admin/users
```
Récupère la liste de tous les administrateurs.

**Exemple de réponse**:
```json
{
  "data": [
    {
      "id": "clk123456",
      "email": "admin@example.com",
      "nom": "Dupont",
      "prenom": "Jean",
      "role": "ADMIN",
      "avatar": "/uploads/avatars/admin1.jpg",
      "createdAt": "2023-01-01T10:00:00.000Z"
    },
    ...
  ],
  "statusCode": 200,
  "timestamp": "2023-03-17T11:07:00.000Z",
  "path": "/api/admin/users",
  "method": "GET"
}
```

### Récupérer son propre profil
```
GET /api/admin/users/me
```
Récupère le profil détaillé de l'administrateur connecté.

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clk123456",
    "email": "admin@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "ADMIN",
    "avatar": "/uploads/avatars/admin1.jpg",
    "createdAt": "2023-01-01T10:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:09:00.000Z",
  "path": "/api/admin/users/me",
  "method": "GET"
}
```

### Récupérer un administrateur spécifique
```
GET /api/admin/users/:id
```
Récupère les détails d'un administrateur spécifique.

**Paramètres de chemin**:
- `id`: ID de l'administrateur

**Exemple de réponse**: Similaire à l'endpoint "me".

### Créer un nouvel administrateur (super admin uniquement)
```
POST /api/admin/users
```
Crée un nouvel administrateur.

**Corps de la requête**:
```json
{
  "email": "nouveau@example.com",
  "password": "Password123!",
  "nom": "Martin",
  "prenom": "Sophie",
  "role": "ADMIN"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "id": "cls123456",
    "email": "nouveau@example.com",
    "nom": "Martin",
    "prenom": "Sophie",
    "role": "ADMIN",
    "createdAt": "2023-03-17T11:11:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2023-03-17T11:11:00.000Z",
  "path": "/api/admin/users",
  "method": "POST"
}
```

### Mettre à jour un administrateur (super admin uniquement)
```
PUT /api/admin/users/:id
```
Met à jour les informations d'un administrateur existant.

**Paramètres de chemin**:
- `id`: ID de l'administrateur

**Corps de la requête**:
```json
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prénom",
  "role": "SUPER_ADMIN"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clk123456",
    "email": "admin@example.com",
    "nom": "Nouveau Nom",
    "prenom": "Nouveau Prénom",
    "role": "SUPER_ADMIN",
    "avatar": "/uploads/avatars/admin1.jpg",
    "createdAt": "2023-01-01T10:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:13:00.000Z",
  "path": "/api/admin/users/clk123456",
  "method": "PUT"
}
```

### Changer son propre mot de passe
```
PUT /api/admin/users/profile/password
```
Permet à un administrateur de changer son propre mot de passe.

**Corps de la requête**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:15:00.000Z",
  "path": "/api/admin/users/profile/password",
  "method": "PUT"
}
```

### Mettre à jour son propre avatar
```
PUT /api/admin/users/profile/avatar
```
Permet à un administrateur de mettre à jour son avatar.

**Corps de la requête**: 
`multipart/form-data` avec un champ `avatar` contenant le fichier image.

**Exemple de réponse**:
```json
{
  "data": {
    "id": "clk123456",
    "email": "admin@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "ADMIN",
    "avatar": "/uploads/avatars/1646238604123-avatar.jpg"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:17:00.000Z",
  "path": "/api/admin/users/profile/avatar",
  "method": "PUT"
}
```

### Supprimer un administrateur (super admin uniquement)
```
DELETE /api/admin/users/:id
```
Supprime un administrateur du système.

**Paramètres de chemin**:
- `id`: ID de l'administrateur

**Exemple de réponse**:
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:19:00.000Z",
  "path": "/api/admin/users/clk123456",
  "method": "DELETE"
}
```

## Paramètres système (Settings)

### Récupérer les paramètres du système
```
GET /api/settings/admin
```
Récupère tous les paramètres du système.

**Exemple de réponse**:
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
  "timestamp": "2023-03-17T11:21:00.000Z",
  "path": "/api/settings/admin",
  "method": "GET"
}
```

### Mettre à jour les paramètres du système (super admin uniquement)
```
POST /api/settings/admin
```
Met à jour les paramètres du système.

**Corps de la requête**:
```json
{
  "contact": {
    "email": "nouveau@aloha-secourisme.fr",
    "phone": "06 98 76 54 32"
  },
  "social": {
    "instagram": "https://instagram.com/nouveau-compte"
  }
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "contact": {
      "email": "nouveau@aloha-secourisme.fr",
      "phone": "06 98 76 54 32",
      "address": "123 rue de la Paix, 75000 Paris"
    },
    "social": {
      "facebook": "https://facebook.com/aloha-secourisme",
      "instagram": "https://instagram.com/nouveau-compte"
    },
    "notifications": {
      "emailInscription": true,
      "emailContact": true
    }
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:23:00.000Z",
  "path": "/api/settings/admin",
  "method": "POST"
}
```

## Base de données (super admin uniquement)

### Récupérer les statistiques de la base de données
```
GET /api/admin/database/stats
```
Récupère les statistiques de la base de données.

**Exemple de réponse**:
```json
{
  "data": {
    "admins": 3,
    "documents": 25,
    "images": 48,
    "news": 12,
    "lastBackup": "2023-03-16T10:00:00.000Z"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:25:00.000Z",
  "path": "/api/admin/database/stats",
  "method": "GET"
}
```

### Exporter la base de données
```
POST /api/admin/database/export
```
Exporte toutes les données de la base de données.

**Exemple de réponse**: Fichier JSON téléchargé contenant toutes les données.

### Importer la base de données
```
POST /api/admin/database/import
```
Importe des données dans la base de données.

**Corps de la requête**: 
`multipart/form-data` avec un champ `file` contenant le fichier JSON d'export.

**Exemple de réponse**:
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:27:00.000Z",
  "path": "/api/admin/database/import",
  "method": "POST"
}
```

### Réinitialiser la base de données
```
POST /api/admin/database/reset
```
Réinitialise la base de données (conserve uniquement les super admins).

**Exemple de réponse**:
```json
{
  "data": {
    "success": true
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T11:29:00.000Z",
  "path": "/api/admin/database/reset",
  "method": "POST"
}
```

---

Cette documentation couvre tous les endpoints administratifs de l'API Aloha Secourisme. Pour les utiliser, un token d'authentification JWT valide doit être inclus dans l'en-tête d'autorisation de chaque requête.
