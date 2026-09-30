"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import GroundTrackMinimap from "./components/GroundTrackMinimap";
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  Radio,
  Zap,
  X,
  Satellite as SatelliteIcon,
  BatteryCharging,
  Gauge,
  Volume2,
  VolumeX,
  Sliders,
  ChevronUp,
  ArrowRight,
  Download,
  Layers,
  Database,
  Terminal,
  Menu,
  Network,
  Radar,
  Globe2,
  Sun,
} from "lucide-react";
import type { SatelliteData } from "./components/canvas/Scene";
import { soundFX } from "../audio";
import TelemetryChart, { DataPoint } from "./components/TelemetryChart";
import SpaceWeatherModal, { SpaceWeatherData } from "./components/SpaceWeatherModal";
import NodeDirectoryModal from "./components/NodeDirectoryModal";
import AerospaceModals from "./components/AerospaceModals";

const Scene = dynamic(() => import("./components/canvas/Scene"), {
  ssr: false,
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<"monitor" | "architecture">("monitor");
  const [activeModalTab, setActiveModalTab] = useState<"isl" | "radar" | "ground" | null>(null);
  const [showGroundTrack, setShowGroundTrack] = useState(false);
  const [showSpaceWeather, setShowSpaceWeather] = useState(false);
  const [spaceWeatherData, setSpaceWeatherData] = useState<SpaceWeatherData | null>(null);

  const [showDirectory, setShowDirectory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [threatId, setThreatId] = useState(17);
  const [countdown, setCountdown] = useState(10);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);

  const [liveThreatFeed, setLiveThreatFeed] = useState<any[]>([]);
  const [selectedThreatObj, setSelectedThreatObj] = useState<any>(null);

  const [isInMissionMode, setIsInMissionMode] = useState(false);
  const [isHudMinimized, setIsHudMinimized] = useState(false);

  const [soundOn, setSoundOn] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [showUplinks, setShowUplinks] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const [liveLatency, setLiveLatency] = useState(24.2);
  const [activePackets, setActivePackets] = useState(1420);
  const [utcTime, setUtcTime] = useState("");
  const [chartData, setChartData] = useState<DataPoint[]>([]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundFX.enabled = next;
    if (next) soundFX.playSelect();
  };

  useEffect(() => {
    const unlockAudio = () => {
      soundFX.playSelect();
      window.removeEventListener("pointerdown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, []);
// Fetch real-time NOAA SWPC Space Weather data
  useEffect(() => {
    fetch("/api/space-weather")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSpaceWeatherData(data);
        }
      })
      .catch((err) => console.error("Space weather API offline:", err));
  }, []);
  useEffect(() => {
    fetch("/api/space-threats")
      .then((res) => res.json())
      .then((data) => {
        if (data.threats && data.threats.length > 0) {
          setLiveThreatFeed(data.threats);
          setSelectedThreatObj(data.threats[0]);
          setThreatId(data.threats[0].assignedThreatNode);
        }
      })
      .catch((err) => console.error("Telemetry API offline:", err));
  }, []);

  const handleExportTelemetry = () => {
    soundFX.playSelect();
    const payload = {
      timestamp: new Date().toISOString(),
      orbit: { altitude: "550 km", constellation: "Walker Delta 48/4/1" },
      activeRoute: isAlertActive
        ? `KG-02 -> KG-11 -> KG-23 -> KG-36 (Detour avoiding KG-${threatId})`
        : "KG-02 -> KG-11 -> KG-17 -> KG-36 (Nominal)",
      conjunctionThreat: {
        active: isAlertActive,
        threatNodeId: isAlertActive ? threatId : null,
        targetObject: selectedThreatObj?.name || "KG-DEB-09",
        collisionProbability: isAlertActive ? "1.48e-03" : "< 1.0e-07",
      },
      liveMetrics: {
        latencyMs: liveLatency,
        packetsPerSec: activePackets,
        history: chartData,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kineticguard-telemetry-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === "Escape") {
        soundFX.playReset();
        setSelectedSatellite(null);
        setShowDirectory(false);
        setShowGroundTrack(false);
        setActiveModalTab(null);
        setMobileMenuOpen(false);
      } else if (e.code === "Space") {
        e.preventDefault();
        setSimSpeed((prev) => (prev === 0 ? 1 : 0));
      } else if (e.key.toLowerCase() === "c" && !isAlertActive) {
        setIsAlertActive(true);
        setCountdown(10);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAlertActive]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      setUtcTime(now.toUTCString().split(" ")[4] + " UTC");

      const jitter = (Math.random() - 0.5) * 0.8;
      const baseLatency = isAlertActive ? 38.4 : 24.2;
      const currentLatency = Number((baseLatency + jitter).toFixed(2));
      const currentPackets = activePackets + Math.floor(Math.random() * 21 - 10);

      setLiveLatency(currentLatency);
      setActivePackets(currentPackets);

      setChartData((prev) => {
        const next = [...prev, { time: timeStr, latency: currentLatency, packets: currentPackets }];
        if (next.length > 20) next.shift();
        return next;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [isAlertActive, activePackets]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAlertActive && countdown > 0) {
      soundFX.playAlarm();
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setIsAlertActive(false);
      setCountdown(10);
    }
    return () => clearTimeout(timer);
  }, [isAlertActive, countdown]);

  return (
    <main className="relative w-screen h-screen bg-black text-white overflow-hidden selection:bg-cyan-500 selection:text-black font-sans">
      <Scene
        alertMode={isAlertActive}
        threatId={threatId}
        selectedSatellite={selectedSatellite}
        onSelectSatellite={(sat) => {
          soundFX.playSelect();
          setSelectedSatellite(sat);
          if (!isInMissionMode) setIsInMissionMode(true);
        }}
        simSpeed={simSpeed}
        showUplinks={showUplinks}
      />

      {/* Top Navbar */}
      <header className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-30 pointer-events-none flex justify-between items-center border border-cyan-500/20 bg-slate-950/85 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-2xl">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Radio className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </div>
            <div>
              <h1 className="font-mono text-cyan-400 font-bold tracking-wider text-xs sm:text-sm">
                KINETICGUARD
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                AUTONOMOUS LEO MESH DIGITAL TWIN <span className="hidden xs:inline">• {utcTime || "UTC"}</span>
              </p>
            </div>
          </div>

          <nav className="pointer-events-auto hidden md:flex items-center gap-1 border-l border-slate-800 pl-6">
            <button
  onClick={() => {
    soundFX.playSelect();
    setShowSpaceWeather(true);
  }}
  className="pointer-events-auto px-2.5 py-1.5 rounded-lg font-mono text-xs text-slate-400 hover:text-amber-400 transition flex items-center gap-1.5 cursor-pointer"
>
  <Sun className="w-3.5 h-3.5 text-amber-400" />
  SPACE WX
</button>
          <button
  onClick={() => {
    soundFX.playSelect();
    setShowGroundTrack(true);
  }}
  className="px-2.5 py-1.5 rounded-lg font-mono text-xs text-slate-400 hover:text-cyan-300 transition flex items-center gap-1.5 cursor-pointer"
>
  <Globe2 className="w-3.5 h-3.5" />
  GROUND TRACK
</button>
            <button
              onClick={() => {
                soundFX.playSelect();
                setActiveTab("monitor");
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition flex items-center gap-2 cursor-pointer ${
                activeTab === "monitor"
                  ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              MISSION MONITOR
            </button>

            <button
              onClick={() => {
                soundFX.playSelect();
                setActiveModalTab("isl");
              }}
              className="px-2.5 py-1.5 rounded-lg font-mono text-xs text-slate-400 hover:text-cyan-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              ISL MATRIX
            </button>

            <button
              onClick={() => {
                soundFX.playSelect();
                setActiveModalTab("radar");
              }}
              className="px-2.5 py-1.5 rounded-lg font-mono text-xs text-slate-400 hover:text-red-400 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Radar className="w-3.5 h-3.5" />
              CONJUNCTION RADAR
            </button>

            <button
              onClick={() => {
                soundFX.playSelect();
                setActiveModalTab("ground");
              }}
              className="px-2.5 py-1.5 rounded-lg font-mono text-xs text-slate-400 hover:text-emerald-400 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              GROUND PASSES
            </button>

            <button
              onClick={() => {
                soundFX.playSelect();
                setActiveTab("architecture");
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition flex items-center gap-2 cursor-pointer ${
                activeTab === "architecture"
                  ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              ARCH
            </button>
            <button
              onClick={() => {
                soundFX.playSelect();
                setShowDirectory(true);
              }}
              className="px-3 py-1.5 rounded-lg font-mono text-xs text-slate-400 hover:text-white transition flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              NODES
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            onClick={toggleSound}
            className={`p-1.5 sm:p-2 rounded-lg border transition cursor-pointer ${
              soundOn ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-400" : "bg-slate-900 border-slate-700 text-slate-500"
            }`}
            title={soundOn ? "Mute" : "Unmute"}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-1.5 sm:p-2 rounded-lg border transition cursor-pointer ${
              showControls ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-400" : "bg-slate-900 border-slate-700 text-slate-300"
            }`}
            title="Simulation Controls"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportTelemetry}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 font-mono text-xs text-slate-300 transition cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>

          <span
            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border ${
              isAlertActive ? "bg-red-950/80 border-red-500/50 text-red-400" : "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
            }`}
          >
            <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isAlertActive ? "bg-red-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
            {isAlertActive ? "ALERT" : "NOMINAL"}
          </span>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed top-14 left-2 right-2 z-40 md:hidden bg-slate-950/95 border border-cyan-500/30 backdrop-blur-xl rounded-xl p-3 shadow-2xl flex flex-col gap-2 font-mono text-xs">
          <button
            onClick={() => {
              setShowSpaceWeather(true);
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 text-slate-300 flex items-center gap-2 cursor-pointer"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" /> SPACE WEATHER
          </button>
          <button
            onClick={() => {
              setActiveTab("monitor");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 text-cyan-300 flex items-center gap-2 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" /> MISSION MONITOR
          </button>
          <button
            onClick={() => {
              setActiveModalTab("isl");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 text-slate-300 flex items-center gap-2 cursor-pointer"
          >
            <Network className="w-3.5 h-3.5" /> ISL ROUTING MATRIX
          </button>
          <button
            onClick={() => {
              setActiveModalTab("radar");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 text-slate-300 flex items-center gap-2 cursor-pointer"
          >
            <Radar className="w-3.5 h-3.5" /> CONJUNCTION RADAR
          </button>
          <button
            onClick={() => {
              setActiveModalTab("ground");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 text-slate-300 flex items-center gap-2 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" /> GROUND PASSES
          </button>
          <button
            onClick={() => {
              setActiveTab("architecture");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 text-slate-300 flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" /> SYSTEM ARCHITECTURE
          </button>
          <button
            onClick={() => {
              setShowDirectory(true);
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg bg-slate-900 text-slate-300 flex items-center gap-2 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" /> NODE DIRECTORY
          </button>
        </div>
      )}{/* System Architecture View */}
      {activeTab === "architecture" && (
        <div className="fixed inset-0 z-20 pointer-events-auto pt-20 sm:pt-24 pb-12 px-4 sm:px-6 overflow-y-auto bg-slate-950/85 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="border border-cyan-500/30 bg-slate-900/60 p-4 sm:p-6 rounded-2xl">
              <h2 className="text-lg sm:text-xl font-mono font-bold text-cyan-400 mb-2">Autonomous LEO Mesh Routing Architecture</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                KineticGuard addresses conjunction avoidance in mega-constellations. When space debris enters the collision clearance envelope of an active node, the autonomous SSA system computes an avoidance maneuver and reroutes optical cross-links dynamically using Dijkstra shortest-path algorithms in under 100ms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
              <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl">
                <h3 className="text-cyan-400 font-bold mb-1">CONSTELLATION SHELL</h3>
                <p className="text-slate-400 text-[11px]">48 Nodes in Walker Delta Configuration</p>
                <p className="text-slate-500 text-[10px] mt-1">Altitude: 550 km • Inclination: 53.2°</p>
              </div>
              <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl">
                <h3 className="text-emerald-400 font-bold mb-1">DYNAMIC GRAPH ROUTING</h3>
                <p className="text-slate-400 text-[11px]">Fault-Tolerant Dijkstra ISL Mesh</p>
                <p className="text-slate-500 text-[10px] mt-1">Autonomous edge bypass on node severance</p>
              </div>
              <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl">
                <h3 className="text-purple-400 font-bold mb-1">GROUND TRACKING</h3>
                <p className="text-slate-400 text-[11px]">5 Synchronized DSN Ground Stations</p>
                <p className="text-slate-500 text-[10px] mt-1">Real-time elevation-angle line-of-sight tracking</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("monitor")}
              className="w-full sm:w-auto px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold rounded-lg transition cursor-pointer"
            >
              ← RETURN TO 3D SIMULATION
            </button>
          </div>
        </div>
      )}

      {/* Hero Overview */}
      {activeTab === "monitor" && !isInMissionMode && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-6 pt-16 sm:pt-24 pb-4 sm:pb-8">
          <div className="max-w-xl pointer-events-auto backdrop-blur-md bg-slate-950/70 p-4 sm:p-6 rounded-2xl border border-slate-800/80 shadow-2xl">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Aerospace Digital Twin
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
              KineticGuard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Real-time 3D simulation of a 48-node Low Earth Orbit optical laser mesh network with autonomous conjunction avoidance and dynamic Dijkstra traffic rerouting.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  soundFX.playSelect();
                  setIsInMissionMode(true);
                }}
                className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                ENTER MISSION CONTROL
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("architecture")}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs transition cursor-pointer"
              >
                SYSTEM SPECS
              </button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4 max-w-4xl pointer-events-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-slate-950/70 border border-slate-800 backdrop-blur-md p-2.5 sm:p-3 rounded-xl">
                <p className="text-[9px] font-mono text-slate-400">ORBITAL SHELL</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-cyan-400">550 KM (LEO)</p>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 backdrop-blur-md p-2.5 sm:p-3 rounded-xl">
                <p className="text-[9px] font-mono text-slate-400">CONSTELLATION</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-emerald-400">48 NODES</p>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 backdrop-blur-md p-2.5 sm:p-3 rounded-xl">
                <p className="text-[9px] font-mono text-slate-400">CROSS-LINKS</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-slate-200">OPTICAL ISL</p>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 backdrop-blur-md p-2.5 sm:p-3 rounded-xl">
                <p className="text-[9px] font-mono text-slate-400">SHORTCUTS</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-purple-400">[SPACE] [C]</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">KINETICGUARD v1.5</span>
              <div className="flex gap-3">
                <button onClick={() => setShowControls(true)} className="hover:text-cyan-400 cursor-pointer">SIM SETTINGS</button>
                <button onClick={() => setActiveTab("architecture")} className="hover:text-cyan-400 cursor-pointer">DOCS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Satellite Telemetry Subsystem Card */}
      {selectedSatellite && (
        <div className="fixed top-16 right-2 sm:right-4 left-2 sm:left-auto z-40 sm:w-80 bg-slate-950/95 border border-purple-500/40 backdrop-blur-md rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center gap-2 text-purple-400">
              <SatelliteIcon className="w-4 h-4" />
              <span className="font-mono font-bold text-xs sm:text-sm">{selectedSatellite.name}</span>
            </div>
            <button
              onClick={() => {
                soundFX.playReset();
                setSelectedSatellite(null);
              }}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5"><Gauge className="w-3 h-3 text-cyan-400" /> SPEED</span>
              <span className="text-cyan-300 font-bold">{selectedSatellite.velocity} km/s</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5"><BatteryCharging className="w-3 h-3 text-emerald-400" /> POWER</span>
              <span className="text-emerald-300 font-bold">{selectedSatellite.battery}%</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400">STATUS</span>
              <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${selectedSatellite.status === "THREAT_DETECTED" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"}`}>
                {selectedSatellite.status}
              </span>
            </div>
            {selectedSatellite.keplerian && (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-cyan-900/40 pt-3 text-[11px] font-mono">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">True Anomaly (ν)</span>
                  <span className="text-cyan-300 font-bold">{selectedSatellite.keplerian.trueAnomalyDeg}°</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">RAAN (Ω)</span>
                  <span className="text-cyan-300 font-bold">{selectedSatellite.keplerian.raanDeg}°</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Period (T)</span>
                  <span className="text-emerald-400 font-bold">{selectedSatellite.keplerian.orbitalPeriodMin}m</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Eccentricity (e)</span>
                  <span className="text-emerald-400 font-bold">{selectedSatellite.keplerian.eccentricity}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setThreatId(selectedSatellite.id);
                setIsAlertActive(true);
                setCountdown(10);
              }}
              disabled={isAlertActive}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              TARGET FOR CONJUNCTION
            </button>
          </div>
        </div>
      )}

      {/* Docked Telemetry Deck */}
      {activeTab === "monitor" && isInMissionMode && (
        <div
          className={`fixed inset-x-2 sm:inset-x-4 bottom-2 sm:bottom-4 z-20 pointer-events-none transition-transform duration-500 ease-out ${
            isHudMinimized ? "translate-y-[calc(100%+20px)]" : "translate-y-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 max-h-[46vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
            {/* Route Topology Card */}
            <div className="border border-slate-800 bg-slate-950/90 backdrop-blur-md p-3 sm:p-3.5 rounded-xl pointer-events-auto shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-cyan-400 mb-1 font-mono text-xs">
                  <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> ROUTE TOPOLOGY</span>
                  <span className="text-slate-400 text-[10px]">{activePackets} PKTS/S</span>
                </div>
                <div className="text-[11px] font-mono font-bold">
                  <span className="text-slate-400 text-[10px]">PATH: </span>
                  <span className={isAlertActive ? "text-amber-400" : "text-emerald-400"}>
                    {isAlertActive ? `Bypassing KG-${String(threatId).padStart(2, "0")}` : "KG-02 → KG-11 → KG-17 → KG-36"}
                  </span>
                </div>
              </div>

              <TelemetryChart data={chartData} alertMode={isAlertActive} />

              <p className="text-[9px] text-slate-400 font-mono mt-1">
                {isAlertActive ? "⚡ Latency elevated during route bypass." : "● Latency nominal on optical link."}
              </p>
            </div>

            {/* Mission Terminal */}
            <div className="border border-cyan-500/40 bg-slate-900/90 backdrop-blur-md p-3 sm:p-3.5 rounded-xl flex flex-col justify-between items-center text-center pointer-events-auto shadow-xl">
              <div>
                <p className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-0.5">
                  LIVE NASA SSA TARGETING
                </p>
                <h3 className="text-xs font-semibold text-slate-200">
                  {isAlertActive
                    ? `Intercepting Threat: ${selectedThreatObj?.name || "KG-DEBRIS"}`
                    : `Standby: Tracking ${liveThreatFeed.length} Orbital Hazards`}
                </h3>
                {selectedThreatObj && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Rel. Vel: {selectedThreatObj.relativeVelocityKps} • Target: Node KG-{String(threatId).padStart(2, "0")}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setIsAlertActive(true);
                  setCountdown(10);
                }}
                disabled={isAlertActive}
                className={`my-1.5 sm:my-2 w-full py-2 px-3 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isAlertActive
                    ? "bg-red-500/20 text-red-300 border border-red-500/50 cursor-not-allowed"
                    : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 cursor-pointer"
                }`}
              >
                {isAlertActive ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                    CONJUNCTION ({countdown}s)
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    SIMULATE CONJUNCTION
                  </>
                )}
              </button>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsInMissionMode(false)}
                  className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  ← Overview Hero
                </button>
                <button
                  onClick={() => setIsHudMinimized(true)}
                  className="text-[10px] font-mono text-cyan-400 hover:underline transition cursor-pointer"
                >
                  Minimize HUD
                </button>
              </div>
            </div>

            {/* Risk Gauge */}
            <div className="border border-slate-800 bg-slate-950/90 backdrop-blur-md p-3 sm:p-3.5 rounded-xl pointer-events-auto shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 mb-1 font-mono text-xs">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> RISK GAUGE</span>
                <span className="text-slate-400 text-[10px]">TCA: {isAlertActive ? `${countdown}s` : "NOMINAL"}</span>
              </div>

              <div className="flex items-center gap-3 my-auto py-1">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                      className={isAlertActive ? "text-red-500 transition-all duration-1000" : "text-emerald-400"}
                      strokeDasharray={`${isAlertActive ? ((10 - countdown) / 10) * 100 : 8}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className={`absolute font-mono text-[9px] font-bold ${isAlertActive ? "text-red-400" : "text-emerald-400"}`}>
                    {isAlertActive ? `${countdown}s` : "OK"}
                  </span>
                </div>

                <div>
                  <div className="text-sm sm:text-base font-mono font-bold">
                    <span className={isAlertActive ? "text-red-400" : "text-emerald-400"}>
                      {isAlertActive ? "Pc = 1.48e-03" : "Pc < 1.0e-07"}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">
                    {isAlertActive ? "COLLISION THRESHOLD EXCEEDED" : "CLEARANCE ENVELOPE INTACT"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Simulation Settings */}
      {showControls && (
        <div className="fixed top-16 left-2 sm:left-4 right-2 sm:right-auto z-40 sm:w-72 bg-slate-950/95 border border-cyan-500/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> SIMULATION CONTROLS
            </span>
            <button onClick={() => setShowControls(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 block mb-1">ORBIT SPEED ({simSpeed}x)</label>
              <div className="flex gap-2">
                {[0, 0.5, 1, 2.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSimSpeed(speed)}
                    className={`flex-1 py-1 rounded border transition cursor-pointer ${
                      simSpeed === speed ? "bg-cyan-500 text-black border-cyan-400 font-bold" : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    {speed === 0 ? "PAUSE" : `${speed}x`}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">GROUND UPLINK BEAMS</span>
                <input
                  type="checkbox"
                  checked={showUplinks}
                  onChange={(e) => setShowUplinks(e.target.checked)}
                  className="accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Restore Pill */}
      {isInMissionMode && isHudMinimized && (
        <button
          onClick={() => setIsHudMinimized(false)}
          className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-slate-950/90 border border-cyan-500/40 hover:border-cyan-400 rounded-full font-mono text-xs text-cyan-400 backdrop-blur-md shadow-2xl flex items-center gap-1.5 transition hover:scale-105 cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          EXPAND HUD
        </button>
      )}

      {/* 3 Dedicated Aerospace Tabs Modal Overlay */}
      <AerospaceModals
        activeTab={activeModalTab}
        onClose={() => setActiveModalTab(null)}
        isAlertActive={isAlertActive}
        threatId={threatId}
        liveThreats={liveThreatFeed}
        onTriggerThreat={(targetNode, name) => {
          setThreatId(targetNode);
          setSelectedThreatObj({ name, relativeVelocityKps: "12.84 km/s" });
          setIsAlertActive(true);
          setCountdown(10);
        }}
        liveLatency={liveLatency}
      />

      {/* Node Directory Modal */}
      <NodeDirectoryModal
        isOpen={showDirectory}
        onClose={() => setShowDirectory(false)}
        threatId={threatId}
        isAlertActive={isAlertActive}
        onSelectNode={(sat) => {
          soundFX.playSelect();
          setSelectedSatellite(sat);
          if (!isInMissionMode) setIsInMissionMode(true);
        }}
      />

      {/* Real-time 2D Orbital Ground Track Minimap */}
      <GroundTrackMinimap
        isOpen={showGroundTrack}
        onClose={() => setShowGroundTrack(false)}
        selectedSat={selectedSatellite}
        simSpeed={simSpeed}
      />
      {/* Live NOAA Space Weather Modal */}
      <SpaceWeatherModal
        isOpen={showSpaceWeather}
        onClose={() => setShowSpaceWeather(false)}
        data={spaceWeatherData}
      />
    </main>
  );
}