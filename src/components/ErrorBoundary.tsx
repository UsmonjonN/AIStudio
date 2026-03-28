import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const errorData = JSON.parse(this.state.error?.message || '{}');
        if (errorData.error) {
          errorMessage = `Firestore Error: ${errorData.error} during ${errorData.operationType} on ${errorData.path}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-lg max-w-lg w-full text-center">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Application Error</h2>
            <p className="text-sm text-neutral-600 mb-3">{errorMessage}</p>
            <pre className="text-left text-xs bg-neutral-100 rounded-xl p-4 mb-6 overflow-auto max-h-40 text-red-700 whitespace-pre-wrap break-all">
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-neutral-200 text-neutral-800 px-6 py-2 rounded-full hover:bg-neutral-300 transition-colors mr-3"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-neutral-900 text-white px-6 py-2 rounded-full hover:bg-neutral-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
