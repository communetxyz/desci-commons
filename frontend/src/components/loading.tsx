import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClass = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  }[size];

  return (
    <Loader2 className={`${sizeClass} animate-spin text-emerald-400`} />
  );
}

export function LoadingCard() {
  return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="h-6 bg-gray-700 rounded w-32"></div>
          <div className="h-5 bg-gray-700 rounded w-16"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-700 rounded w-16"></div>
          <div className="h-6 bg-gray-700 rounded w-20"></div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );
}

export function LoadingPaperCard() {
  return (
    <Card className="bg-gray-900 border-gray-800 animate-pulse">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gray-700 rounded w-24"></div>
          <Badge className="bg-gray-700">Loading</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-3 bg-gray-700 rounded w-full"></div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-700 rounded w-16"></div>
          <div className="h-5 bg-gray-700 rounded w-20"></div>
        </div>
        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
      </CardContent>
    </Card>
  );
}

export function LoadingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
        <div className="h-10 bg-gray-700 rounded w-24"></div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function LoadingButton({ children, isLoading, ...props }: { 
  children: React.ReactNode; 
  isLoading: boolean;
  [key: string]: any;
}) {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>{typeof children === "string" ? "Loading..." : children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

export function TransactionStatus({ 
  isPending, 
  isConfirming, 
  isSuccess, 
  isError,
  successMessage = "Transaction successful!",
  errorMessage = "Transaction failed. Please try again."
}: {
  isPending: boolean;
  isConfirming: boolean; 
  isSuccess: boolean;
  isError?: boolean;
  successMessage?: string;
  errorMessage?: string;
}) {
  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-yellow-400 text-sm">
        <LoadingSpinner size="sm" />
        <span>Confirm in wallet...</span>
      </div>
    );
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 text-blue-400 text-sm">
        <LoadingSpinner size="sm" />
        <span>Transaction confirming...</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-emerald-400 text-sm">
        ✅ {successMessage}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-400 text-sm">
        ❌ {errorMessage}
      </div>
    );
  }

  return null;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}