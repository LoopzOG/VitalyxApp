import type { ReactNode } from "react";

type ProtectedRouteProps = {
  isAuthenticated: boolean;
  fallback: ReactNode;
  children: ReactNode;
};

export function ProtectedRoute({ isAuthenticated, fallback, children }: ProtectedRouteProps) {
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}
