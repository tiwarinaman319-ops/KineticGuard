"use client";

import React from "react";
import { X, Network, Radar, Radio, ShieldAlert, CheckCircle, Activity } from "lucide-react";
import { soundFX } from "../../audio";

interface AerospaceModalsProps {
  activeTab: "isl" | "radar" | "ground" | null;
  onClose: () => void;
  isAlertActive: boolean;
  threatId: number;
  liveThreats: any[];
  onTriggerThreat: (threatNodeId: number, threatName: string) => void;
  liveLatency: number;
}

export default function AerospaceModals({
  activeTab,
  onClose,
  isAlertActive,
  threatId,
  liveThreats,
  onTriggerThreat,
  liveLatency,
}: AerospaceModalsProps) {
  if (!activeTab) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            {activeTab === "isl" && <Network className="w-5 h-5 text-cyan-400" />}
            {activeTab === "radar" && <Radar className="w-5 h-5 text-red-400" />}
            {activeTab === "ground" && <Radio className="w-5 h-5 text-emerald-400" />}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wider">
                {activeTab === "isl" && "ISL ROUTING MATRIX // DIJKSTRA GRAPH ENGINE"}
                {activeTab === "radar" && "CONJUNCTION RADAR // NASA JPL DEBRIS TELEMETRY"}
                {activeTab === "ground" && "GROUND PASS PREDICTOR // DSN & ISRO ELEVATION TRACKING"}
              </h2>
              <p className="text-[10px] text-slate-400">
                {activeTab === "isl" && "Autonomous edge bypass computation & optical crosslink topology"}
                {activeTab === "radar" && "Real-time Close-Approach data synchronized with NASA SSD NeoWs"}
                {activeTab === "ground" && "Line-of-sight elevation angles and active link carrier frequencies"}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-300">
          
          {/* TAB 1: ISL ROUTING MATRIX */}
          {activeTab === "isl" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">SOURCE / SINK NODES</span>
                  <span className="text-sm font-bold text-cyan-400">KG-02 ➔ KG-36</span>
                  <p className="text-[10px] text-slate-400 mt-1">Trans-oceanic optical carrier backbone</p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">ALGORITHM COMPLEXITY</span>
                  <span className="text-sm font-bold text-emerald-400">O((V + E) log V)</span>
                  <p className="text-[10px] text-slate-400 mt-1">Dijkstra with binary min-heap priority queue</p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">LIVE GRAPH STATUS</span>
                  <span className={`text-sm font-bold ${isAlertActive ? "text-amber-400" : "text-emerald-400"}`}>
                    {isAlertActive ? "BYPASS ENGAGED (EDGE SEVERED)" : "OPTIMAL SHORTEST PATH"}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">End-to-end latency: {liveLatency} ms</p>
                </div>
              </div>

              {/* Hop Breakdown Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[9px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Hop Index</th>
                      <th className="p-3">Vector Step</th>
                      <th className="p-3">Distance (km)</th>
                      <th className="p-3">Hop Latency</th>
                      <th className="p-3">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/50">
                    {isAlertActive ? (
                      <>
                        <tr className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-cyan-400">Hop 01</td>
                          <td className="p-3">KG-02 ➔ KG-11</td>
                          <td className="p-3">1,420 km</td>
                          <td className="p-3">4.73 ms</td>
                          <td className="p-3 text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Nominal</td>
                        </tr>
                        <tr className="bg-amber-950/20 text-amber-300 font-semibold">
                          <td className="p-3">Hop 02 (Detour)</td>
                          <td className="p-3">KG-11 ➔ KG-23</td>
                          <td className="p-3">2,110 km</td>
                          <td className="p-3">7.03 ms</td>
                          <td className="p-3 text-amber-400 flex items-center gap-1"><Activity className="w-3 h-3 animate-spin" /> Bypassing Threat Node KG-{threatId}</td>
                        </tr>
                        <tr className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-cyan-400">Hop 03</td>
                          <td className="p-3">KG-23 ➔ KG-36</td>
                          <td className="p-3">1,680 km</td>
                          <td className="p-3">5.60 ms</td>
                          <td className="p-3 text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Nominal</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-cyan-400">Hop 01</td>
                          <td className="p-3">KG-02 ➔ KG-11</td>
                          <td className="p-3">1,420 km</td>
                          <td className="p-3">4.73 ms</td>
                          <td className="p-3 text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Nominal</td>
                        </tr>
                        <tr className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-cyan-400">Hop 02</td>
                          <td className="p-3">KG-11 ➔ KG-17</td>
                          <td className="p-3">1,390 km</td>
                          <td className="p-3">4.63 ms</td>
                          <td className="p-3 text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Nominal</td>
                        </tr>
                        <tr className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-cyan-400">Hop 03</td>
                          <td className="p-3">KG-17 ➔ KG-36</td>
                          <td className="p-3">1,450 km</td>
                          <td className="p-3">4.83 ms</td>
                          <td className="p-3 text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Nominal</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CONJUNCTION RADAR */}
          {activeTab === "radar" && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 block font-bold">SOURCE: NASA JPL SMALL-BODY DATABASE (NeoWs)</span>
                  <p className="text-[11px] text-slate-300">Live orbital hazards currently intersecting LEO constellation envelopes</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">LIVE REST SYNC</span>
                  <p className="text-[10px] text-slate-500">Auto-cached 1 hour</p>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[9px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Object Identifier</th>
                      <th className="p-3">Est. Diameter</th>
                      <th className="p-3">Relative Velocity</th>
                      <th className="p-3">Miss Distance</th>
                      <th className="p-3">Target Node</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/50">
                    {liveThreats && liveThreats.length > 0 ? (
                      liveThreats.map((threat, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-white flex items-center gap-1.5">
                            {threat.isPotentiallyHazardous && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
                            {threat.name}
                          </td>
                          <td className="p-3">{threat.diameterMeters} m</td>
                          <td className="p-3 text-cyan-300 font-bold">{threat.relativeVelocityKps}</td>
                          <td className="p-3 text-slate-300">{threat.missDistanceKm}</td>
                          <td className="p-3 text-purple-400 font-bold">KG-{String(threat.assignedThreatNode).padStart(2, "0")}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                onTriggerThreat(threat.assignedThreatNode, threat.name);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-[10px] font-bold rounded-md transition cursor-pointer"
                            >
                              Inject Conjunction
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          Connecting to NASA JPL telemetry pipeline...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: GROUND PASS PREDICTOR */}
          {activeTab === "ground" && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                <p className="text-[11px] text-slate-300">
                  Global Deep Space Network (DSN) & ISRO Telemetry Tracking and Command Network (ISTRAC) ground stations with synchronized elevation cones (&gt;10° minimum mask angle for LEO acquisition).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "ISTRAC Ground Complex", location: "Bengaluru, India (13.03° N, 77.56° E)", elev: "48.2° (LOS Locked)", freq: "8.45 GHz (X-band)", status: "ACTIVE UPLINK", color: "text-emerald-400" },
                  { name: "Goldstone Deep Space Comm", location: "California, USA (35.42° N, 116.89° W)", elev: "62.1° (LOS Locked)", freq: "32.05 GHz (Ka-band)", status: "ACTIVE UPLINK", color: "text-cyan-400" },
                  { name: "Madrid Deep Space Complex", location: "Robledo, Spain (40.43° N, 4.25° W)", elev: "18.4° (Acquiring)", freq: "8.41 GHz (X-band)", status: "ACQUIRING PASS", color: "text-amber-400" },
                  { name: "Canberra Deep Space Comm", location: "Tidbinbilla, AUS (-35.40° S, 148.98° E)", elev: "-12.5° (Below Horizon)", freq: "Standby", status: "AOS IN 22m", color: "text-slate-500" },
                  { name: "Svalbard Satellite Station", location: "Spitsbergen, NOR (78.23° N, 15.40° E)", elev: "74.8° (Zenith Pass)", freq: "26.2 GHz (Ka-band)", status: "HIGH ELEVATION", color: "text-purple-400" },
                ].map((station, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white text-[12px]">{station.name}</span>
                        <span className={`text-[10px] font-bold ${station.color}`}>{station.status}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{station.location}</span>
                    </div>
                    <div className="border-t border-slate-800/80 pt-2 mt-2 flex justify-between text-[10px]">
                      <span className="text-slate-400">Elevation: <strong className="text-slate-200">{station.elev}</strong></span>
                      <span className="text-slate-400">Carrier: <strong className="text-cyan-300">{station.freq}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>KineticGuard Enterprise SSA Subsystem v1.5</span>
          <button
            onClick={() => {
              soundFX.playSelect();
              onClose();
            }}
            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}