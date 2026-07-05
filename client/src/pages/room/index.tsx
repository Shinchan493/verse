import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  ClipboardCopyIcon,
  LogoutIcon,
  PencilAltIcon,
  ClockIcon,
  UsersIcon,
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

const Avatar = ({
  name,
  ring,
  size = 'md',
}: {
  name: string;
  ring: string;
  size?: 'sm' | 'md';
}) => (
  <span
    title={name}
    style={{ backgroundColor: colorForName(name) }}
    className={`${
      size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs'
    } rounded-full grid place-items-center font-semibold text-white uppercase ring-2 ${ring}`}
  >
    {name[0]}
  </span>
);

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
    2,
    '0'
  )}`;

const Room = () => {
  const { id: roomId } = useParams();
  const { accessToken, email } = useAuth();
  const { success } = useContext(ToastContext);
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showPeople, setShowPeople] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  const me = email ?? 'Guest';

  useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    return () => clearInterval(t);
  }, []);

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
    <div className="h-screen flex flex-col bg-[#141414] text-white font-sans overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-5 py-2.5 border-b border-white/10 bg-[#0f0f0f] flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Wordmark to="/document/create" size="sm" invert />
          <span className="h-6 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="font-serif text-lg font-semibold">
              Live Session
            </span>
          </div>
          <button
            onClick={copyLink}
            title="Copy invite link"
            className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-2 py-1.5 transition-colors"
          >
            <span className="font-mono text-xs text-white/60">{roomId}</span>
            <ClipboardCopyIcon className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Session timer */}
          <div className="hidden sm:flex items-center gap-1.5 text-white/40 text-xs font-mono">
            <ClockIcon className="w-4 h-4" />
            {fmt(elapsed)}
          </div>

          {/* Participants (click for details) */}
          <div className="relative">
            <button
              onClick={() => setShowPeople((v) => !v)}
              className="flex items-center gap-2 hover:bg-white/5 rounded-full pl-1 pr-2.5 py-1 transition-colors"
            >
              <div className="flex -space-x-2">
                {everyone.slice(0, 4).map((p) => (
                  <Avatar key={p.id} name={p.name} ring="ring-[#0f0f0f]" />
                ))}
              </div>
              <span className="text-xs text-white/50">{everyone.length}</span>
            </button>

            {showPeople && (
              <div
                className="absolute right-0 top-full mt-2 w-72 bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl z-40 overflow-hidden"
                onMouseLeave={() => setShowPeople(false)}
              >
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <UsersIcon className="w-4 h-4 text-white/40" />
                  <span className="text-sm font-semibold">
                    In this session ({everyone.length})
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {everyone.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5"
                    >
                      <Avatar name={p.name} ring="ring-transparent" size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {p.name}
                          {p.id === 'me' && (
                            <span className="text-white/40 font-normal">
                              {' '}
                              (you)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={copyLink}
                  className="w-full text-left px-4 py-2.5 border-t border-white/10 text-sm font-medium text-accent hover:bg-white/5"
                >
                  + Invite people
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/document/create')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-full transition-colors"
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
          className="min-w-0 h-full flex flex-col border-r border-white/10"
        >
          <PaneErrorBoundary label="Code editor">
            {socket ? (
              <CollabCodeEditor socket={socket} me={me} />
            ) : (
              <div className="h-full grid place-items-center text-white/40 text-sm bg-[#131316]">
                Connecting to room…
              </div>
            )}
          </PaneErrorBoundary>
        </div>

        {/* Whiteboard */}
        <div className="flex-1 min-w-0 h-full flex flex-col bg-[#101011]">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-[#0f0f0f] flex-shrink-0">
            <PencilAltIcon className="w-4 h-4 text-white/40" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Whiteboard
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <PaneErrorBoundary label="Whiteboard">
              {socket ? (
                <Whiteboard socket={socket} />
              ) : (
                <div className="h-full grid place-items-center text-white/40 text-sm">
                  Connecting to room…
                </div>
              )}
            </PaneErrorBoundary>
          </div>
        </div>

        {/* Floating video call bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-[#1c1c1c]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl px-3 py-2">
            {socket && <VideoCall socket={socket} me={me} />}
            {alone && (
              <p className="text-[11px] text-white/40 text-center pt-1.5">
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
