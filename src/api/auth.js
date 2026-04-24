import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient, protectedClient } from './client';

export const STORAGE_KEYS = {
  accessToken: '@ikadou:accessToken',
  refreshToken: '@ikadou:refreshToken',
  user: '@ikadou:user',
};

function normalizeClientSession(raw = {}) {
  return {
    id: raw.id,
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    email: raw.email ?? null,
    phone: raw.phone ?? null,
    status: raw.status ?? 'active',
  };
}

async function persistSession(payload) {
  const session = payload?.data ?? payload ?? {};

  const accessToken =
    session?.accessToken ??
    session?.access_token ??
    session?.token ??
    null;

  const refreshToken =
    session?.refreshToken ??
    session?.refresh_token ??
    null;

  const rawClient =
    session?.client ??
    session?.user ??
    session?.profile ??
    null;

  const client = rawClient ? normalizeClientSession(rawClient) : null;

  if (accessToken) {
    await AsyncStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  }

  if (refreshToken) {
    await AsyncStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }

  if (client) {
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(client));
  }

  return { accessToken, refreshToken, client };
}

export async function clearStoredSession() {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.accessToken,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.user,
  ]);
}

// ───────────────────────────────────────────────────────────
// REGISTER INIT
// ───────────────────────────────────────────────────────────
export async function registerEmailInit(payload) {
  return authClient.post('/client-auth/register/email/init', payload);
}

export async function registerPhoneInit(payload) {
  return authClient.post('/client-auth/register/phone/init', payload);
}

export async function resendRegisterOtp(payload) {
  return authClient.post('/client-auth/register/resend', payload);
}

export async function verifyRegisterOtp(payload) {
  const res = await authClient.post('/client-auth/register/verify', payload);
  await persistSession(res.data);
  await getMe();
  return res;
}

// ───────────────────────────────────────────────────────────
// LOGIN
// ───────────────────────────────────────────────────────────
export async function loginEmail(payload) {
  const res = await authClient.post('/client-auth/login/email', payload);

  const data = res?.data?.data ?? res?.data ?? {};
  const hasDirectSession =
    data?.accessToken || data?.access_token || data?.token;

  if (hasDirectSession) {
    await persistSession(res.data);
    await getMe();
  }

  return res;
}

export async function loginPhoneRequestCode(payload) {
  return authClient.post('/client-auth/login/phone/request-code', payload);
}

export async function loginPhoneVerifyCode(payload) {
  const res = await authClient.post('/client-auth/login/phone/verify-code', payload);
  await persistSession(res.data);
  await getMe();
  return res;
}

export async function verifyLoginOtp(payload) {
  const res = await authClient.post('/client-auth/login/verify', payload);
  await persistSession(res.data);
  await getMe();
  return res;
}

// ───────────────────────────────────────────────────────────
// PASSWORD
// ───────────────────────────────────────────────────────────
export async function forgotPassword(payload) {
  return authClient.post('/client-auth/password/forgot', payload);
}

export async function resetPassword(payload) {
  return authClient.post('/client-auth/password/reset', payload);
}

// ───────────────────────────────────────────────────────────
// SESSION
// ───────────────────────────────────────────────────────────
export async function refreshSession() {
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);
  const res = await authClient.post('/client-auth/refresh', { refreshToken });
  await persistSession(res.data);
  return res;
}

export async function logout() {
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refreshToken);

  try {
    if (refreshToken) {
      await authClient.post('/client-auth/logout', { refreshToken });
    }
  } finally {
    await clearStoredSession();
  }
}

export async function getMe() {
  const res = await protectedClient.get('/client/profile/me');
  const normalized = normalizeClientSession(res.data?.data ?? {});
  await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(normalized));
  return res;
}

export { persistSession, normalizeClientSession };