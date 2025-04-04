# Documentation des Endpoints Publics - API Aloha Secourisme

Cette documentation résume tous les endpoints publics disponibles dans l'API Aloha Secourisme, ne nécessitant pas d'authentification.

## Formations

### Récupérer toutes les formations
```
GET /api/formations
```
Récupère la liste des formations depuis le fichier Excel avec possibilité de filtrage.

**Paramètres de requête**:
- `type` (optionnel): Filtre par type de formation (ex: PSC1, BNSSA)
- `period` (optionnel): Filtre par période ('all', '2024', '2025', 'recent')

**Exemple de réponse**:
```json
{
  "data": [
    {
      "id": "formation-0",
      "titre": "Formation PSC1",
      "type": "PSC1",
      "dateDebut": "2023-12-01T09:00:00.000Z",
      "dateFin": "2023-12-01T17:00:00.000Z",
      "description": "Formation aux premiers secours",
      "duree": "7h",
      "prix": 60,
      "statut": "PLANIFIEE"
    }
  ],
  "statusCode": 200,
  "timestamp": "2023-03-17T10:30:00.000Z",
  "path": "/api/formations",
  "method": "GET"
}
```

## Inscriptions

### Envoyer une inscription pour Sauvetage Sportif
```
POST /api/inscriptions/sauvetage-sportif
```
Permet d'envoyer une demande d'inscription pour le Sauvetage Sportif.

**Corps de la requête**:
```json
{
  "firstname": "Jean",
  "name": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "0612345678",
  "birthdate": "1990-01-15",
  "observation": "Information complémentaire"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "message": "Inscription envoyée avec succès"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:32:00.000Z",
  "path": "/api/inscriptions/sauvetage-sportif",
  "method": "POST"
}
```

### Envoyer un message de contact
```
POST /api/inscriptions/contact
```
Permet d'envoyer un message via le formulaire de contact.

**Corps de la requête**:
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "subject": "Demande d'information",
  "message": "Je souhaiterais avoir plus d'informations sur vos formations."
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "message": "Message envoyé avec succès"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:34:00.000Z",
  "path": "/api/inscriptions/contact",
  "method": "POST"
}
```

### Envoyer un signalement
```
POST /api/inscriptions/signalement
```
Permet d'envoyer un signalement.

**Corps de la requête**:
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "type": "Incident",
  "details": "Description détaillée du signalement",
  "location": "Paris"
}
```

**Exemple de réponse**:
```json
{
  "data": {
    "message": "Signalement envoyé avec succès"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:36:00.000Z",
  "path": "/api/inscriptions/signalement",
  "method": "POST"
}
```

## Documents

### Récupérer tous les documents
```
GET /api/documents
```
Récupère la liste des documents téléchargeables.

**Paramètres de requête**:
- `category` (optionnel): Filtre par catégorie (FORMATIONS_PRO, MIEUX_NOUS_CONNAITRE, CGV)

**Exemple de réponse**:
```json
{
  "data": [
    {
      "id": "clj123456",
      "title": "Fiche formation PSC1",
      "filename": "fiche-psc1.pdf",
      "category": "FORMATIONS_PRO",
      "size": 524288,
      "downloads": 42,
      "createdAt": "2023-01-15T14:30:00.000Z",
      "updatedAt": "2023-03-17T10:15:00.000Z"
    }
  ],
  "statusCode": 200,
  "timestamp": "2023-03-17T10:38:00.000Z",
  "path": "/api/documents",
  "method": "GET"
}
```

### Télécharger un document
```
GET /api/documents/:id/download
```
Télécharge un document spécifique par son ID.

**Paramètres de chemin**:
- `id`: ID du document à télécharger

**Réponse**: Le fichier est téléchargé directement.

## Galerie

### Récupérer toutes les images
```
GET /api/gallery
```
Récupère les images de la galerie.

**Paramètres de requête**:
- `category` (optionnel): Filtre par catégorie (Formations, Sauvetage_Sportif, Evenements)
- `mode` (optionnel): Mode de récupération ('all' = par catégorie, 'random' = images aléatoires)

**Exemple de réponse**:
```json
{
  "data": [
    {
      "id": "clk123456",
      "filename": "formation-psc1-juin-2023.jpg",
      "alt": "Formation PSC1 - juin 2023",
      "category": "Formations",
      "createdAt": "2023-06-15T16:30:00.000Z",
      "updatedAt": "2023-06-15T16:30:00.000Z",
      "url": "/uploads/galerie/formation-psc1-juin-2023.jpg"
    }
  ],
  "statusCode": 200,
  "timestamp": "2023-03-17T10:40:00.000Z",
  "path": "/api/gallery",
  "method": "GET"
}
```

## News

### Récupérer toutes les actualités publiées
```
GET /api/news
```
Récupère la liste des actualités publiées avec pagination.

**Paramètres de requête**:
- `page` (optionnel): Numéro de page pour la pagination
- `limit` (optionnel): Nombre d'éléments par page

**Exemple de réponse**:
```json
{
  "data": {
    "news": [
      {
        "id": "clm123456",
        "title": "Nouvelle formation PSC1",
        "content": "Nous sommes heureux de vous annoncer le lancement d'une nouvelle session...",
        "author": "Équipe Aloha",
        "published": true,
        "createdAt": "2023-02-20T10:00:00.000Z",
        "updatedAt": "2023-02-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "totalPages": 2,
      "currentPage": 1,
      "itemsPerPage": 10
    }
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:42:00.000Z",
  "path": "/api/news",
  "method": "GET"
}
```

## Health Check

### Vérifier l'état de santé de l'API
```
GET /api/health
```
Vérifie si l'API fonctionne correctement.

**Exemple de réponse**:
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2023-03-17T10:44:00.000Z",
    "uptime": 14400.25,
    "database": {
      "status": "ok"
    },
    "responseTime": "12.50ms",
    "environment": "production",
    "version": "1.0.0"
  },
  "statusCode": 200,
  "timestamp": "2023-03-17T10:44:00.000Z",
  "path": "/api/health",
  "method": "GET"
}
```