import TextField from '../../components/atoms/text-field/text-field';
import { KeyboardEvent, useContext, useState } from 'react';
import { ToastContext } from '../../contexts/toast-context';
import Wordmark from '../../components/atoms/wordmark';
import validator from 'validator';
import Spinner from '../../components/atoms/spinner';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import AuthService from '../../services/auth-service';

const Register = () => {
  const [email, setEmail] = useState('');
  const [emailErrors, setEmailErrors] = useState<Array<string>>([]);
  const [loading, setLoading] = useState(false);
  const [password1, setPassword1] = useState('');
  const [password1Errors, setPassword1Errors] = useState<Array<string>>([]);
  const [password2, setPassword2] = useState('');
  const [password2Errors, setPassword2Errors] = useState<Array<string>>([]);
  const navigate = useNavigate();
  const { addToast, error } = useContext(ToastContext);

  const validate = () => {
    setEmailErrors([]);
    setPassword1Errors([]);
    setPassword2Errors([]);
    let isValid = true;

    if (!validator.isEmail(email)) {
      setEmailErrors(['Must enter a valid email.']);
      isValid = false;
    }
    if (!(password1.length >= 8 && password1.length <= 25)) {
      setPassword1Errors((prev) => [
        ...prev,
        'Password must be between 8 and 25 characters.',
      ]);
      isValid = false;
    }
    if (!/\d/.test(password1)) {
      setPassword1Errors((prev) => [
        ...prev,
        'Password must contain at least 1 number.',
      ]);
      isValid = false;
    }
    if (password1 !== password2) {
      setPassword2Errors(['Passwords do not match.']);
      isValid = false;
    }

    return isValid;
  };

  const register = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await AuthService.register({
        email,
        password1,
        password2,
      });

      addToast({
        title: `Welcome to Verse, ${email}!`,
        body: 'Your account is ready — sign in to start writing.',
        color: 'success',
      });
      navigate('/login');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const { response } = err as AxiosError;
        const errors = (response as any).data.errors;
        const emailFieldErrors = errors
          .filter((error: any) => error.param === 'email')
          .map((error: any) => error.msg);
        const password1FieldErrors = errors
          .filter((error: any) => error.param === 'password1')
          .map((error: any) => error.msg);
        const passsword2FieldErrors = errors
          .filter((error: any) => error.param === 'password2')
          .map((error: any) => error.msg);

        if (emailFieldErrors) setEmailErrors(emailFieldErrors);
        if (password1FieldErrors) setPassword1Errors(password1FieldErrors);
        if (passsword2FieldErrors) setPassword2Errors(passsword2FieldErrors);

        if (!emailErrors && !password1FieldErrors && !passsword2FieldErrors) {
          error('An unknown error has occurred. Please try again');
        }
      } else {
        error('An unknown error has occurred. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') register();
  };

  const handleOnInputEmail = (value: string) => {
    setEmailErrors([]);
    setEmail(value);
  };

  const handleOnInputPassword1 = (value: string) => {
    setPassword1Errors([]);
    setPassword1(value);
  };

  const handleOnInputPassword2 = (value: string) => {
    setPassword2Errors([]);
    setPassword2(value);
  };

  return (
    <div className="min-h-screen w-full flex font-sans text-ink">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink text-paper flex-col justify-between p-14">
        <Wordmark to="/" size="md" invert />
        <div className="max-w-md">
          <h2 className="font-serif text-5xl font-semibold leading-tight tracking-tight">
            Your first page is a blank one.
          </h2>
          <p className="mt-6 text-paper/60 text-lg leading-relaxed">
            Create an account and open a document in seconds. Invite anyone —
            everyone edits together, live.
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
            Create your account
          </h1>
          <p className="mt-2 text-ink-soft">Start writing on Verse — it’s free.</p>

          <div className="mt-9 flex flex-col space-y-5">
            <TextField
              value={email}
              onInput={handleOnInputEmail}
              label="Email"
              color="secondary"
              errors={emailErrors}
            />
            <TextField
              value={password1}
              onInput={handleOnInputPassword1}
              label="Password"
              type="password"
              color="secondary"
              errors={password1Errors}
            />
            <TextField
              value={password2}
              onInput={handleOnInputPassword2}
              label="Confirm password"
              type="password"
              color="secondary"
              errors={password2Errors}
            />

            <button
              onClick={register}
              disabled={loading}
              className="bg-accent text-paper text-sm font-semibold px-3 py-3 rounded-lg hover:bg-accent-hover transition-colors flex justify-center items-center shadow-sm disabled:opacity-70"
            >
              <span className={`${loading && 'opacity-0'}`}>Create account</span>
              {loading && <Spinner size="sm" />}
            </button>
          </div>

          <p className="mt-8 text-sm text-ink-soft">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-accent hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
