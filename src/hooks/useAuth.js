import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@ikadou:accessToken';
const REFRESH_TOKEN_KEY = '@ikadou:refreshToken';
const USER_KEY = '@ikadou:user';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedAccessToken) {
        setToken(storedAccessToken);
      }

      if (storedRefreshToken) {
        setRefreshToken(storedRefreshToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const saveSession = useCallback(async (newAccessToken, newRefreshToken, newUser) => {
    if (newAccessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      setToken(newAccessToken);
    }

    if (newRefreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      setRefreshToken(newRefreshToken);
    }

    if (newUser) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
    }
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  return {
    user,
    token,
    refreshToken,
    loading,
    isAuthenticated: !!token,
    saveSession,
    clearSession,
    loadSession,
  };
}