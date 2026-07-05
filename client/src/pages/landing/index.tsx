import { Link } from 'react-router-dom';
import Wordmark from '../../components/atoms/wordmark';
import useAuth from '../../hooks/use-auth';

// Update this to your public repo when you open-source it.
const GITHUB_URL = 'https://github.com/anishmehta24/collab-docs';

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.15 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
  </svg>
);

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
          <a
            href="#live"
            className="hidden sm:inline text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            Live sessions
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            title="Star on GitHub"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <GitHubIcon className="w-4 h-4" />
            GitHub
          </a>
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
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent bg-accent-tint border border-accent-soft rounded-full px-3 py-1">
            <GitHubIcon className="w-3.5 h-3.5" />
            Open source · Real-time
          </span>
          <h1 className="mt-6 font-serif font-semibold text-5xl sm:text-7xl leading-[1.02] tracking-tight">
            Write, code, and
            <br />
            think{' '}
            <span className="italic text-accent">together</span>.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink-soft max-w-xl leading-relaxed">
            Verse is the open-source workspace for real-time collaboration —
            shared documents, live coding rooms with video, and a whiteboard. One
            place to create with your team, in the same moment.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              to={startHref}
              className="w-full sm:w-auto text-center font-semibold text-paper bg-accent hover:bg-accent-hover px-7 py-3.5 rounded-full transition-colors shadow-sm"
            >
              Start creating — it’s free
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold text-paper bg-ink hover:bg-black px-7 py-3.5 rounded-full transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>
          <Link
            to="/login"
            className="mt-4 inline-block text-sm font-medium text-ink-soft hover:text-accent transition-colors"
          >
            I already have an account →
          </Link>
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

      {/* Live Sessions — the USP */}
      <section id="live" className="border-t border-paper-2 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent bg-accent-tint border border-accent-soft rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Live Sessions
            </span>
            <h2 className="mt-6 font-serif text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Not just docs —
              <br />
              code together, live.
            </h2>
            <p className="mt-5 text-lg text-ink-soft leading-relaxed max-w-md">
              Spin up a room to pair-program, run an interview, or teach — a
              shared code editor, a collaborative whiteboard, and built-in video,
              all in one place.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                'Real-time code editor with shared cursors',
                'A whiteboard to sketch and explain',
                'Video & audio built in — no extra tools',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid place-items-center w-5 h-5 rounded-full bg-accent-tint text-accent flex-shrink-0">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to={startHref}
              className="inline-block mt-8 font-semibold text-paper bg-accent hover:bg-accent-hover px-7 py-3.5 rounded-full transition-colors shadow-sm"
            >
              Start a live session
            </Link>
          </div>

          {/* Dark room preview */}
          <div className="rounded-2xl border border-ink/10 bg-[#141414] shadow-[0_28px_80px_-28px_rgba(26,26,26,0.55)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="font-serif text-sm font-semibold text-white">
                Live Session
              </span>
              <div className="ml-auto flex -space-x-2">
                <span className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-semibold grid place-items-center ring-2 ring-[#141414]">
                  A
                </span>
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-[11px] font-semibold grid place-items-center ring-2 ring-[#141414]">
                  M
                </span>
              </div>
            </div>
            <div className="flex h-60">
              <div className="flex-1 border-r border-white/10 p-4 space-y-2.5 bg-[#131316]">
                <div className="h-2 w-2/5 rounded bg-accent/60" />
                <div className="h-2 w-3/5 rounded bg-white/15" />
                <div className="h-2 w-1/2 rounded bg-white/15" />
                <div className="h-2 w-2/3 rounded bg-blue-400/40" />
                <div className="h-2 w-1/3 rounded bg-white/15" />
                <div className="h-2 w-3/5 rounded bg-white/10" />
                <div className="h-2 w-2/5 rounded bg-white/10" />
              </div>
              <div className="flex-1 p-4 grid place-items-center bg-[#101011]">
                <svg
                  viewBox="0 0 80 60"
                  className="w-28 h-20 text-white/25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 46c10-18 18-24 26-24s10 14 22 2"
                  />
                  <circle cx="60" cy="18" r="4" />
                  <path strokeLinecap="round" d="M44 50h28" />
                </svg>
              </div>
            </div>
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
          <div className="flex items-center gap-5">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              Open source on GitHub
            </a>
            <p className="text-sm text-ink-faint">
              © {new Date().getFullYear()} Verse
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
