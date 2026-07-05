import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'w-8 h-8 text-lg rounded-lg',
  md: 'w-10 h-10 text-xl rounded-[11px]',
  lg: 'w-12 h-12 text-2xl rounded-xl',
};

// Original Verse mark: an ink badge with a serif "V".
const Logo = ({ to = '/document/create', size = 'md' }: LogoProps) => {
  return (
    <Link
      to={to}
      aria-label="Verse home"
      className="flex flex-shrink-0 items-center justify-center"
    >
      <span
        className={`grid place-items-center bg-ink text-paper font-serif font-semibold leading-none select-none shadow-sm ${SIZES[size]}`}
      >
        V
      </span>
    </Link>
  );
};

export default Logo;
