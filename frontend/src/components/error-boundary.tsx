"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="bg-gray-900 border-red-800 max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <CardTitle className="text-red-400">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-sm">
                An error occurred while loading this page. This might be due to a network issue or a temporary problem.
              </p>
              
              {this.state.error && (
                <details className="bg-gray-800 p-3 rounded text-xs">
                  <summary className="cursor-pointer text-gray-400 mb-2">Error details</summary>
                  <code className="text-red-400 break-all">{this.state.error.message}</code>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function TransactionErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="bg-gray-900 border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Transaction Error</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              There was an error processing your transaction. Please try again.
            </p>
            <Button 
              size="sm" 
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}