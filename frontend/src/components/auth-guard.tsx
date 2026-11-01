"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";
import { Lock } from "lucide-react";
import Link from "next/link";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  const router = useRouter();
  const { user, role, isReady } = useAuth();

  useEffect(() => {
    if (isReady && !user) {
      router.push("/auth/sign-in");
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#102A43]">Authentication Required</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            Please sign in to an authorized hospital node or administrator account to access this workspace.
          </p>
        </div>
        <Link
          href="/auth/sign-in"
          className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0d635c] text-white text-xs font-bold transition-all shadow-sm"
        >
          Sign In to Portal
        </Link>
      </div>
    );
  }

  if (requiredRole && role !== requiredRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#102A43]">Role Restriction</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            This workspace requires {requiredRole === "admin" ? "Administrator" : "Hospital Clinician"} access.
          </p>
        </div>
        <Link
          href="/auth/sign-in"
          className="px-5 py-2.5 rounded-xl bg-[#102A43] text-white text-xs font-bold"
        >
          Switch Account on Login Page
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
