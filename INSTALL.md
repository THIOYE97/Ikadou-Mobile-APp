# 🔧 Installation & Fix — Ikadou App (Expo SDK 53)

## Pourquoi ça plantait

| Problème | Cause | Fix appliqué |
|----------|-------|--------------|
| `PlatformConstants not found` | `react-native-reanimated 4.x` + `react-native-worklets` requièrent un **dev build** personnalisé, incompatibles avec Expo Go | Supprimés — on utilise `Animated` natif RN |
| `React 19 / RN 0.81.5` | Ces versions ne correspondent pas à Expo SDK 54 | Downgrade sur **Expo 53** (React 18.3.1, RN 0.76.9) |
| Maps crash web | `react-native-maps` chargé inconditionnellement | Lazy-load via `require()` uniquement sur native, fallback web |
| Babel plugin reanimated | Plugin déclaré mais reanimated supprimé | Retiré de `babel.config.js` |

---

## Procédure propre

```bash
# 1. Supprimer les anciens modules
rm -rf node_modules package-lock.json yarn.lock

# 2. Installer avec les nouvelles versions
npm install

# 3. Vider le cache Expo
npx expo start --clear
```

## Expo Go (iOS / Android)
```bash
npx expo start
# Scanner le QR avec Expo Go
```

## Web
```bash
npx expo start --web
# Ouvre automatiquement dans le navigateur
```

## Connexion au backend
Modifier `src/api/client.js` :
```js
export const BASE_URL = 'https://api.ikadou.ml/v1';
// ou local :
export const BASE_URL = 'http://192.168.x.x:3000/v1';
```

---

## Dépendances exactes (Expo 53)

| Package | Version |
|---------|---------|
| expo | ~53.0.0 |
| react | 18.3.1 |
| react-native | 0.76.9 |
| react-native-reanimated | **supprimé** (non utilisé) |
| react-native-worklets | **supprimé** |
| react-native-maps | 1.20.1 |
| react-native-screens | ~4.11.1 |
| react-native-gesture-handler | ~2.24.0 |
| @react-native-async-storage | 2.1.2 |
| expo-linear-gradient | ~14.1.4 |
| expo-splash-screen | ~0.29.24 |

---

## Note sur react-native-maps

- ✅ Fonctionne dans **Expo Go** sur iOS et Android
- ❌ Ne fonctionne **pas** sur le web → fallback liste automatique
- Pour Android : ajouter `GOOGLE_MAPS_API_KEY` dans `app.json` si nécessaire
