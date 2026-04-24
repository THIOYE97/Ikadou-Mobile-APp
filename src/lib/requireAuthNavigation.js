import AsyncStorage from '@react-native-async-storage/async-storage';

export async function requireAuthOrRedirect(navigation, options = {}) {
  const token = await AsyncStorage.getItem('@ikadou:accessToken');

  if (token) return true;

  const params = {
    title: options.title || 'Connexion requise',
    message:
      options.message ||
      "Vous devez vous connecter pour accéder à cette partie de l’application.",
    redirectTo: options.redirectTo || null,
    redirectParams: options.redirectParams || null,
    disableBack: options.disableBack ?? false,
  };

  if (options.reset) {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'AuthRequired',
          params,
        },
      ],
    });
    return false;
  }

  if (options.replace || options.disableBack) {
    navigation.replace('AuthRequired', params);
    return false;
  }

  navigation.navigate('AuthRequired', params);
  return false;
}