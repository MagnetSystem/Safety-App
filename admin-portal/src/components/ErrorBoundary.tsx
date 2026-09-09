import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin portal crashed", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full rounded-2xl border border-border bg-white p-6 space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
          <p className="text-sm text-slate-500">
            The page hit an unexpected error. Reload to continue. If this keeps happening, sign out and try again.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                window.location.href = "/login";
              }}
              className="px-4 py-2 rounded-lg border border-border text-sm"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }
}
