import { Link } from 'react-router-dom';
import Wordmark from '../../components/atoms/wordmark';
import useAuth from '../../hooks/use-auth';

const FEATURES = [
  {
    title: 'Truly real-time',
    body: 'Every keystroke syncs instantly. See who is here and where their cursor is, with edits merged conflict-free — no overwrites, no refresh.',
    icon: (
      <path
        d="M4 12a8 8 0 0 1 8-8m8 8a8 8 0 0 1-8 8M12 4a8 8 0 0 1 8 8M4 12a8 8 0 0 0 8 8"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: 'Calm by design',
    body: 'A clean page and a quiet toolbar. Nothing between you and the words — write, format, and stay in flow.',
    icon: <path d="M5 20l7-14 7 14M8.5 14h7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: 'Yours to keep',
    body: 'Your documents, your account, your data. Built to be self-hosted and owned — not locked behind someone else’s cloud.',
    icon: (
      <path
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const Landing = () => {
  const { isAuthenticated } = useAuth();
  // "it's free" implies signing up: send new visitors to Create account, and
  // send already-signed-in users straight into the app.
  const startHref = isAuthenticated ? '/document/create' : '/register';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Wordmark to="/" size="md" />
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/login"
            className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            Log in
          </Link>
          <Link
            to={startHref}
            className="text-sm font-semibold text-paper bg-ink px-4 py-2 rounded-full hover:bg-black transition-colors"
          >
            Start writing
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent bg-accent-tint border border-accent-soft rounded-full px-3 py-1">
            Collaborative writing
          </span>
          <h1 className="mt-6 font-serif font-semibold text-5xl sm:text-7xl leading-[1.05] tracking-tight">
            A calmer place to
            <br />
            write, together.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink-soft max-w-xl leading-relaxed">
            Verse is a shared, real-time document editor built for focus. Draft
            alongside your team on the same page — live, in sync, distraction-free.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              to={startHref}
              className="w-full sm:w-auto text-center font-semibold text-paper bg-accent hover:bg-accent-hover px-7 py-3.5 rounded-full transition-colors shadow-sm"
            >
              Start writing — it’s free
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto text-center font-medium text-ink hover:text-accent px-5 py-3.5 transition-colors"
            >
              I already have an account →
            </Link>
          </div>
        </div>

        {/* Editor peek */}
        <div className="mt-16 sm:mt-20 rounded-2xl border border-paper-2 bg-white shadow-[0_20px_60px_-24px_rgba(26,26,26,0.25)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-paper-2 bg-paper">
            <span className="w-3 h-3 rounded-full bg-accent-soft" />
            <span className="w-3 h-3 rounded-full bg-paper-2" />
            <span className="w-3 h-3 rounded-full bg-paper-2" />
            <span className="ml-3 text-xs text-ink-faint">Untitled — Verse</span>
            <div className="ml-auto flex -space-x-2">
              <span className="w-6 h-6 rounded-full bg-accent text-paper text-[11px] font-semibold grid place-items-center ring-2 ring-white">
                A
              </span>
              <span className="w-6 h-6 rounded-full bg-ink text-paper text-[11px] font-semibold grid place-items-center ring-2 ring-white">
                M
              </span>
            </div>
          </div>
          <div className="px-6 sm:px-10 py-8 sm:py-10">
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold">
              Project brief
            </h3>
            <p className="mt-4 text-ink-soft leading-relaxed">
              This paragraph is being written by two people at once. The
              <span className="bg-accent-tint border-b-2 border-accent"> highlighted text</span> shows a
              collaborator’s live selection — cursors and edits appear the moment
              they happen.
            </p>
            <p className="mt-4 text-ink-faint leading-relaxed">
              Keep typing. Nothing to save, nothing to sync — it just stays in
              step.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-paper-2 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-center">
            Everything a shared doc should be
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent-tint text-accent">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    {f.icon}
                  </svg>
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-ink-soft leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight">
            Start your first page.
          </h2>
          <p className="mt-4 text-paper/70 max-w-md mx-auto">
            No setup, no clutter. Open a blank document and invite someone in.
          </p>
          <Link
            to={startHref}
            className="inline-block mt-9 font-semibold text-ink bg-paper hover:bg-white px-8 py-3.5 rounded-full transition-colors"
          >
            Start writing
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-paper border-t border-paper-2">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Wordmark to="/" size="sm" />
          <p className="text-sm text-ink-faint">
            © {new Date().getFullYear()} Verse — write together.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
