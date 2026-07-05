import { VideoCameraIcon } from '@heroicons/react/outline';
import { useNavigate } from 'react-router-dom';

const StartSessionButton = () => {
  const navigate = useNavigate();

  const startSession = () => {
    const id = Math.random().toString(36).slice(2, 8);
    navigate(`/room/${id}`);
  };

  return (
    <button
      onClick={startSession}
      className="inline-flex flex-shrink-0 items-center gap-2 border border-paper-2 text-ink text-sm font-semibold px-4 py-2.5 rounded-full hover:border-accent-soft hover:text-accent transition-colors"
    >
      <VideoCameraIcon className="w-4 h-4" />
      <span>Live session</span>
    </button>
  );
};

export default StartSessionButton;
