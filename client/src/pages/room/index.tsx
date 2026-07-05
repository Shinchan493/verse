import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  ClipboardCopyIcon,
  LogoutIcon,
  PencilAltIcon,
} from '@heroicons/react/outline';
import { BASE_URL } from '../../services/api';
import useAuth from '../../hooks/use-auth';
import { ToastContext } from '../../contexts/toast-context';
import Wordmark from '../../components/atoms/wordmark';
import CollabCodeEditor from './CollabCodeEditor';
import Whiteboard from './Whiteboard';
import VideoCall from './VideoCall';
import PaneErrorBoundary from './PaneErrorBoundary';
import { colorForName } from './room-yjs';

interface Participant {
  id: string;
  name: string;
}

const Avatar = ({ name, ring }: { name: string; ring: string }) => (
  <span
    title={name}
    style={{ backgroundColor: colorForName(name) }}
    className={`w-8 h-8 rounded-full grid place-items-center text-xs font-semibold text-white uppercase ring-2 ${ring}`}
  >
    {name[0]}
  </span>
);

const PanelLabel = ({
  icon,
  children,
}: {
  icon: JSX.Element;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 px-4 py-2 border-b border-paper-2 bg-paper flex-shrink-0">
    <span className="text-ink-faint">{icon}</span>
    <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
      {children}
    </span>
  </div>
);

const Room = () => {
  const { id: roomId } = useParams();
  const { accessToken, email } = useAuth();
  const { success } = useContext(ToastContext);
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const me = email ?? 'Guest';

  useEffect(() => {
    if (!roomId || !accessToken) return;

    const s = io(`${BASE_URL}room`, {
      query: { roomId, accessToken, name: me },
    });

    const onPeers = (peers: Participant[]) => setParticipants(peers);
    const onJoined = (p: Participant) =>
      setParticipants((prev) =>
        prev.some((x) => x.id === p.id) ? prev : [...prev, p]
      );
    const onLeft = ({ id }: { id: string }) =>
      setParticipants((prev) => prev.filter((x) => x.id !== id));

    s.on('room:peers', onPeers);
    s.on('room:peer-joined', onJoined);
    s.on('room:peer-left', onLeft);

    setSocket(s);

    return () => {
      s.off('room:peers', onPeers);
      s.off('room:peer-joined', onJoined);
      s.off('room:peer-left', onLeft);
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, accessToken]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Room link copied — share it to invite others.');
  };

  const everyone = [{ id: 'me', name: me }, ...participants];
  const alone = participants.length === 0;

  return (
    <div className="h-screen flex flex-col bg-paper text-ink font-sans overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-5 py-2.5 border-b border-paper-2 bg-white flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Wordmark to="/document/create" size="sm" />
          <span className="h-6 w-px bg-paper-2 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="font-serif text-lg font-semibold">Live Session</span>
          </div>
          <button
            onClick={copyLink}
            className="hidden md:flex items-center gap-2 bg-paper hover:bg-paper-2 border border-paper-2 rounded-full pl-3 pr-2 py-1.5 transition-colors"
          >
            <span className="font-mono text-xs text-ink-soft">{roomId}</span>
            <ClipboardCopyIcon className="w-4 h-4 text-ink-faint" />
          </button>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex -space-x-2">
              {everyone.slice(0, 5).map((p) => (
                <Avatar key={p.id} name={p.name} ring="ring-white" />
              ))}
            </div>
            <span className="text-xs text-ink-faint">
              {everyone.length} in room
            </span>
          </div>
          <button
            onClick={() => navigate('/document/create')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 border border-paper-2 hover:border-red-200 hover:bg-red-50 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
            Leave
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Code */}
        <div
          style={{ width: '57%' }}
          className="min-w-0 h-full flex flex-col border-r border-paper-2"
        >
          <PaneErrorBoundary label="Code editor">
            {socket ? (
              <CollabCodeEditor socket={socket} me={me} />
            ) : (
              <div className="h-full grid place-items-center text-ink-faint text-sm bg-[#282c34]">
                Connecting to room…
              </div>
            )}
          </PaneErrorBoundary>
        </div>

        {/* Whiteboard */}
        <div className="flex-1 min-w-0 h-full flex flex-col bg-white">
          <PanelLabel icon={<PencilAltIcon className="w-4 h-4" />}>
            Whiteboard
          </PanelLabel>
          <div className="flex-1 min-h-0">
            <PaneErrorBoundary label="Whiteboard">
              {socket ? (
                <Whiteboard socket={socket} />
              ) : (
                <div className="h-full grid place-items-center text-ink-faint text-sm">
                  Connecting to room…
                </div>
              )}
            </PaneErrorBoundary>
          </div>
        </div>

        {/* Floating video call bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-white/90 backdrop-blur-md border border-paper-2 rounded-2xl shadow-[0_12px_40px_-12px_rgba(26,26,26,0.35)] px-3 py-2">
            {socket && <VideoCall socket={socket} me={me} />}
            {alone && (
              <p className="text-[11px] text-ink-faint text-center pt-1.5">
                Waiting for others — share the invite link.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
