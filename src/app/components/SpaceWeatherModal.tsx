"use client";

import React from "react";
import { Sun, Wind, Activity, X, ShieldAlert, CheckCircle, Flame } from "lucide-react";
import { soundFX } from "../../audio";

export interface SpaceWeatherData {
  kpIndex: number;
  stormLevel: string;
  thermosphericDragFactor: number;
  solarWindSpeedKps: number;
  protonDensityPcm3: number;
  radioBlackoutRisk: string;
  meshCrosslinkStability: string;
}

interface SpaceWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SpaceWeatherData | null;
}

export default function SpaceWeatherModal({
  isOpen,
  onClose,
  data,
}: SpaceWeatherModalProps) {
  if (!isOpen) return null;

  const isStormActive = (data?.kpIndex ?? 0) >= 5.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-mono">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Sun className={`w-5 h-5 ${isStormActive ? "text-red-400 animate-pulse" : "text-amber-400"}`} />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wider">
                NOAA SPACE WEATHER & THERMOSPHERIC DRAG MONITOR
              </h2>
              <p className="text-[10px] text-slate-400">
                Live Space Weather Prediction Center (SWPC) Solar Plasma & Geomagnetic Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playReset();
              onClose();
            }}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-300 overflow-y-auto max-h-[75vh]">
          
          {/* Main Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isStormActive 
              ? "bg-red-950/40 border-red-500/50 text-red-200"
              : "bg-slate-900/70 border-amber-500/30 text-amber-200"
          }`}>
            <div className="flex items-center gap-3">
              {isStormActive ? (
                <ShieldAlert className="w-8 h-8 text-red-400 animate-bounce" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              )}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  GEOMAGNETIC STORM LEVEL
                </span>
                <span className="text-lg font-bold text-white">
                  {data?.stormLevel || "G0 (Quiet Nominal)"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block">PLANETARY Kp INDEX</span>
              <span className={`text-2xl font-black ${isStormActive ? "text-red-400" : "text-cyan-400"}`}>
                {data?.kpIndex ?? "2.67"} / 9.0
              </span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> DRAG MULTIPLIER (550 KM)
              </span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {data?.thermosphericDragFactor ?? 1.04}x
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                Thermospheric density increase over solar quiet baseline
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-400" /> SOLAR WIND VELOCITY
              </span>
              <span className="text-base font-bold text-cyan-300 mt-0.5 block">
                {data?.solarWindSpeedKps ?? 425.8} km/s
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                DSCOVR / ACE satellite real-time solar plasma speed
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" /> PROTON DENSITY
              </span>
              <span className="text-base font-bold text-emerald-300 mt-0.5 block">
                {data?.protonDensityPcm3 ?? 4.8} p/cm³
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                Solar particle flux density at Earth L1 Lagrange point
              </p>
            </div>
          </div>

          {/* Real-world Constellation Impact Note */}
          <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Autonomous Mesh Routing Impact
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When solar activity expands the upper atmosphere, increased molecular drag introduces rotational torques on LEO reaction wheels and causes subtle atmospheric scintillation on optical crosslinks. KineticGuard factorizes the live $Kp$-index into its Dijkstra cost matrix:
            </p>
            <div className="p-2.5 rounded bg-black/60 border border-slate-800 text-[10px] text-cyan-300">
              <code>Cost(edge) = EuclideanDistance × [ 1 + 0.08 × max(0, Kp - 4) ]</code>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Source: NOAA SWPC Space Weather Operations</span>
          <button
            onClick={() => {
              soundFX.playSelect();
              onClose();
            }}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition cursor-pointer"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
}