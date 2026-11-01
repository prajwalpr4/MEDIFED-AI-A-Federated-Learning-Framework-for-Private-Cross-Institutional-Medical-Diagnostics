"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RESEARCH_HOSPITALS } from "@/lib/types";
import {
  Network,
  Cpu,
  ShieldCheck,
  Server,
  Layers,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

interface RoundCheckpoint {
  round: number;
  checkpoint: string;
  accuracy: number;
  f1: number;
  timestamp: string;
  strategy: string;
  regularization: string;
}

const CHECKPOINTS: RoundCheckpoint[] = [
  {
    round: 1,
    checkpoint: "global_round_01.pth",
    accuracy: 79.31,
    f1: 80.84,
    timestamp: "Round 1 Completed",
    strategy: "FedProx",
    regularization: "μ = 0.01",
  },
  {
    round: 2,
    checkpoint: "global_round_02.pth",
    accuracy: 80.51,
    f1: 82.06,
    timestamp: "Round 2 Completed",
    strategy: "FedProx",
    regularization: "μ = 0.01",
  },
  {
    round: 3,
    checkpoint: "global_round_03.pth",
    accuracy: 81.40,
    f1: 83.11,
    timestamp: "Round 3 Converged (Production Checkpoint)",
    strategy: "FedProx",
    regularization: "μ = 0.01",
  },
];

export default function AdminFederationPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                FEDPROX ORCHESTRATION
              </span>
              <span className="text-xs text-slate-500">Flower Framework 1.40 + PyTorch 2.14</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102A43] mt-1">
              Federation Topology & Checkpoint Timeline
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Decentralized model aggregation across 3 isolated hospital nodes with proximal regularization parameter &mu;=0.01.
            </p>
          </div>
        </div>

        {/* Network Topology Graphic */}
        <div className="bg-[#102A43] rounded-2xl border border-slate-800 p-8 text-white relative overflow-hidden shadow-xl">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
              Decentralized Federation Architecture
            </span>
            <h2 className="text-2xl font-black text-white">
              Star Topology with Zero-Leakage Parameter Sharing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Client 1 */}
            <div className="bg-[#16324F] p-4 rounded-xl border border-slate-700 space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-teal-900/60 text-teal-300 flex items-center justify-center font-bold text-xs">
                NODE 1
              </div>
              <div className="font-bold text-xs text-slate-200">
                Hospital A
              </div>
              <div className="text-[10px] text-slate-400">
                3,892 Train | 624 Test
              </div>
              <div className="text-[10px] text-teal-400 font-mono">
                Local ResNet-50
              </div>
            </div>

            {/* Coordinator Center */}
            <div className="md:col-span-2 bg-[#102A43] p-6 rounded-2xl border-2 border-slate-700 text-center space-y-3 shadow-lg">
              <div className="w-12 h-12 mx-auto rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Network className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Federation Coordinator Server
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  FedProx Proximal Aggregation &mu;=0.01 &bull; Model: ResNet-50
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2 text-[11px] font-mono text-teal-300">
                <span className="bg-black/40 px-2 py-0.5 rounded">
                  Round: 3 / 3
                </span>
                <span className="bg-black/40 px-2 py-0.5 rounded">
                  Status: CONVERGED
                </span>
              </div>
            </div>

            {/* Clients 2 & 3 in Column */}
            <div className="space-y-4">
              <div className="bg-[#16324F] p-3 rounded-xl border border-slate-700 text-center space-y-1">
                <div className="font-bold text-xs text-slate-200">
                  NODE 2: Hospital B
                </div>
                <div className="text-[10px] text-slate-400">332 Train | 110 Test</div>
              </div>
              <div className="bg-[#16324F] p-3 rounded-xl border border-slate-700 text-center space-y-1">
                <div className="font-bold text-xs text-slate-200">
                  NODE 3: Hospital C
                </div>
                <div className="text-[10px] text-slate-400">902 Train | 513 Test</div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Hyperparameters Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#102A43]">
            Federated Training Protocol Specifications
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">
                Aggregation Algorithm
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">FedProx</div>
              <div className="text-[10px] text-slate-500">&mu; = 0.01 proximal term</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">
                Local Client Epochs
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">E = 1 Epoch</div>
              <div className="text-[10px] text-slate-500">Prevents local overfitting</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">
                Optimizer & Learning Rate
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">AdamW (1e-4)</div>
              <div className="text-[10px] text-slate-500">Weight decay = 1e-4</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">
                Batch Size & Resizing
              </span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">Batch = 32</div>
              <div className="text-[10px] text-slate-500">224 x 224 grayscale</div>
            </div>
          </div>
        </div>

        {/* Checkpoint Timeline Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#102A43]">
              Global Model Checkpoint Registry
            </h2>
            <p className="text-xs text-slate-500">
              Stored weights under <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">models/checkpoints/federated/</code>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Checkpoint File</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Regularization</th>
                  <th className="py-3 px-4">Test Accuracy</th>
                  <th className="py-3 px-4">F1 Score</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CHECKPOINTS.map((cp) => (
                  <tr key={cp.round} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#102A43]">
                      Round {cp.round}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {cp.checkpoint}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{cp.strategy}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {cp.regularization}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {cp.accuracy}%
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0F766E]">
                      {cp.f1}%
                    </td>
                    <td className="py-3.5 px-4">
                      {cp.round === 3 ? (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Global Model
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-medium text-[10px] text-slate-500 bg-slate-100">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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
