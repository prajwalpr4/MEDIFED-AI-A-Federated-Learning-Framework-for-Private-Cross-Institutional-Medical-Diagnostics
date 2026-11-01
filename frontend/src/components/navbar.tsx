"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient, { HealthStatus } from "@/lib/api";
import {
  Activity,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  BarChart3,
  Network,
  ClipboardList,
  Lock,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, role, hospital, signOut } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiClient
      .getHealth()
      .then((h) => {
        if (mounted) setHealth(h);
      })
      .catch(() => {
        if (mounted) setHealth(null);
      });
    const interval = setInterval(() => {
      apiClient
        .getHealth()
        .then((h) => {
          if (mounted) setHealth(h);
        })
        .catch(() => {
          if (mounted) setHealth(null);
        });
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isHospital = user && role === "hospital_user";
  const isAdmin = user && role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#102A43] flex items-center justify-center text-teal-300 shadow-sm group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-[#102A43]">
                  MEDIFED<span className="text-[#0F766E]">.AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  FL v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Federated Medical Intelligence
              </p>
            </div>
          </Link>

          {/* Center Navigation Links — Only visible when user is logged in */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  pathname === "/"
                    ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                    : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                }`}
              >
                Overview
              </Link>

              {/* Hospital User Links (Active only after login) */}
              {isHospital && (
                <>
                  <Link
                    href="/hospital/dashboard"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === "/hospital/dashboard"
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/hospital/analyze"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === "/hospital/analyze"
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    Analyze X-Ray
                  </Link>
                  <Link
                    href="/hospital/cases"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith("/hospital/cases")
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Case Registry
                  </Link>
                </>
              )}

              {/* Admin Links (Active only after login) */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === "/admin/dashboard"
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Command Center
                  </Link>
                  <Link
                    href="/admin/performance"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === "/admin/performance"
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Performance
                  </Link>
                  <Link
                    href="/admin/federation"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === "/admin/federation"
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    Federation Hub
                  </Link>
                  <Link
                    href="/admin/cases"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === "/admin/cases"
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    All Cases
                  </Link>
                  <Link
                    href="/admin/audit-logs"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      pathname === "/admin/audit-logs"
                        ? "text-[#102A43] bg-slate-100 font-bold border border-slate-200"
                        : "text-slate-600 hover:text-[#102A43] hover:bg-slate-50"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Audit Logs
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Status & Auth Controls */}
          <div className="flex items-center gap-3">

            {/* User Dropdown when Logged In, otherwise Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#102A43] text-teal-300 flex items-center justify-center font-bold text-xs">
                    {isAdmin ? "A" : hospital?.code === "HOSPITAL_A" ? "A" : hospital?.code === "HOSPITAL_B" ? "B" : "C"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {user.full_name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {isAdmin ? "System Admin" : hospital?.code}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] text-slate-500">Authenticated Role</p>
                      <p className="text-sm font-bold text-slate-900">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-teal-700 font-mono">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {isHospital && (
                        <>
                          <Link
                            href="/hospital/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                            Hospital Dashboard
                          </Link>
                          <Link
                            href="/hospital/analyze"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            Analyze Chest X-Ray
                          </Link>
                          <Link
                            href="/hospital/cases"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                            Isolated Case Registry
                          </Link>
                        </>
                      )}

                      {isAdmin && (
                        <>
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                            Command Center
                          </Link>
                          <Link
                            href="/admin/performance"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            Empirical Benchmarks
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/sign-in"
                className="px-4 py-2 rounded-xl bg-[#102A43] hover:bg-[#16324F] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-teal-300" />
                <span>Sign In to Portal</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
