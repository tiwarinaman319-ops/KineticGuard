"use client";

import { useState } from "react";
import { Search, X, Satellite as SatelliteIcon } from "lucide-react";
import type { SatelliteData } from "./canvas/Scene";

export default function NodeDirectoryModal({
  isOpen,
  onClose,
  onSelectNode,
  threatId,
  isAlertActive,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (data: SatelliteData) => void;
  threatId: number;
  isAlertActive: boolean;
}) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const nodes: SatelliteData[] = Array.from({ length: 48 }, (_, idx) => {
    const isThreat = isAlertActive && idx === threatId;
    const totalPlanes = 3;
    const satsPerPlane = 8;
    const plane = Math.floor(idx / satsPerPlane);
    const satInPlane = idx % satsPerPlane;
    const inclination = 53.2 * (Math.PI / 180);
    const raan = (plane * (2 * Math.PI)) / totalPlanes;
    const trueAnomaly = (satInPlane * (2 * Math.PI)) / satsPerPlane + (plane * 0.35);
    const r = 3.35;

    const x = r * (Math.cos(raan) * Math.cos(trueAnomaly) - Math.sin(raan) * Math.sin(trueAnomaly) * Math.cos(inclination));
    const y = r * (Math.sin(trueAnomaly) * Math.sin(inclination));
    const z = r * (Math.sin(raan) * Math.cos(trueAnomaly) + Math.cos(raan) * Math.sin(trueAnomaly) * Math.cos(inclination));

    return {
      id: idx,
      name: `KG-${String(idx + 1).padStart(2, "0")}`,
      altitude: 550,
      velocity: 7.61,
      inclination: 53.2,
      battery: 94 - (idx % 8),
      status: isThreat ? "THREAT_DETECTED" : isAlertActive ? "REROUTING" : "NOMINAL",
      coords: [x, y, z] as [number, number, number],
    };
  });

  const filtered = nodes.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase()) || n.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <SatelliteIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-cyan-400">CONSTELLATION DIRECTORY (48 NODES)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by satellite ID or status (e.g. '04', 'NOMINAL')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Scrollable Node Table */}
        <div className="overflow-y-auto flex-1 pr-1 font-mono text-xs">
          <table className="w-full text-left">
            <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800 sticky top-0 bg-slate-950">
              <tr>
                <th className="py-2 px-2">ID</th>
                <th className="py-2 px-2">ORBIT</th>
                <th className="py-2 px-2">BATTERY</th>
                <th className="py-2 px-2">STATUS</th>
                <th className="py-2 px-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((sat) => (
                <tr key={sat.id} className="hover:bg-slate-900/60 transition group">
                  <td className="py-2 px-2 text-cyan-300 font-bold">{sat.name}</td>
                  <td className="py-2 px-2 text-slate-400">550 km</td>
                  <td className="py-2 px-2 text-slate-300">{sat.battery}%</td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        sat.status === "THREAT_DETECTED"
                          ? "bg-red-950 text-red-400 border border-red-500/40"
                          : sat.status === "REROUTING"
                          ? "bg-amber-950 text-amber-400 border border-amber-500/40"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                      }`}
                    >
                      {sat.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => {
                        onSelectNode(sat);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 text-[10px] font-bold transition cursor-pointer"
                    >
                      FOCUS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}