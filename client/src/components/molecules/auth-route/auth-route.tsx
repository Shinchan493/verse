import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../../hooks/use-auth';
import Spinner from '../../atoms/spinner';

interface AuthRouteProps {
  element: JSX.Element;
}

const AuthRoute = ({ element }: AuthRouteProps) => {
  const { loadingAuth, isAuthenticated, refreshAccessToken } = useAuth();

  useEffect(() => {
    refreshAccessToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // loadingAuth stays true while the session refresh is retrying (e.g. the
  // API is mid-deploy), so a valid session shows this instead of being
  // bounced to /login.
  if (loadingAuth) {
    return (
      <div className="h-screen w-full grid place-items-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="md" />
          <p className="text-sm text-ink-faint">Signing you in…</p>
        </div>
      </div>
    );
  } else {
    if (isAuthenticated) return element;
    else return <Navigate to="/login" />;
  }
};

export default AuthRoute;
