import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../../services/api';
import useAuth from '../../hooks/use-auth';
import { ToastContext } from '../../contexts/toast-context';
import CollabCodeEditor from './CollabCodeEditor';
import Whiteboard from './Whiteboard';
import VideoCall from './VideoCall';
import PaneErrorBoundary from './PaneErrorBoundary';
import { colorForName } from './room-yjs';

interface Participant {
  id: string;
  name: string;
}

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

  return (
    <div className="h-screen flex flex-col bg-[#161616] text-white font-sans overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-white/10 bg-[#111] flex-shrink-0">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-paper text-ink font-serif font-semibold">
            V
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Verse Live</p>
            <p className="text-[11px] text-white/40">Room · {roomId}</p>
          </div>
          <button
            onClick={copyLink}
            className="ml-2 text-xs font-medium text-white/70 hover:text-white bg-white/10 px-3 py-1.5 rounded-full"
          >
            Copy invite link
          </button>
        </div>

        {/* Video strip */}
        <div className="flex-1 flex justify-center overflow-x-auto">
          {socket && <VideoCall socket={socket} me={me} />}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex -space-x-2">
            {everyone.slice(0, 5).map((p) => (
              <span
                key={p.id}
                title={p.name}
                style={{ backgroundColor: colorForName(p.name) }}
                className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold uppercase ring-2 ring-[#111]"
              >
                {p.name[0]}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigate('/document/create')}
            className="text-xs font-semibold bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Split: code | whiteboard */}
      <div className="flex-1 flex min-h-0">
        <div style={{ width: '58%' }} className="min-w-0 h-full">
          <PaneErrorBoundary label="Code editor">
            {socket ? (
              <CollabCodeEditor socket={socket} me={me} />
            ) : (
              <div className="h-full grid place-items-center text-white/40 text-sm">
                Connecting to room…
              </div>
            )}
          </PaneErrorBoundary>
        </div>
        <div className="w-px bg-white/10 flex-shrink-0" />
        <div className="flex-1 min-w-0 h-full bg-white">
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
    </div>
  );
};

export default Room;
