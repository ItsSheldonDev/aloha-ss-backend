# Guide de Migration Frontend - API Aloha Secourisme

Ce document détaille les étapes nécessaires pour migrer le frontend de l'application Aloha Secourisme afin de l'intégrer avec la nouvelle API NestJS qui remplace l'ancienne API Next.js (qui était dans le dossier `/pages/api/`).

## Informations Générales

### URL de base

- **Ancienne API (Next.js)**: `/api/`
- **Nouvelle API (NestJS)**: `/api/`

> La nouvelle API conserve le même préfixe que l'ancienne, ce qui devrait faciliter la migration. Cependant, la structure des réponses est légèrement différente.

### Format des Réponses

**Ancienne API (Next.js)** - Format variable selon les endpoints:
```json
{
  "data": [...],
  "success": true
}
```

**Nouvelle API (NestJS)** - Format standard pour toutes les réponses:
```json
{
  "data": {...},
  "statusCode": 200,
  "timestamp": "2025-03-07T15:20:44.894Z",
  "path": "/api/formations",
  "method": "GET",
  "executionTimeMs": 54
}
```

> **Changement important**: Dans la nouvelle API, toutes les réponses sont enveloppées dans un objet avec des métadonnées supplémentaires. Vos fonctions de traitement des réponses devront être modifiées pour extraire les données du champ `data`.

### Authentification

L'authentification continue d'utiliser JSON Web Tokens (JWT), mais avec quelques changements dans la structure:

- **Ancienne API** : Token retourné comme `{ token: "xyz..." }`
- **Nouvelle API** : Token retourné comme `{ access_token: "xyz..." }`

Le token doit toujours être inclus dans l'en-tête HTTP sous la forme:
```
Authorization: Bearer <token>
```

## Migration des Endpoints par Module

### 1. Module Authentification (Auth)

| Fonctionnalité        | Ancienne Route          | Nouvelle Route          | Méthode | Changements                                         |
|-----------------------|-------------------------|-------------------------|---------|-----------------------------------------------------|
| Connexion             | `/api/auth/login`       | `/api/auth/login`       | POST    | Le token est maintenant retourné comme `access_token` |
| Profil utilisateur    | `/api/auth/profile`     | `/api/auth/profile`     | GET     | Aucun changement majeur                              |

**Exemple de code pour la connexion**:

```javascript
// AVANT
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    return true;
  }
  return false;
}

// APRÈS
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const result = await response.json();
  if (result.data && result.data.access_token) {
    localStorage.setItem('token', result.data.access_token);
    return true;
  }
  return false;
}
```

### 2. Module Formations

| Fonctionnalité             | Ancienne Route                 | Nouvelle Route                 | Méthode | Changements                                         |
|----------------------------|--------------------------------|--------------------------------|---------|-----------------------------------------------------|
| Liste formations (public)  | `/api/formations`              | `/api/formations`              | GET     | Nouvelle structure de réponse                        |
| Liste formations (admin)   | `/api/admin/formations`        | `/api/formations/admin`        | GET     | Nouvelle structure de réponse                        |
| Détail formation (admin)   | `/api/admin/formations/:id`    | `/api/formations/admin/:id`    | GET     | Nouvelle structure de réponse                        |
| Créer formation            | `/api/admin/formations`        | `/api/formations/admin`        | POST    | Validation plus stricte des données                  |
| Modifier formation         | `/api/admin/formations/:id`    | `/api/formations/admin/:id`    | PUT     | Validation plus stricte des données                  |
| Supprimer formation        | `/api/admin/formations/:id`    | `/api/formations/admin/:id`    | DELETE  | Aucun changement majeur                              |
| Changer statut formation   | `/api/admin/formations/:id/status` | `/api/formations/admin/:id/status` | PUT | Aucun changement majeur                    |

**Exemple de code pour récupérer les formations**:

```javascript
// AVANT
async function getFormations(type) {
  const url = type ? `/api/formations?type=${type}` : '/api/formations';
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// APRÈS
async function getFormations(type) {
  const url = type ? `/api/formations?type=${type}` : '/api/formations';
  const response = await fetch(url);
  const result = await response.json();
  return result.data; // Extraire les données du conteneur
}
```

### 3. Module Inscriptions

| Fonctionnalité               | Ancienne Route                | Nouvelle Route                | Méthode | Changements                                         |
|------------------------------|-------------------------------|-------------------------------|---------|-----------------------------------------------------|
| Créer inscription (public)   | `/api/inscriptions`           | `/api/inscriptions`           | POST    | Validation plus stricte des données                  |
| Liste inscriptions (admin)   | `/api/admin/inscriptions`     | `/api/inscriptions/admin`     | GET     | Nouvelle structure de réponse                        |
| Détail inscription (admin)   | `/api/admin/inscriptions/:id` | `/api/inscriptions/admin/:id` | GET     | Nouvelle structure de réponse                        |
| Modifier inscription         | `/api/admin/inscriptions/:id` | `/api/inscriptions/admin/:id` | PUT     | Validation plus stricte des données                  |
| Changer statut inscription   | `/api/admin/inscriptions/:id/status` | `/api/inscriptions/admin/:id/status` | PUT | Aucun changement majeur |
| Supprimer inscription        | `/api/admin/inscriptions/:id` | `/api/inscriptions/admin/:id` | DELETE  | Aucun changement majeur                              |

**Exemple de code pour créer une inscription**:

```javascript
// AVANT
async function createInscription(inscriptionData) {
  const response = await fetch('/api/inscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inscriptionData)
  });
  return await response.json();
}

// APRÈS
async function createInscription(inscriptionData) {
  try {
    const response = await fetch('/api/inscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inscriptionData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      // La nouvelle API renvoie des erreurs de validation détaillées
      throw new Error(result.message || 'Erreur lors de l\'inscription');
    }
    
    return result.data;
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    throw error;
  }
}
```

### 4. Module Documents

| Fonctionnalité              | Ancienne Route              | Nouvelle Route              | Méthode | Changements                                         |
|-----------------------------|-----------------------------|-----------------------------|---------|-----------------------------------------------------|
| Liste documents (public)    | `/api/documents`            | `/api/documents`            | GET     | Nouvelle structure de réponse                        |
| Liste documents (admin)     | `/api/admin/documents`      | `/api/documents/admin`      | GET     | Nouvelle structure de réponse                        |
| Détail document (admin)     | `/api/admin/documents/:id`  | `/api/documents/admin/:id`  | GET     | Nouvelle structure de réponse                        |
| Télécharger document        | `/api/documents/:id/download` | `/api/documents/:id/download` | GET  | Aucun changement majeur                              |
| Créer document              | `/api/admin/documents`      | `/api/documents/admin`      | POST    | Multipart/form-data obligatoire                      |
| Mettre à jour document      | `/api/admin/documents/:id`  | `/api/documents/admin/:id`  | PUT     | Validation plus stricte des données                  |
| Supprimer document          | `/api/admin/documents/:id`  | `/api/documents/admin/:id`  | DELETE  | Aucun changement majeur                              |
| Compteur téléchargements    | `/api/documents/:id/count`  | `/api/documents/:id/count`  | GET     | Nouvelle structure de réponse                        |
| Incrémenter compteur        | `/api/documents/:id/count`  | `/api/documents/:id/count`  | POST    | Nouvelle structure de réponse                        |

**Exemple de code pour le téléchargement d'un document**:

```javascript
// AVANT
function downloadDocument(id) {
  window.location.href = `/api/documents/${id}/download`;
  
  // Incrémenter le compteur
  fetch(`/api/documents/${id}/count`, { method: 'POST' })
    .catch(error => console.error('Erreur lors de l\'incrémentation du compteur', error));
}

// APRÈS
function downloadDocument(id) {
  window.location.href = `/api/documents/${id}/download`;
  
  // Incrémenter le compteur - la structure reste similaire mais la réponse a changé
  fetch(`/api/documents/${id}/count`, { method: 'POST' })
    .catch(error => console.error('Erreur lors de l\'incrémentation du compteur', error));
}
```

### 5. Module Galerie

| Fonctionnalité              | Ancienne Route              | Nouvelle Route              | Méthode | Changements                                         |
|-----------------------------|-----------------------------|-----------------------------|---------|-----------------------------------------------------|
| Liste images (public)       | `/api/gallery`              | `/api/gallery`              | GET     | Nouvelle structure de réponse                        |
| Liste images (admin)        | `/api/admin/gallery`        | `/api/gallery/admin`        | GET     | Nouvelle structure de réponse                        |
| Détail image (admin)        | `/api/admin/gallery/:id`    | `/api/gallery/admin/:id`    | GET     | Nouvelle structure de réponse                        |
| Télécharger image aléatoire | `/api/gallery?mode=random`  | `/api/gallery?mode=random`  | GET     | Nouvelle structure de réponse                        |
| Créer image                 | `/api/admin/gallery`        | `/api/gallery/admin`        | POST    | Multipart/form-data obligatoire                      |
| Mettre à jour image         | `/api/admin/gallery/:id`    | `/api/gallery/admin/:id`    | PUT     | Validation plus stricte des données                  |
| Supprimer image             | `/api/admin/gallery/:id`    | `/api/gallery/admin/:id`    | DELETE  | Aucun changement majeur                              |

### 6. Module Actualités (News)

| Fonctionnalité              | Ancienne Route              | Nouvelle Route              | Méthode | Changements                                         |
|-----------------------------|-----------------------------|-----------------------------|---------|-----------------------------------------------------|
| Liste actualités (public)   | `/api/news`                 | `/api/news`                 | GET     | Nouvelle structure de réponse avec pagination        |
| Liste actualités (admin)    | `/api/admin/news`           | `/api/news/admin`           | GET     | Nouvelle structure de réponse                        |
| Détail actualité (admin)    | `/api/admin/news/:id`       | `/api/news/admin/:id`       | GET     | Nouvelle structure de réponse                        |
| Créer actualité             | `/api/admin/news`           | `/api/news/admin`           | POST    | Validation plus stricte des données                  |
| Mettre à jour actualité     | `/api/admin/news/:id`       | `/api/news/admin/:id`       | PUT     | Validation plus stricte des données                  |
| Supprimer actualité         | `/api/admin/news/:id`       | `/api/news/admin/:id`       | DELETE  | Aucun changement majeur                              |

**Exemple de code pour récupérer les actualités avec pagination**:

```javascript
// AVANT
async function getNews(page = 1) {
  const response = await fetch(`/api/news?page=${page}`);
  const data = await response.json();
  return data;
}

// APRÈS
async function getNews(page = 1, limit = 10) {
  const response = await fetch(`/api/news?page=${page}&limit=${limit}`);
  const result = await response.json();
  
  // La nouvelle API renvoie les données et les informations de pagination
  return {
    news: result.data.news,
    pagination: result.data.pagination
  };
}
```

### 7. Module Utilisateurs (Admin)

| Fonctionnalité                 | Ancienne Route                 | Nouvelle Route                 | Méthode | Changements                                         |
|--------------------------------|--------------------------------|--------------------------------|---------|-----------------------------------------------------|
| Liste utilisateurs             | `/api/admin/users`             | `/api/admin/users`             | GET     | Nouvelle structure de réponse                        |
| Détail utilisateur             | `/api/admin/users/:id`         | `/api/admin/users/:id`         | GET     | Nouvelle structure de réponse                        |
| Créer utilisateur              | `/api/admin/users`             | `/api/admin/users`             | POST    | Validation plus stricte des données                  |
| Mettre à jour utilisateur      | `/api/admin/users/:id`         | `/api/admin/users/:id`         | PUT     | Validation plus stricte des données                  |
| Supprimer utilisateur          | `/api/admin/users/:id`         | `/api/admin/users/:id`         | DELETE  | Aucun changement majeur                              |
| Récupérer son profil           | `/api/admin/users/profile`     | `/api/admin/users/profile`     | GET     | Nouvelle structure de réponse                        |
| Changer son mot de passe       | `/api/admin/users/profile/password` | `/api/admin/users/profile/password` | PUT | Validation plus stricte |
| Mettre à jour son avatar       | `/api/admin/users/profile/avatar` | `/api/admin/users/profile/avatar` | PUT | Multipart/form-data obligatoire |

### 8. Module Tableau de bord (Dashboard)

| Fonctionnalité                | Ancienne Route                | Nouvelle Route                | Méthode | Changements                                         |
|-------------------------------|-------------------------------|-------------------------------|---------|-----------------------------------------------------|
| Statistiques                  | `/api/admin/dashboard/stats`  | `/api/admin/dashboard/stats`  | GET     | Nouvelle structure de réponse, données plus détaillées |
| Statistiques annuelles        | `/api/admin/dashboard/yearly-stats` | `/api/admin/dashboard/yearly-stats` | GET | Nouvelle structure de réponse |
| Tendances d'inscription       | `/api/admin/dashboard/inscription-trends` | `/api/admin/dashboard/inscription-trends` | GET | Nouvelle structure de réponse |

### 9. Module Paramètres (Settings)

| Fonctionnalité                | Ancienne Route                | Nouvelle Route                | Méthode | Changements                                         |
|-------------------------------|-------------------------------|-------------------------------|---------|-----------------------------------------------------|
| Récupérer paramètres          | `/api/admin/settings`         | `/api/admin/settings`         | GET     | Nouvelle structure de réponse                        |
| Mettre à jour paramètres      | `/api/admin/settings`         | `/api/admin/settings`         | POST    | Validation plus stricte, accès limité au super admin |

### 10. Module Base de données (Database)

| Fonctionnalité                | Ancienne Route                | Nouvelle Route                | Méthode | Changements                                         |
|-------------------------------|-------------------------------|-------------------------------|---------|-----------------------------------------------------|
| Statistiques base de données  | `/api/admin/database/stats`   | `/api/admin/database/stats`   | GET     | Nouvelle structure de réponse                        |
| Exporter base de données      | `/api/admin/database/export`  | `/api/admin/database/export`  | POST    | Accès limité au super admin                          |
| Importer base de données      | `/api/admin/database/import`  | `/api/admin/database/import`  | POST    | Multipart/form-data obligatoire, accès limité        |
| Réinitialiser base de données | `/api/admin/database/reset`   | `/api/admin/database/reset`   | POST    | Accès limité au super admin                          |

### 11. Module de Santé (Health)

> **Nouveau module** : Ce module n'existait pas dans l'ancienne API.

| Fonctionnalité                | Nouvelle Route                | Méthode | Description                                         |
|-------------------------------|-------------------------------|---------|-----------------------------------------------------|
| Vérifier l'état de l'API      | `/api/health`                 | GET     | Vérifie si l'API et la base de données fonctionnent |

```javascript
// Exemple d'utilisation du nouvel endpoint health
async function checkApiHealth() {
  try {
    const response = await fetch('/api/health');
    const result = await response.json();
    
    if (result.data.status === 'ok') {
      console.log('API fonctionnelle');
      return true;
    } else {
      console.error('Problème avec l\'API:', result.data);
      return false;
    }
  } catch (error) {
    console.error('API inaccessible:', error);
    return false;
  }
}
```

## Stratégie de Migration

Pour une migration en douceur, nous recommandons l'approche suivante:

1. **Créer une couche d'adaptation** : Développez des services/classes d'adaptation qui encapsulent les appels API et qui peuvent basculer entre l'ancienne et la nouvelle API.

2. **Migration progressive** : Migrez les modules un par un, en commençant par les moins critiques:
   - Commencez par Health et Dashboard qui ont peu d'impact sur l'expérience utilisateur
   - Puis migrez News, Documents et Gallery
   - Ensuite Formations et Inscriptions
   - Enfin, Auth, Users et Settings

3. **Tests approfondis** : Pour chaque module migré, testez exhaustivement toutes les fonctionnalités.

4. **Feature flags** : Utilisez des drapeaux de fonctionnalités pour activer/désactiver la nouvelle API par module.

## Gestion des Erreurs

La nouvelle API utilise un format d'erreur standardisé qui facilite le débogage:

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

Adapter votre code de gestion d'erreurs pour tirer parti de cette structure améliorée:

```javascript
async function handleApiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      // Extraire les détails de l'erreur pour un affichage amélioré
      const errorDetails = result.error;
      const errorMessage = result.message || 'Une erreur est survenue';
      
      throw new ApiError(errorMessage, response.status, errorDetails);
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      // Déjà formaté correctement
      throw error;
    }
    
    // Erreur réseau ou autre erreur non-API
    throw new Error('Erreur de connexion: ' + error.message);
  }
}

// Classe d'erreur personnalisée
class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
  
  // Helper pour récupérer les erreurs de champs spécifiques
  getFieldError(fieldName) {
    return this.details[fieldName];
  }
  
  // Helper pour formater les erreurs pour les formulaires
  getFormErrors() {
    return this.details;
  }
}
```

## Conclusion

Cette migration nécessite principalement des modifications dans la façon dont votre frontend traite les réponses de l'API, car:

1. La structure des réponses a été standardisée dans la nouvelle API (toutes les réponses incluent le wrapper `data`)
2. Les validations sont plus strictes et renvoient des erreurs plus détaillées
3. Certains endpoints ont été réorganisés, notamment les routes administratives qui suivent maintenant le format `/resource/admin` au lieu de `/admin/resource`

En suivant ce guide, vous devriez pouvoir migrer votre frontend de manière progressive et sécurisée.

## Annexe : Utilitaire de Migration

Voici un exemple d'utilitaire d'adaptation que vous pouvez utiliser pour faciliter la migration:

```javascript
// api-adapter.js

class ApiAdapter {
  constructor(useNewApi = false) {
    this.useNewApi = useNewApi;
  }
  
  // Méthode pour basculer entre les APIs
  setUseNewApi(value) {
    this.useNewApi = value;
  }
  
  // Méthode générique pour les requêtes
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, options);
      const data = await response.json();
      
      // Adaptation des données selon l'API utilisée
      if (this.useNewApi) {
        // Nouvelle API avec structure standardisée
        if (!response.ok) {
          throw { message: data.message, details: data.error, status: response.status };
        }
        return data.data; // Extraire les données du wrapper
      } else {
        // Ancienne API avec structure variable
        if (!response.ok) {
          throw { message: data.message || 'Erreur inconnue', details: data.errors, status: response.status };
        }
        return data; // Retourner directement les données
      }
    } catch (error) {
      console.error(`Erreur API [${this.useNewApi ? 'Nouvelle' : 'Ancienne'}]:`, error);
      throw error;
    }
  }
  
  // Méthodes spécifiques pour les différents endpoints
  // ...
}

// Exemple d'utilisation pour les formations
class FormationsApi {
  constructor(apiAdapter) {
    this.api = apiAdapter;
  }
  
  async getPublicFormations(type = null) {
    const queryParams = type ? `?type=${type}` : '';
    return this.api.request(`/api/formations${queryParams}`);
  }
  
  async getAdminFormations(type = null) {
    const queryParams = type ? `?type=${type}` : '';
    const endpoint = this.api.useNewApi
      ? `/api/formations/admin${queryParams}`
      : `/api/admin/formations${queryParams}`;
    
    return this.api.request(endpoint, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
  
  // Autres méthodes...
}
```

Cet utilitaire permet une transition en douceur en adaptant automatiquement les appels API selon que vous utilisez l'ancienne ou la nouvelle API.
