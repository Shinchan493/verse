import { VideoCameraIcon } from '@heroicons/react/outline';
import { useNavigate } from 'react-router-dom';

interface StartSessionButtonProps {
  variant?: 'primary' | 'outline';
}

const StartSessionButton = ({
  variant = 'primary',
}: StartSessionButtonProps) => {
  const navigate = useNavigate();

  const startSession = () => {
    const id = Math.random().toString(36).slice(2, 8);
    navigate(`/room/${id}`);
  };

  const styles =
    variant === 'primary'
      ? 'bg-accent text-paper hover:bg-accent-hover shadow-sm'
      : 'border border-paper-2 text-ink hover:border-accent-soft hover:text-accent';

  return (
    <button
      onClick={startSession}
      className={`inline-flex flex-shrink-0 items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors ${styles}`}
    >
      <VideoCameraIcon className="w-4 h-4" />
      <span>Start a live session</span>
    </button>
  );
};

export default StartSessionButton;
