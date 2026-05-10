import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Redirect to onboarding if not completed and not already there
  if (!user.onboardingCompleted && location !== "/onboarding" && location !== "/my-subjects") {
    navigate("/onboarding");
    return null;
  }

  // Prevent access to onboarding ONLY if already completed (but allow /my-subjects)
  if (user.onboardingCompleted && location === "/onboarding") {
    navigate("/files"); 
    return null;
  }

  return <>{children}</>;
}
