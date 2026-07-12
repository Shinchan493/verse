import TextField from '../../components/atoms/text-field/text-field';
import { KeyboardEvent, useContext, useState } from 'react';
import { ToastContext } from '../../contexts/toast-context';
import Wordmark from '../../components/atoms/wordmark';
import validator from 'validator';
import Spinner from '../../components/atoms/spinner';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/use-auth';
import AuthService from '../../services/auth-service';
import GoogleSignInButton from '../../components/molecules/google-signin-button';
import axios, { AxiosError } from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [emailErrors, setEmailErrors] = useState<Array<string>>([]);
  const [password, setPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Array<string>>([]);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useContext(ToastContext);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    setEmailErrors([]);
    setPasswordErrors([]);
    let isValid = true;

    if (!validator.isEmail(email)) {
      setEmailErrors(['Must enter a valid email.']);
      isValid = false;
    }
    if (!password.length) {
      setPasswordErrors(['Must enter a password.']);
      isValid = false;
    }

    return isValid;
  };

  const loginUser = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await AuthService.login({ email, password });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data;
      login(newAccessToken, newRefreshToken);
      success('Successfully logged in!');
      navigate('/document/create');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const { response } = err as AxiosError;
        if (response?.data.errors.length > 0) {
          error(response?.data.errors[0].msg);
        } else {
          error('Incorrect username or password.');
        }
      } else {
        error('An unknown error has occured. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    try {
      const response = await AuthService.googleLogin({ credential });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data;
      login(newAccessToken, newRefreshToken);
      success('Successfully logged in!');
      navigate('/document/create');
    } catch (err) {
      const msg = (err as any)?.response?.data?.errors?.[0]?.msg;
      error(msg ?? 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') loginUser();
  };

  const handleOnInputEmail = (value: string) => {
    setEmailErrors([]);
    setEmail(value);
  };

  const handleOnInputPassword = (value: string) => {
    setPasswordErrors([]);
    setPassword(value);
  };

  return (
    <div className="min-h-screen w-full flex font-sans text-ink">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink text-paper flex-col justify-between p-14">
        <Wordmark to="/" size="md" invert />
        <div className="max-w-md">
          <h2 className="font-serif text-5xl font-semibold leading-tight tracking-tight">
            Write in the same place, at the same time.
          </h2>
          <p className="mt-6 text-paper/60 text-lg leading-relaxed">
            Verse keeps everyone on the same page — literally. Pick up right
            where your team left off.
          </p>
        </div>
        <p className="text-paper/40 text-sm">
          © {new Date().getFullYear()} Verse
        </p>
      </div>

      {/* Form panel */}
      <div
        onKeyPress={handleOnKeyPress}
        className="w-full lg:w-1/2 bg-paper flex flex-col justify-center items-center p-6 sm:p-12"
      >
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <Wordmark to="/" />
          </div>

          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-ink-soft">Sign in to continue to Verse.</p>

          <div className="mt-9 flex flex-col space-y-5">
            <TextField
              value={email}
              onInput={handleOnInputEmail}
              label="Email"
              color="secondary"
              errors={emailErrors}
            />
            <div>
              <TextField
                value={password}
                onInput={handleOnInputPassword}
                label="Password"
                type="password"
                color="secondary"
                errors={passwordErrors}
              />
              <button
                tabIndex={-1}
                className="mt-2 text-sm font-medium text-ink-soft hover:text-accent transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={loginUser}
              disabled={loading}
              className="bg-accent text-paper text-sm font-semibold px-3 py-3 rounded-lg hover:bg-accent-hover transition-colors flex justify-center items-center shadow-sm disabled:opacity-70"
            >
              <span className={`${loading && 'opacity-0'}`}>Sign in</span>
              {loading && <Spinner size="sm" />}
            </button>
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            text="signin_with"
          />

          <p className="mt-8 text-sm text-ink-soft">
            New to Verse?{' '}
            <Link
              to="/register"
              className="font-semibold text-accent hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
