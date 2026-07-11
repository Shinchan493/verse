import { useContext } from 'react';
import { AuthContext } from '../contexts/auth-context';
import AuthService from '../services/auth-service';
import useLocalStorage from './use-local-storage';
import jwt_decode from 'jwt-decode';
import Token from '../types/interfaces/token';

// Module-level so every useAuth() instance shares one refresh timer and one
// in-flight request — components mounting concurrently must not stack timers
// or fire parallel refreshes.
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let refreshInFlight: Promise<void> | null = null;

// Always read the CURRENT stored token. Scheduled refreshes previously used
// the hook's closure value, which token rotation had already invalidated —
// sending that stale token got a 403 and force-logged the user out.
const readStoredRefreshToken = (): string | null => {
  try {
    const item = window.localStorage.getItem('refreshToken');
    return item ? JSON.parse(item) : null;
  } catch (error) {
    return null;
  }
};

const useAuth = () => {
  const {
    accessToken,
    setAccessToken,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    loadingAuth,
    setLoadingAuth,
    errors,
    userId,
    setUserId,
    email,
    setEmail,
  } = useContext(AuthContext);
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>(
    'refreshToken',
    null
  );

  const login = (accessToken: string, refreshToken: string) => {
    const { exp, id, email } = jwt_decode<Token>(accessToken);
    silentRefresh(exp);
    setUserId(id);
    setEmail(email);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setIsAuthenticated(true);
  };

  const refreshAccessToken = async (): Promise<void> => {
    // One refresh at a time — concurrent mounts share the same request.
    if (refreshInFlight) return refreshInFlight;

    const doRefresh = async () => {
      const token = readStoredRefreshToken();
      if (token === null) {
        destroyAuth();
        setLoadingAuth(false);
        return;
      }
      try {
        const response = await AuthService.refreshToken({ token });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;
        login(newAccessToken, newRefreshToken);
      } catch (error) {
        // Only a definitive rejection (4xx) invalidates the session. On
        // network errors or 5xx — e.g. the API is redeploying or
        // cold-starting — keep the session and retry until it's reachable.
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status !== undefined && status < 500) {
          destroyAuth();
        } else {
          setTimeout(() => {
            refreshAccessToken();
          }, 15000);
        }
      } finally {
        setLoadingAuth(false);
        refreshInFlight = null;
      }
    };

    refreshInFlight = doRefresh();
    return refreshInFlight;
  };

  const logout = async () => {
    if (!accessToken) return;
    try {
      await AuthService.logout(accessToken);
    } catch {
    } finally {
      destroyAuth();
    }
  };

  const silentRefresh = (exp: number) => {
    // Refresh a minute before the access token expires (not at/after expiry)
    // so requests never race an expired token. A single shared timer —
    // auth-route remounts used to stack timers holding stale tokens.
    const msExpiration = Math.max(exp * 1000 - Date.now() - 60_000, 0);
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshAccessToken();
    }, msExpiration);
  };

  const destroyAuth = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    setRefreshToken(null);
    setAccessToken(null);
    setUserId(null);
    setEmail(null);
    setIsAuthenticated(false);
  };

  return {
    accessToken,
    isAuthenticated,
    loading,
    loadingAuth,
    errors,
    userId,
    email,
    login,
    logout,
    refreshAccessToken,
  };
};

export default useAuth;
