import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-6 text-center text-slate-300">
          <h2 className="text-lg font-semibold mb-2 text-slate-200">
            Something went wrong.
          </h2>
          <p className="mb-4 text-slate-400">
            This section couldn't load. You can retry or reload the app.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={this.handleRetry}>Retry</Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 text-left whitespace-pre-wrap text-xs text-slate-400 max-w-2xl mx-auto">
              <summary className="cursor-pointer mb-2">Error Details</summary>
              <pre className="p-4 bg-slate-800 rounded overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper helper for convenience
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
};

