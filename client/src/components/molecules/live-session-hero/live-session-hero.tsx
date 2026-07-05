import StartSessionButton from '../../atoms/start-session-button';

const LiveSessionHero = () => {
  return (
    <div className="rounded-2xl border border-paper-2 bg-white overflow-hidden shadow-[0_16px_50px_-24px_rgba(26,26,26,0.25)]">
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Copy */}
        <div className="flex-1 p-7 sm:p-9">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent bg-accent-tint border border-accent-soft rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Live
          </span>
          <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold tracking-tight">
            Code together, live.
          </h2>
          <p className="mt-2 text-ink-soft max-w-md leading-relaxed">
            Open a room to write code, sketch on a shared whiteboard, and talk
            over video — all at once. Made for pair programming, interviews, and
            teaching.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StartSessionButton variant="primary" />
            <span className="text-xs text-ink-faint">
              No setup — just share the link.
            </span>
          </div>
        </div>

        {/* Decorative split-screen preview */}
        <div className="hidden md:block w-64 flex-shrink-0 bg-[#161616] p-4 relative">
          <div className="absolute top-3 right-3 flex -space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-accent ring-2 ring-[#161616]" />
            <span className="w-5 h-5 rounded-full bg-blue-500 ring-2 ring-[#161616]" />
          </div>
          <div className="h-full flex gap-2 pt-6">
            <div className="flex-1 rounded-lg bg-[#282c34] p-2 space-y-1.5">
              <div className="h-1.5 w-3/4 rounded bg-white/20" />
              <div className="h-1.5 w-1/2 rounded bg-accent/60" />
              <div className="h-1.5 w-2/3 rounded bg-white/15" />
              <div className="h-1.5 w-2/5 rounded bg-white/15" />
            </div>
            <div className="flex-1 rounded-lg bg-[#1c1c1d] p-2 grid place-items-center">
              <svg
                viewBox="0 0 40 40"
                className="w-12 h-12 text-white/25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  d="M6 30c6-10 10-14 14-14s6 8 14-2"
                />
                <circle cx="30" cy="12" r="2.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSessionHero;
