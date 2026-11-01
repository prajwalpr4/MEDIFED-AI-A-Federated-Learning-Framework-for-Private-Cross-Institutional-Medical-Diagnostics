"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import casesStore from "@/lib/cases-store";
import { AuditLog } from "@/lib/types";
import {
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Calendar,
  User,
  Activity,
  Code,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const all = casesStore.getLogs();
    setLogs(all);
  }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.user_name && l.user_name.toLowerCase().includes(q)) ||
      (l.hospital_name && l.hospital_name.toLowerCase().includes(q))
    );
  });

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                AUDIT COMPLIANCE
              </span>
              <span className="text-xs text-slate-500">Immutable Security Trail</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
              Platform Security & Audit Logs
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Append-only audit trail logging radiograph inference events, authentication sessions, and report exports.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, or hospital node..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} total events recorded
          </span>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Actor / Clinician</th>
                  <th className="py-3 px-4">Originating Silo</th>
                  <th className="py-3 px-4">Payload Metadata</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {log.user_name || "System Process"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {log.hospital_name || "Global Platform"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {JSON.stringify(log.metadata)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </AuthGuard>
  );
}
