import { useContext } from 'react';
import { AuthContext } from '../contexts/auth-context';
import AuthService from '../services/auth-service';
import useLocalStorage from './use-local-storage';
import jwt_decode from 'jwt-decode';
import Token from '../types/interfaces/token';

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

  const refreshAccessToken = async () => {
    if (refreshToken === null) {
      destroyAuth();
      setLoadingAuth(false);
      return;
    }
    try {
      const response = await AuthService.refreshToken({ token: refreshToken });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data;
      login(newAccessToken, newRefreshToken);
    } catch (error) {
      // Only a definitive rejection (4xx) invalidates the session. On network
      // errors or 5xx — e.g. the API is redeploying or cold-starting — keep
      // the session and retry until the server is reachable again.
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status !== undefined && status < 500) {
        destroyAuth();
      } else {
        setTimeout(refreshAccessToken, 15000);
      }
    } finally {
      setLoadingAuth(false);
    }
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
    // so requests never race an expired token.
    const msExpiration = Math.max(exp * 1000 - Date.now() - 60_000, 0);
    setTimeout(() => {
      refreshAccessToken();
    }, msExpiration);
  };

  const destroyAuth = () => {
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
