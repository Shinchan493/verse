import { useEffect, useRef } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

interface GoogleSignInButtonProps {
  /** Called with the Google ID token (JWT) when the user completes sign-in. */
  onCredential: (credential: string) => void;
  /** Official button label variant. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

// Load the Google Identity Services script once, shared across mounts.
let gisPromise: Promise<void> | null = null;
const loadGis = (): Promise<void> => {
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
      if (existing && (window as any).google?.accounts?.id) return resolve();
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisPromise = null;
        reject(new Error('Failed to load Google Sign-In'));
      };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
};

/**
 * Renders the official "Sign in with Google" button (Google Identity
 * Services). Renders nothing when REACT_APP_GOOGLE_CLIENT_ID isn't set, so
 * deployments without OAuth configured just don't show the option.
 */
const GoogleSignInButton = ({
  onCredential,
  text = 'signin_with',
}: GoogleSignInButtonProps) => {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled || !slotRef.current) return;
        const gis = (window as any).google?.accounts?.id;
        if (!gis) return;
        gis.initialize({
          client_id: CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response?.credential) {
              onCredentialRef.current(response.credential);
            }
          },
        });
        gis.renderButton(slotRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: 384,
          logo_alignment: 'left',
        });
      })
      .catch(() => {
        /* button simply doesn't appear */
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) return null;

  return (
    <div>
      <div className="flex items-center gap-3 my-6">
        <span className="flex-1 h-px bg-paper-2" />
        <span className="text-xs uppercase tracking-wide text-ink-faint">or</span>
        <span className="flex-1 h-px bg-paper-2" />
      </div>
      <div ref={slotRef} className="flex justify-center min-h-[44px]" />
    </div>
  );
};

export default GoogleSignInButton;
