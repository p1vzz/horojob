import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_SESSION_KEY = 'auth-session:v1';

export type AuthUser = {
  id: string;
  kind: 'anonymous' | 'registered';
  subscriptionTier?: 'free' | 'premium';
  appleLinked: boolean;
  email: string | null;
  displayName: string | null;
  createdAt: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
};

export async function saveAuthSession(session: AuthSession) {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
}
