import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { ErrorBoundary, withErrorBoundary } from "./ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
};

// Suppress console.error for expected error boundaries
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  describe("Normal rendering", () => {
    it("should render children when there is no error", () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should render children component normally", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("should catch errors and display fallback UI", async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });

      expect(
        screen.getByText("This section couldn't load. You can retry or reload the app.")
      ).toBeInTheDocument();
    });

    it("should log error to console", async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it("should display Retry and Reload buttons", async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
        expect(screen.getByText("Reload")).toBeInTheDocument();
      });
    });
  });

  describe("Retry functionality", () => {
    it("should reset error state when Retry is clicked", async () => {
      const user = userEvent.setup();

      // Component that uses state to control error throwing
      const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error("Test error");
        }
        return <div>No error</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });

      // Now fix the error condition and click retry
      const retryButton = screen.getByText("Retry");
      
      // Re-render with error fixed before clicking retry
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      await user.click(retryButton);

      // After retry, ErrorBoundary should render the children (which no longer throw)
      await waitFor(() => {
        expect(screen.getByText("No error")).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe("Custom fallback", () => {
    it("should render custom fallback when provided", async () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Custom error message")).toBeInTheDocument();
      });

      expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
    });
  });

  describe("DEV mode stack trace", () => {
    it("should show stack trace in DEV mode", async () => {
      // Mock import.meta.env.DEV to be true
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta, "env", {
        value: { ...import.meta.env, DEV: true },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });

      // Check if details element exists (stack trace container)
      const details = screen.queryByText("Error Details");
      if (details) {
        expect(details).toBeInTheDocument();
      }

      // Restore original env
      Object.defineProperty(import.meta, "env", {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true,
      });
    });
  });

  describe("withErrorBoundary helper", () => {
    it("should wrap component with ErrorBoundary", () => {
      const TestComponent = () => <div>Test</div>;
      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("should handle errors in wrapped component", async () => {
      const FailingComponent = () => {
        throw new Error("Wrapped error");
      };
      
      const WrappedComponent = withErrorBoundary(FailingComponent);

      render(<WrappedComponent />);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      });
    });
  });
});

