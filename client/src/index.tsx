import './polyfills';
import { createRoot } from 'react-dom/client';
import './assets/css/index.css';
import './assets/css/transitions.css';
import './assets/css/spinners.css';
import './assets/css/toasts.css';
import './assets/css/fonts.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Document from './pages/document';
import Landing from './pages/landing';
import Room from './pages/room';
import { ToastProvider } from './contexts/toast-context';
import { AuthProvider } from './contexts/auth-context';
import Login from './pages/login';
import Create from './pages/document/create';
import AuthRoute from './components/molecules/auth-route';
import { DocumentProvider } from './contexts/document-context';
import Register from './pages/register';
import VerifyEmail from './pages/user/verify-email';
import ResetPassword from './pages/user/reset-password';
import { BASE_URL } from './services/api';

// Warm up the API the moment the app loads: if Render's free tier has spun
// the server down, the cold start happens while the user is still looking at
// the landing/login page instead of on their first real request.
fetch(`${BASE_URL}health`).catch(() => {});

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route
            path="/document/:id"
            element={
              <AuthRoute
                element={
                  <DocumentProvider>
                    <Document />
                  </DocumentProvider>
                }
              />
            }
          />
          <Route
            path="/document/create"
            element={<AuthRoute element={<Create />} />}
          />
          <Route
            path="/room/:id"
            element={<AuthRoute element={<Room />} />}
          />
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/verify-email/:token" element={<VerifyEmail />} />
          <Route
            path="/user/reset-password/:token"
            element={<ResetPassword />}
          />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
