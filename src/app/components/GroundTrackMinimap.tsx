"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { SatelliteData } from "./canvas/Scene";
import { soundFX } from "../../audio";

interface GroundTrackMinimapProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSat: SatelliteData | null;
  simSpeed: number;
}

export default function GroundTrackMinimap({
  isOpen,
  onClose,
  selectedSat,
  simSpeed,
}: GroundTrackMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.015 * (simSpeed === 0 ? 0 : simSpeed);
      const width = canvas.width;
      const height = canvas.height;

      // Dark radar background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // 1. Lat/Lon Coordinate Grid
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 0.5;

      for (let lon = 0; lon <= width; lon += width / 12) {
        ctx.beginPath();
        ctx.moveTo(lon, 0);
        ctx.lineTo(lon, height);
        ctx.stroke();
      }
      for (let lat = 0; lat <= height; lat += height / 6) {
        ctx.beginPath();
        ctx.moveTo(0, lat);
        ctx.lineTo(width, lat);
        ctx.stroke();
      }

      // Equator & Prime Meridian
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // 2. Vector World Landmass Outlines (Mercator)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(14, 116, 144, 0.1)";

      // North America
      ctx.beginPath();
      ctx.moveTo(width * 0.12, height * 0.2);
      ctx.lineTo(width * 0.28, height * 0.18);
      ctx.lineTo(width * 0.25, height * 0.38);
      ctx.lineTo(width * 0.2, height * 0.45);
      ctx.lineTo(width * 0.14, height * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // South America
      ctx.beginPath();
      ctx.moveTo(width * 0.25, height * 0.52);
      ctx.lineTo(width * 0.35, height * 0.58);
      ctx.lineTo(width * 0.3, height * 0.85);
      ctx.lineTo(width * 0.22, height * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eurasia & Africa
      ctx.beginPath();
      ctx.moveTo(width * 0.46, height * 0.2);
      ctx.lineTo(width * 0.82, height * 0.22);
      ctx.lineTo(width * 0.78, height * 0.45);
      ctx.lineTo(width * 0.58, height * 0.48); // India
      ctx.lineTo(width * 0.48, height * 0.4);
      ctx.lineTo(width * 0.54, height * 0.75); // Africa south
      ctx.lineTo(width * 0.42, height * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Australia
      ctx.beginPath();
      ctx.moveTo(width * 0.8, height * 0.65);
      ctx.lineTo(width * 0.9, height * 0.66);
      ctx.lineTo(width * 0.87, height * 0.82);
      ctx.lineTo(width * 0.78, height * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Ground Stations
      const stations = [
        { name: "ISTRAC (Bengaluru)", x: width * 0.65, y: height * 0.45 },
        { name: "GDSCC (Goldstone)", x: width * 0.18, y: height * 0.35 },
        { name: "MDSCC (Madrid)", x: width * 0.47, y: height * 0.33 },
        { name: "CDSCC (Canberra)", x: width * 0.84, y: height * 0.72 },
      ];

      stations.forEach((st) => {
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(st.x, st.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.beginPath();
        ctx.arc(st.x, st.y, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "8px monospace";
        ctx.fillText(st.name, st.x + 5, st.y - 3);
      });

      // 4. Sub-Satellite Nadir Point & Sinusoidal Ground Track Wave
      const satOffset = selectedSat ? selectedSat.id * 0.35 : 0;
      const inclinationAmp = height * 0.32; // ~53° inclination amplitude
      const orbitPeriod = 2.5;

      // Draw Orbit Wave
      ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let x = 0; x <= width; x += 3) {
        const angle = ((x / width) * Math.PI * 2 * orbitPeriod) + t + satOffset;
        const y = height / 2 + Math.sin(angle) * inclinationAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Satellite Coordinate
      const satAngle = (t * 1.2) + satOffset;
      const currentX = ((satAngle / (Math.PI * 2)) % 1) * width;
      const currentY = height / 2 + Math.sin(satAngle * orbitPeriod) * inclinationAmp;

      // Dynamic Circular Footprint (Coverage Area)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
      ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(currentX, currentY, width * 0.08, height * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Satellite Dot and Radar Ping
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(currentX, currentY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 6 + (Math.sin(t * 8) + 1) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Satellite Indicator Tag
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 10px monospace";
      ctx.fillText(
        selectedSat ? selectedSat.name : "KG-LEO-01",
        Math.min(currentX + 9, width - 75),
        currentY - 8
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, selectedSat, simSpeed]);

  if (!isOpen) return null;

  return (
    <div className="fixed z-30 bottom-3 right-3 w-[150px] h-[95px] sm:w-[220px] sm:h-[130px] md:w-[320px] md:h-[180px] bg-black/85 backdrop-blur-md border border-cyan-500/40 rounded-lg p-1.5 shadow-2xl pointer-events-auto">
      <canvas
        ref={canvasRef}
        width={760}
        height={360}
        aria-label={`Ground track for ${selectedSat?.name ?? "KG-LEO-01"}`}
        className="block w-full h-full rounded-sm"
      />
      <button
        type="button"
        onClick={() => {
          soundFX.playReset();
          onClose();
        }}
        aria-label="Close ground track minimap"
        title="Close ground track minimap"
        className="absolute right-2 top-2 rounded bg-slate-950/80 p-1 text-slate-300 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      </div>
  );
}