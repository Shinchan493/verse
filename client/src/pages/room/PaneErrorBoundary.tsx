import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  label: string;
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Isolates a room pane so a crash in one (e.g. the whiteboard) doesn't blank
 * the whole room, and surfaces the error message for debugging.
 */
class PaneErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[room pane crash: ${this.props.label}]`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full grid place-items-center p-6 text-center bg-[#1c1c1c]">
          <div className="max-w-md">
            <p className="font-semibold text-red-400">
              {this.props.label} failed to load
            </p>
            <p className="mt-2 text-xs text-white/50 break-words font-mono">
              {this.state.error.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PaneErrorBoundary;
