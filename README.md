# Ikadou Mobile App 📱

Application mobile **Expo / React Native** pour la plateforme Ikadou — achat de terrains au Mali.

---

## Structure du projet

```
ikadou-app/
├── App.js                        ← Entry point (splash, onboarding guard)
├── app.json                      ← Config Expo
├── src/
│   ├── theme/index.js            ← Design system (couleurs, typo, spacing)
│   ├── api/
│   │   ├── client.js             ← Axios base + interceptors token
│   │   ├── terrains.js           ← GET /terrains, /terrains/:id, /featured, /map
│   │   ├── auth.js               ← POST /auth/register, /login, /request-otp, /verify-otp
│   │   └── leads.js              ← POST /leads, /contacts, /visits ; GET /visits/slots
│   ├── hooks/useAuth.js          ← Session state (token, user, saveSession, clearSession)
│   ├── components/
│   │   ├── UI.js                 ← Button, Input, Badge, EmptyState, ErrorState...
│   │   ├── TerrainCard.js        ← Carte terrain réutilisable
│   │   └── FilterBar.js          ← Barre de filtres (prix, surface, ville, zone)
│   ├── screens/
│   │   ├── OnboardingScreen.js   ← 4 slides + skip + persistance AsyncStorage
│   │   ├── CatalogueScreen.js    ← Liste terrains, recherche, filtres, pagination
│   │   ├── MapViewScreen.js      ← Carte interactive + marqueurs + aperçu
│   │   ├── TerrainDetailScreen.js← Galerie, specs, réassurance, CTA contact/visite
│   │   ├── ContactAgentScreen.js ← Formulaire contact agent + confirmation
│   │   ├── BookVisitScreen.js    ← Date picker, créneaux, récap, confirmation
│   │   ├── LeadCaptureScreen.js  ← Capture coordonnées prospect + confirmation
│   │   ├── RegisterScreen.js     ← Inscription + OTP + activation compte
│   │   └── ProfileScreen.js      ← Espace utilisateur, visites, déconnexion
│   └── navigation/
│       └── AppNavigator.js       ← Stack root + Bottom tabs (4 onglets)
└── assets/
    ├── ikadou_logo.png
    └── favicon.png
```

---

## Installation

```bash
# 1. Cloner et installer
cd ikadou-app
npm install

# 2. Démarrer
npx expo start

# 3. Scanner le QR avec l'app Expo Go (iOS / Android)
```

---

## Configuration backend

Modifier `src/api/client.js` :

```js
export const BASE_URL = 'https://api.ikadou.ml/v1';
// ou en local :
export const BASE_URL = 'http://192.168.x.x:3000/v1';
```

---

## Contrat API (attendu par le frontend)

### Auth

| Méthode | Endpoint | Body | Réponse |
|---------|----------|------|---------|
| POST | `/auth/request-otp` | `{ phone?, email? }` | `{ message }` |
| POST | `/auth/verify-otp` | `{ phone?, code }` | `{ token }` |
| POST | `/auth/register` | `{ firstName, lastName, phone, email?, otpToken }` | `{ token, user }` |
| POST | `/auth/login` | `{ phone, code }` | `{ token, user }` |
| GET  | `/auth/me` | — | `{ user }` |

**User object :**
```json
{ "id": "...", "firstName": "Moussa", "lastName": "Traoré", "phone": "+22370000000", "email": "..." }
```

---

### Terrains

| Méthode | Endpoint | Params | Réponse |
|---------|----------|--------|---------|
| GET | `/terrains` | `page, limit, minPrice, maxPrice, minSurface, maxSurface, city, zone, q` | `{ items, total, page, pages }` |
| GET | `/terrains/:id` | — | terrain object |
| GET | `/terrains/featured` | — | `{ items }` |
| GET | `/terrains/map` | mêmes filtres | `{ items: [{id, lat, lng, price, title, surface}] }` |

**Terrain object :**
```json
{
  "id": "abc123",
  "title": "Terrain résidentiel Sébenikoro",
  "location": "Bamako, Sébenikoro",
  "surface": "500 m²",
  "zone": "Résidentiel",
  "price": 850000,
  "currency": "FCFA",
  "status": "available",
  "isVerified": true,
  "badge": "Populaire",
  "badgeVariant": "orange",
  "images": ["https://...jpg"],
  "description": "...",
  "reference": "TF-2024-001",
  "lat": 12.6392,
  "lng": -8.0029,
  "owner": { "name": "Agent Ikadou", "role": "Agent certifié" }
}
```

---

### Leads & Contacts

| Méthode | Endpoint | Body | Réponse |
|---------|----------|------|---------|
| POST | `/leads` | `{ firstName, lastName, phone, email?, terrainId?, source? }` | `{ id, message }` |
| POST | `/contacts` | `{ terrainId, firstName, lastName, phone, email?, message, userId? }` | `{ id, message }` |
| GET  | `/visits/slots` | `?terrainId=&date=YYYY-MM-DD` | `{ slots: ["08:00","09:30",...] }` |
| POST | `/visits` | `{ terrainId, date, slot, firstName, lastName, phone, email?, userId? }` | `{ id, message }` |
| GET  | `/visits/me` | — (Bearer token) | `{ items: [visit] }` |

**Visit object :**
```json
{
  "id": "...", "terrainId": "...", "terrainTitle": "...", "location": "...",
  "date": "2026-04-15", "slot": "10:00",
  "status": "confirmed",
  "firstName": "Moussa", "phone": "+22370000000"
}
```

---

## Authentification & mode invité

- **Mode invité** : accès complet au catalogue et aux fiches terrain sans compte.
- **Actions sensibles** (contact agent, planification visite) : redirigent vers `RegisterScreen` avec `redirect` param si non connecté.
- Le token Bearer est automatiquement attaché à chaque requête via l'interceptor Axios.
- Après expiration du token (401), la session est automatiquement effacée.

---

## Données de mock (hors connexion API)

Toutes les screens disposent d'un fallback mock activé automatiquement si l'API retourne une erreur. Remplacer par les vraies données en connectant `BASE_URL`.

---

## Charte graphique

| Élément | Valeur |
|---------|--------|
| Couleur principale | `#00A8B5` (teal) |
| Couleur accent | `#FF5722` (orange) |
| Background | `#0B1A1C` |
| Cartes | `#152E33` |
| Police display | Syne 800 |
| Police body | DM Sans |

---

## Couverture des specs UAT

| ID | Fonctionnalité | Écran |
|----|----------------|-------|
| UAT-IKA-14 | Onboarding 4 slides + skip | `OnboardingScreen` |
| UAT-IKA-15 | Accès catalogue sans compte | `CatalogueScreen` (mode invité) |
| UAT-IKA-16 | Liste terrains + états vide/erreur | `CatalogueScreen` |
| UAT-IKA-17 | Filtres prix / surface / ville / zone | `FilterBar` |
| UAT-IKA-18 | Vue carte + marqueurs + aperçu | `MapViewScreen` |
| UAT-IKA-19 | Fiche terrain complète + galerie | `TerrainDetailScreen` |
| UAT-IKA-20 | Badges de réassurance | `TerrainDetailScreen` |
| UAT-IKA-21 | Formulaire contact agent | `ContactAgentScreen` |
| UAT-IKA-22 | Planification visite + créneaux | `BookVisitScreen` |
| UAT-IKA-23 | Capture coordonnées prospect | `LeadCaptureScreen` |
| UAT-IKA-24 | Création compte + OTP | `RegisterScreen` |
# Ikadou-Mobile-APp
