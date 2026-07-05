import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';
import {
  MicrophoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/outline';

interface VideoCallProps {
  socket: Socket;
  me: string;
}

interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream;
}

const VideoTile = ({
  stream,
  label,
  muted,
}: {
  stream: MediaStream;
  label: string;
  muted?: boolean;
}) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-black flex-shrink-0 ring-1 ring-white/10">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <span className="absolute bottom-1 left-1.5 text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">
        {label}
      </span>
    </div>
  );
};

const VideoCall = ({ socket, me }: VideoCallProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <span className="text-xs text-white/50 px-2">{error}</span>
      ) : (
        <>
          {localStream && (
            <VideoTile stream={localStream} label={`${me} (you)`} muted />
          )}
          {remotePeers.map((p) => (
            <VideoTile key={p.id} stream={p.stream} label={p.name} />
          ))}
          <div className="flex flex-col gap-1.5 pl-1">
            <button
              onClick={toggleMic}
              title="Toggle microphone"
              className={`w-8 h-8 rounded-full grid place-items-center ${
                micOn ? 'bg-white/10 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
            <button
              onClick={toggleCam}
              title="Toggle camera"
              className={`w-8 h-8 rounded-full grid place-items-center ${
                camOn ? 'bg-white/10 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <VideoCameraIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoCall;
