"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DEMO_PROFILES } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Activity,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  LogIn,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, switchProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide an institutional email");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Supabase Auth if configured
      if (isSupabaseConfigured() && password) {
        try {
          const supabase = createClient();
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });
          if (authError) {
            console.warn("Supabase auth note:", authError.message);
          }
        } catch (err) {
          console.warn("Supabase auth exception:", err);
        }
      }

      // 2. Resolve matching profile and route
      const matchedProfile = DEMO_PROFILES.find(
        (p) => p.email.toLowerCase() === email.toLowerCase().trim()
      );
      if (matchedProfile) {
        switchProfile(matchedProfile.id);
        if (matchedProfile.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/hospital/dashboard");
        }
      } else {
        signIn(email, "hospital_user", "HOSPITAL_A");
        router.push("/hospital/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (p: (typeof DEMO_PROFILES)[0]) => {
    setEmail(p.email);
    setPassword(p.password || "");
    setError(null);
  };

  const handleInstantSignIn = async (p: (typeof DEMO_PROFILES)[0]) => {
    setEmail(p.email);
    setPassword(p.password || "");
    setLoading(true);
    setError(null);

    if (isSupabaseConfigured() && p.password) {
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: p.email,
          password: p.password,
        });
      } catch (e) {
        console.warn("Supabase auth notice:", e);
      }
    }

    switchProfile(p.id);
    if (p.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/hospital/dashboard");
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left Clinical Branding Panel - Clean White / Slate Aesthetic */}
      <div className="hidden lg:flex lg:col-span-5 bg-white border-r border-slate-200 text-slate-800 p-8 xl:p-10 flex-col justify-between h-full overflow-hidden relative">
        <div className="relative z-10 space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#102A43] flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#102A43]">
                MEDIFED<span className="text-blue-600">.AI</span>
              </span>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">
                Federated Medical Intelligence
              </p>
            </div>
          </Link>

          <div className="pt-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Decentralized Trust Architecture
            </span>
            <h2 className="text-2xl font-extrabold text-[#102A43] leading-snug">
              Secure, Private Cross-Institutional Diagnostics
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Access your clinical node with cryptographically isolated Supabase storage and dedicated tables. ResNet-50 predictions with layer4 Grad-CAM hooks execute without patient radiograph leakage.
            </p>
          </div>
        </div>

        <div className="relative z-10 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm text-xs text-slate-700 space-y-1.5">
          <p className="italic text-[11px] text-slate-600">
            &ldquo;Zero-leakage federated learning offers a mathematically rigorous foundation for cross-institutional diagnostic intelligence.&rdquo;
          </p>
          <div className="text-slate-900 font-bold text-[10px]">
            Consortium for Federated Healthcare Intelligence
          </div>
        </div>
      </div>

      {/* Right Login & Account Credentials Panel (Zero-Scroll Form) */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-6 sm:px-10 lg:px-12 h-full overflow-hidden bg-slate-50/50">
        <div className="max-w-md w-full mx-auto space-y-3.5">
          {/* Header */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#102A43]">
              Portal Authentication
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Select an authorized clinical account or supply institutional credentials.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* DEMO ACCOUNTS FOR TESTING (Matching Reference Design) */}
          <div className="space-y-1.5">
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                DEMO ACCOUNTS FOR TESTING
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_PROFILES.map((p) => {
                const isSelected = email === p.email;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleAccountSelect(p)}
                    className={`px-3 py-2 rounded-lg border transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-600 ring-1 ring-blue-600 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#102A43]">
                        {p.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {p.email} / {p.password}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInstantSignIn(p);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#102A43] hover:bg-[#16324F] text-white font-semibold text-[10px] transition-colors flex items-center gap-1 shrink-0"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Log In</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-medium">
              Or Sign In With Selected Account
            </span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleCustomLogin} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Institutional Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-[#102A43] hover:bg-[#16324F] text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="text-center pt-1">
            <Link
              href="/"
              className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
            >
              &larr; Back to Public Research Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
