import { Link } from 'react-router-dom';

interface WordmarkProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  invert?: boolean;
}

const CONFIG = {
  sm: { badge: 'w-7 h-7 text-base rounded-lg', text: 'text-lg' },
  md: { badge: 'w-9 h-9 text-xl rounded-[10px]', text: 'text-2xl' },
  lg: { badge: 'w-12 h-12 text-2xl rounded-xl', text: 'text-3xl' },
};

// Verse wordmark: the ink badge + serif logotype. Used on marketing/auth pages.
const Wordmark = ({ to = '/', size = 'md', invert = false }: WordmarkProps) => {
  const { badge, text } = CONFIG[size];
  return (
    <Link to={to} aria-label="Verse home" className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center font-serif font-semibold leading-none select-none shadow-sm ${badge} ${
          invert ? 'bg-paper text-ink' : 'bg-ink text-paper'
        }`}
      >
        V
      </span>
      <span
        className={`font-serif font-semibold tracking-tight ${text} ${
          invert ? 'text-paper' : 'text-ink'
        }`}
      >
        Verse
      </span>
    </Link>
  );
};

export default Wordmark;
