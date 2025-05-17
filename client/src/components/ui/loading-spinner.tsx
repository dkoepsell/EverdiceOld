import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]}`} aria-hidden="true" />
  );
};