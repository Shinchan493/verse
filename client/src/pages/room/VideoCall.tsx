import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer/simplepeer.min.js';
import { Socket } from 'socket.io-client';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ArrowsExpandIcon,
  MinusSmIcon,
  UsersIcon,
  XIcon,
} from '@heroicons/react/outline';

export type VideoMode = 'pill' | 'dock' | 'theater';

interface VideoCallProps {
  socket: Socket;
  me: string;
  mode: VideoMode;
  onModeChange: (mode: VideoMode) => void;
}

interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream;
}

const VideoTile = ({
  stream,
  label,
  className = 'w-32 h-20',
  onClick,
}: {
  stream: MediaStream;
  label: string;
  className?: string;
  onClick?: () => void;
}) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden bg-ink flex-shrink-0 ring-1 ring-black/5 ${className} ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-white/30' : ''
      }`}
    >
      {/* Video elements are always muted — audio plays via the persistent
          AudioSink elements so it survives pill/theater mode switches. */}
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <span className="absolute bottom-1 left-1.5 max-w-[80%] truncate text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">
        {label}
      </span>
    </div>
  );
};

// Invisible, always-mounted audio output for a remote stream.
const AudioSink = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay />;
};

const RoundButton = ({
  onClick,
  title,
  active = true,
  small = false,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  small?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`${
      small ? 'w-7 h-7' : 'w-9 h-9'
    } rounded-full grid place-items-center transition-colors flex-shrink-0 ${
      active ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-600 text-white'
    }`}
  >
    {children}
  </button>
);

const VideoCall = ({ socket, me, mode, onModeChange }: VideoCallProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);

  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const namesRef = useRef<Record<string, string>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const offSocketRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    const createPeer = (peerId: string, initiator: boolean) => {
      const peer = new Peer({
        initiator,
        trickle: true,
        stream: localStreamRef.current || undefined,
      });

      peer.on('signal', (signal) => {
        socket.emit('rtc:signal', { to: peerId, signal });
      });
      peer.on('stream', (stream) => {
        setRemotePeers((prev) => {
          const others = prev.filter((p) => p.id !== peerId);
          return [
            ...others,
            { id: peerId, name: namesRef.current[peerId] || 'Guest', stream },
          ];
        });
      });
      const cleanup = () => {
        setRemotePeers((prev) => prev.filter((p) => p.id !== peerId));
        delete peersRef.current[peerId];
      };
      peer.on('close', cleanup);
      peer.on('error', cleanup);

      peersRef.current[peerId] = peer;
      return peer;
    };

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Existing participants -> we initiate to them.
        const onPeers = (peers: { id: string; name: string }[]) => {
          peers.forEach((p) => {
            namesRef.current[p.id] = p.name;
            if (!peersRef.current[p.id]) createPeer(p.id, true);
          });
        };
        // A newcomer arrives -> we wait for their offer (non-initiator).
        const onPeerJoined = (p: { id: string; name: string }) => {
          namesRef.current[p.id] = p.name;
          if (!peersRef.current[p.id]) createPeer(p.id, false);
        };
        const onSignal = ({
          from,
          signal,
        }: {
          from: string;
          signal: Peer.SignalData;
        }) => {
          let peer = peersRef.current[from];
          if (!peer) peer = createPeer(from, false);
          peer.signal(signal);
        };
        const onPeerLeft = ({ id }: { id: string }) => {
          peersRef.current[id]?.destroy();
          delete peersRef.current[id];
          setRemotePeers((prev) => prev.filter((p) => p.id !== id));
        };

        socket.on('room:peers', onPeers);
        socket.on('room:peer-joined', onPeerJoined);
        socket.on('rtc:signal', onSignal);
        socket.on('room:peer-left', onPeerLeft);
        offSocketRef.current = () => {
          socket.off('room:peers', onPeers);
          socket.off('room:peer-joined', onPeerJoined);
          socket.off('rtc:signal', onSignal);
          socket.off('room:peer-left', onPeerLeft);
        };

        // Now that we're ready, ask who is already here.
        socket.emit('room:get-peers');
      })
      .catch(() => {
        if (!cancelled) setError('Camera / microphone unavailable.');
      });

    return () => {
      cancelled = true;
      offSocketRef.current();
      Object.values(peersRef.current).forEach((p) => p.destroy());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Theater: Esc returns to the dock.
  useEffect(() => {
    if (mode !== 'theater') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onModeChange('dock');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onModeChange]);

  const toggleMic = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };
  const toggleCam = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  if (error) {
    return <span className="text-xs text-white/40 px-3 py-6">{error}</span>;
  }

  // Everyone, self first. Audio sinks stay mounted in every mode so remote
  // voices keep playing even when tiles aren't visible (pill mode).
  const tiles: { id: string; name: string; stream: MediaStream }[] = [
    ...(localStream ? [{ id: 'me', name: `${me} (you)`, stream: localStream }] : []),
    ...remotePeers,
  ];
  const audioSinks = remotePeers.map((p) => (
    <AudioSink key={p.id} stream={p.stream} />
  ));

  const controls = (small = false) => (
    <>
      <RoundButton onClick={toggleMic} title="Toggle microphone" active={micOn} small={small}>
        <MicrophoneIcon className="w-4 h-4" />
      </RoundButton>
      <RoundButton onClick={toggleCam} title="Toggle camera" active={camOn} small={small}>
        <VideoCameraIcon className="w-4 h-4" />
      </RoundButton>
    </>
  );

  // --- Pill: tiny presence chip; click body to expand (handled by the dock) ---
  if (mode === 'pill') {
    return (
      <div className="flex items-center gap-2 py-0.5" title="Click to expand">
        {audioSinks}
        <span className="flex items-center gap-1 text-xs text-white/70">
          <UsersIcon className="w-4 h-4" />
          {tiles.length}
        </span>
        {controls(true)}
        <RoundButton
          onClick={() => onModeChange('theater')}
          title="Theater view"
          small
        >
          <ArrowsExpandIcon className="w-3.5 h-3.5" />
        </RoundButton>
      </div>
    );
  }

  // --- Theater: full-screen overlay, spotlight + filmstrip ---
  if (mode === 'theater') {
    const spotlight =
      tiles.find((t) => t.id === spotlightId) ??
      tiles.find((t) => t.id !== 'me') ??
      tiles[0];
    const rest = tiles.filter((t) => t.id !== spotlight?.id);

    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-6">
        {audioSinks}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Spotlight */}
          <div className="flex-1 min-w-0 grid place-items-center">
            {spotlight && (
              <VideoTile
                stream={spotlight.stream}
                label={spotlight.name}
                className="w-full h-full max-h-full"
              />
            )}
          </div>
          {/* Filmstrip */}
          {rest.length > 0 && (
            <div className="w-36 sm:w-44 flex flex-col gap-3 overflow-y-auto flex-shrink-0">
              {rest.map((t) => (
                <VideoTile
                  key={t.id}
                  stream={t.stream}
                  label={t.name}
                  className="w-full aspect-video"
                  onClick={() => setSpotlightId(t.id)}
                />
              ))}
            </div>
          )}
        </div>
        {/* Controls */}
        <div className="flex items-center justify-center gap-2 pt-4 flex-shrink-0">
          {controls()}
          <RoundButton onClick={() => onModeChange('dock')} title="Exit theater (Esc)">
            <XIcon className="w-4 h-4" />
          </RoundButton>
        </div>
      </div>
    );
  }

  // --- Dock: the floating panel — large tiles, slim control row below ---
  return (
    <div className="flex flex-col gap-2">
      {audioSinks}
      <div className="flex items-center gap-2">
        {tiles.map((t) => (
          <VideoTile
            key={t.id}
            stream={t.stream}
            label={t.name}
            className="w-44 h-28"
            onClick={() => {
              setSpotlightId(t.id);
              onModeChange('theater');
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {controls(true)}
        <RoundButton
          onClick={() => onModeChange('theater')}
          title="Theater view"
          small
        >
          <ArrowsExpandIcon className="w-3.5 h-3.5" />
        </RoundButton>
        <RoundButton onClick={() => onModeChange('pill')} title="Minimize" small>
          <MinusSmIcon className="w-4 h-4" />
        </RoundButton>
      </div>
    </div>
  );
};

export default VideoCall;
