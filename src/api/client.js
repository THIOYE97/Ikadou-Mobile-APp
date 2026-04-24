import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitAuthRequired } from '../lib/authEvents';

export const BASE_URL = 'https://ikadou-backend.onrender.com/api/v1';

const PUBLIC_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const ACCESS_TOKEN_KEY = '@ikadou:accessToken';
const REFRESH_TOKEN_KEY = '@ikadou:refreshToken';
const USER_KEY = '@ikadou:user';

export const publicClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: PUBLIC_HEADERS,
});

export const authClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: PUBLIC_HEADERS,
});

export const protectedClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: PUBLIC_HEADERS,
});

protectedClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let authRedirectInProgress = false;

function shouldIgnoreUnauthorizedRedirect(error) {
  const failingUrl = error?.config?.url || '';

  return (
    failingUrl.includes('/client-auth/login') ||
    failingUrl.includes('/client-auth/register') ||
    failingUrl.includes('/client-auth/refresh') ||
    failingUrl.includes('/client-auth/logout') ||
    failingUrl.includes('/client-auth/password')
  );
}

function buildAuthRequiredPayload(error) {
  const status = error?.response?.status;
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    '';

  const failingUrl = error?.config?.url || '';
  const method = String(error?.config?.method || 'get').toUpperCase();

  let title = 'Connexion requise';
  let message = "Vous devez vous connecter pour accéder à cette partie de l’application.";

  if (status === 401) {
    title = 'Session expirée';
    message = 'Votre session a expiré. Veuillez vous reconnecter pour continuer.';
  }

  if (
    backendMessage.includes('Missing or invalid authorization header') ||
    backendMessage.includes('Invalid or expired token') ||
    backendMessage.includes('Invalid token payload') ||
    backendMessage.includes('Client not found') ||
    backendMessage.includes('Client auth account not found') ||
    backendMessage.includes('Client auth account is inactive') ||
    backendMessage.includes('Client account is suspended or inactive')
  ) {
    title = 'Connexion requise';
    message = 'Reconnectez-vous pour continuer en toute sécurité.';
  }

  return {
    title,
    message,
    failingUrl,
    method,
  };
}

protectedClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && !shouldIgnoreUnauthorizedRedirect(error)) {
      const failingUrl = error?.config?.url || '';
      const shouldKeepSession = failingUrl.includes('/client/profile/me');

      if (!shouldKeepSession) {
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      }

      if (!authRedirectInProgress) {
        authRedirectInProgress = true;

        emitAuthRequired(buildAuthRequiredPayload(error));

        setTimeout(() => {
          authRedirectInProgress = false;
        }, 1200);
      }
    }

    return Promise.reject(error);
  }
);