import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ApiErrorFallbackProps {
  error: Error | string;
  resetFn: () => void;
}

export const ApiErrorFallback = ({ error, resetFn }: ApiErrorFallbackProps) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle className="flex items-center">API Error</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="mb-2">{errorMessage}</div>
        <Button size="sm" variant="outline" onClick={resetFn} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
};
