"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, Role, Hospital, DEMO_PROFILES, RESEARCH_HOSPITALS } from "./types";
import casesStore from "./cases-store";

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  hospital: Hospital | null;
  switchProfile: (profileId: string) => void;
  signIn: (email: string, role?: Role, hospitalCode?: string) => void;
  signOut: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "medifed_active_profile_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start unauthenticated so only the Overview page is visible initially
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found = DEMO_PROFILES.find((p) => p.id === stored);
        if (found) {
          setUser(found);
        }
      }
    } catch {
      // localStorage unavailable or SSR
    }
    setIsReady(true);
  }, []);

  const switchProfile = (profileId: string) => {
    const target = DEMO_PROFILES.find((p) => p.id === profileId);
    if (target) {
      setUser(target);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, target.id);
      }
      casesStore.addLog({
        user_name: target.full_name,
        hospital_id: target.hospital_id || undefined,
        hospital_name: target.hospital?.name || "Global Federation Coordinator",
        action: "SIGN_IN",
        metadata: { role: target.role, profile_id: target.id },
      });
    }
  };

  const signIn = (email: string, targetRole: Role = "hospital_user", hospitalCode = "HOSPITAL_A") => {
    const existing = DEMO_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      switchProfile(existing.id);
      return;
    }

    const hosp = RESEARCH_HOSPITALS.find((h) => h.code === hospitalCode) || RESEARCH_HOSPITALS[0];
    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: email.split("@")[0].replace(/\./g, " ").toUpperCase(),
      role: targetRole,
      hospital_id: targetRole === "hospital_user" ? hosp.id : null,
      hospital: targetRole === "hospital_user" ? hosp : null,
    };

    setUser(newProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newProfile.id);
    }
  };

  const signOut = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const role: Role = user?.role || "hospital_user";
  const hospital: Hospital | null =
    user?.hospital ||
    RESEARCH_HOSPITALS.find((h) => h.id === user?.hospital_id) ||
    null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        hospital,
        switchProfile,
        signIn,
        signOut,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
