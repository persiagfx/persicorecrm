"use client";

import { useAuth } from "@/lib/auth/context";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if current user has one of the allowed roles.
 * Usage: <RoleGuard roles={["admin", "accountant"]}>...</RoleGuard>
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
