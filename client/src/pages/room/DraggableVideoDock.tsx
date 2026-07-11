import { ReactNode, useRef, useState } from 'react';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

const CORNER_CLASS: Record<Corner, string> = {
  tl: 'top-4 left-4',
  tr: 'top-4 right-4',
  bl: 'bottom-4 left-4',
  br: 'bottom-4 right-4',
};

const EDGE_MARGIN = 8;

/**
 * Floating panel for the video call bar: drag it anywhere in the workspace
 * and it snaps to the nearest corner on release (Meet-style PiP). Uses
 * pointer capture so the drag stays smooth over the editor / whiteboard.
 */
const DraggableVideoDock = ({ children }: { children: ReactNode }) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const grabRef = useRef({ dx: 0, dy: 0 });
  const [corner, setCorner] = useState<Corner>('br');
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  const rects = () => {
    const panel = panelRef.current;
    const container = panel?.offsetParent as HTMLElement | null;
    if (!panel || !container) return null;
    return {
      panel: panel.getBoundingClientRect(),
      container: container.getBoundingClientRect(),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Buttons (mic/cam) and video tiles keep their own interactions.
    if ((e.target as HTMLElement).closest('button, video, a, input')) return;
    const r = rects();
    if (!r) return;
    grabRef.current = {
      dx: e.clientX - r.panel.left,
      dy: e.clientY - r.panel.top,
    };
    panelRef.current!.setPointerCapture(e.pointerId);
    setDrag({
      x: r.panel.left - r.container.left,
      y: r.panel.top - r.container.top,
    });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const r = rects();
    if (!r) return;
    const x = e.clientX - r.container.left - grabRef.current.dx;
    const y = e.clientY - r.container.top - grabRef.current.dy;
    setDrag({
      x: Math.min(
        Math.max(x, EDGE_MARGIN),
        r.container.width - r.panel.width - EDGE_MARGIN
      ),
      y: Math.min(
        Math.max(y, EDGE_MARGIN),
        r.container.height - r.panel.height - EDGE_MARGIN
      ),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    panelRef.current?.releasePointerCapture(e.pointerId);
    const r = rects();
    if (r) {
      // Snap to whichever corner the panel's center is closest to.
      const cx = drag.x + r.panel.width / 2;
      const cy = drag.y + r.panel.height / 2;
      const vertical = cy < r.container.height / 2 ? 't' : 'b';
      const horizontal = cx < r.container.width / 2 ? 'l' : 'r';
      setCorner(`${vertical}${horizontal}` as Corner);
    }
    setDrag(null);
  };

  return (
    <div
      ref={panelRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={drag ? { left: drag.x, top: drag.y } : undefined}
      title={drag ? undefined : 'Drag to move — snaps to a corner'}
      className={`absolute z-30 touch-none select-none ${
        drag ? 'cursor-grabbing' : `cursor-grab ${CORNER_CLASS[corner]}`
      }`}
    >
      <div className="bg-[#1c1c1c]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl pl-2 pr-3 py-2 flex items-center gap-2">
        {/* Grip dots — the drag affordance */}
        <div className="grid grid-cols-2 gap-0.5 flex-shrink-0" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-white/25" />
          ))}
        </div>
        <div className="flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default DraggableVideoDock;
