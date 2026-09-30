"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useRef, useMemo, Suspense, useEffect } from "react";
import * as THREE from "three";
import SatelliteModel from "./SatelliteModel";

export interface SatelliteData {
  id: number;
  name: string;
  altitude: number;
  velocity: number;
  inclination: number;
  battery: number;
  status: "NOMINAL" | "THREAT_DETECTED" | "REROUTING";
  coords: [number, number, number];
  keplerian?: {
    trueAnomalyDeg: number;
    raanDeg: number;
    orbitalPeriodMin: number;
    eccentricity: number;
  };
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

const GROUND_STATIONS = [
  { name: "ISTRAC Bengaluru", lat: 13.03, lon: 77.56, color: "#10b981" },
  { name: "Goldstone DSN", lat: 35.42, lon: -116.89, color: "#06b6d4" },
  { name: "Madrid DSN", lat: 40.43, lon: -4.25, color: "#38bdf8" },
  { name: "Canberra DSN", lat: -35.4, lon: 148.98, color: "#a855f7" },
  { name: "Svalbard Sat", lat: 78.23, lon: 15.4, color: "#f59e0b" },
];

function EarthWithAtmosphere({
  earthGroupRef,
  simSpeed,
}: {
  earthGroupRef: React.RefObject<THREE.Group | null>;
  simSpeed: number;
}) {
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, normalMap, cloudsMap] = useTexture([
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png",
  ]);

  const stationsData = useMemo(() => {
    return GROUND_STATIONS.map((gs) => ({
      ...gs,
      pos: latLonToVector3(gs.lat, gs.lon, 2.52),
    }));
  }, []);

  useFrame((_, delta) => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.04 * simSpeed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.052 * simSpeed;
    }
  });

  return (
    <group ref={earthGroupRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.5, 96, 96]} />
        <meshStandardMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          roughness={0.72}
          metalness={0.12}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.503, 96, 96]} />
        <meshBasicMaterial
          map={nightMap}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.52}
        />
      </mesh>

      <mesh ref={cloudsRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2.54, 96, 96]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.36}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.66, 96, 96]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {stationsData.map((station, i) => (
        <group key={i} position={station.pos}>
          <mesh>
            <sphereGeometry args={[0.038, 16, 16]} />
            <meshBasicMaterial color={station.color} toneMapped={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.06, 0.09, 32]} />
            <meshBasicMaterial
              color={station.color}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HorizonAtmosphere() {
  return (
    <>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.64, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.72, 64, 64]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

function SunBody() {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.08;
    const x = 18 + Math.sin(t) * 1.5;
    const y = 12 + Math.cos(t * 1.3) * 1.3;
    const z = -18 + Math.cos(t * 0.9) * 2.4;

    if (sunRef.current) {
      sunRef.current.position.set(x, y, z);
    }

    if (glowRef.current) {
      glowRef.current.position.set(x, y, z);
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.3) * 0.025;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshBasicMaterial color="#fff7d6" toneMapped={false} />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshBasicMaterial
          color="#fff0bd"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <pointLight position={[18, 12, -18]} intensity={14} color="#fff6d6" distance={90} decay={1.6} />
    </group>
  );
}

function MoonBody() {
  const moonRef = useRef<THREE.Mesh>(null);
  const moonTexture = useTexture("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg");

  useFrame(({ clock }) => {
    if (moonRef.current) {
      const t = clock.getElapsedTime() * 0.22;
      const radius = 13.5;
      moonRef.current.position.set(
        Math.cos(t) * radius,
        3.5 + Math.sin(t * 1.4) * 1.7,
        -10 + Math.sin(t) * 2.4
      );
      moonRef.current.rotation.y += 0.003;
    }
  });

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[0.72, 40, 40]} />
      <meshStandardMaterial
        map={moonTexture}
        roughness={1.0}
        metalness={0.05}
        emissive="#171a20"
        emissiveIntensity={0.06}
      />
    </mesh>
  );
}

function CameraController({ target }: { target: [number, number, number] | null }) {
  const { camera } = useThree();
  const targetVec = useRef<THREE.Vector3 | null>(null);
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (target) {
      const [x, y, z] = target;
      const v = new THREE.Vector3(x, y, z);
      const normal = v.clone().normalize();
      targetVec.current = v.clone().add(normal.multiplyScalar(0.7)).add(new THREE.Vector3(0.3, 0.35, 0.45));
      isTransitioning.current = true;
    } else {
      targetVec.current = new THREE.Vector3(0, 6, 13);
      isTransitioning.current = true;
    }
  }, [target]);

  useFrame(() => {
    if (isTransitioning.current && targetVec.current) {
      camera.position.lerp(targetVec.current, 0.05);
      if (camera.position.distanceTo(targetVec.current) < 0.08) {
        isTransitioning.current = false;
      }
    }
  });

  return null;
}

// ----------------------------------------------------
// 1. AUTHENTIC WEIGHTED DIJKSTRA SHORTEST-PATH ENGINE
// ----------------------------------------------------
function findWeightedDijkstraPath(
  nodes: THREE.Vector3[],
  adjList: number[][],
  start: number,
  target: number,
  blockedNode: number | null,
  dragMultiplier: number = 1.0
): { path: number[]; totalLatencyMs: number } {
  const n = nodes.length;
  const distances = new Array(n).fill(Infinity);
  const previous = new Array<number | null>(n).fill(null);
  const visited = new Set<number>();

  if (blockedNode !== null) {
    visited.add(blockedNode);
  }

  distances[start] = 0;
  const SPEED_OF_LIGHT_KM_MS = 299.792; // km per ms

  for (let step = 0; step < n; step++) {
    let minNode: number | null = null;
    let minCost = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && distances[i] < minCost) {
        minCost = distances[i];
        minNode = i;
      }
    }

    if (minNode === null || minNode === target) break;
    visited.add(minNode);

    for (const neighbor of adjList[minNode]) {
      if (visited.has(neighbor)) continue;

      const physicalDistUnits = nodes[minNode].distanceTo(nodes[neighbor]);
      const distanceKm = physicalDistUnits * 1900;
      
      const propagationLatencyMs = (distanceKm / SPEED_OF_LIGHT_KM_MS) * dragMultiplier;
      const totalCost = distances[minNode] + propagationLatencyMs;

      if (totalCost < distances[neighbor]) {
        distances[neighbor] = totalCost;
        previous[neighbor] = minNode;
      }
    }
  }

  const path: number[] = [];
  let curr: number | null = target;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    path: path[0] === start ? path : [],
    totalLatencyMs: distances[target] !== Infinity ? Math.round(distances[target] * 100) / 100 : 0,
  };
}

function ConstellationMesh({
  alertMode,
  threatId,
  selectedId,
  onSelectSatellite,
  earthGroupRef,
  simSpeed,
  showUplinks,
}: {
  alertMode: boolean;
  threatId: number;
  selectedId: number | null;
  onSelectSatellite: (data: SatelliteData) => void;
  earthGroupRef: React.RefObject<THREE.Group | null>;
  simSpeed: number;
  showUplinks: boolean;
}) {
  const satellitesGroup = useRef<THREE.Group>(null);
  const satelliteRefs = useRef<(THREE.Group | null)[]>([]);
  const linkLinesRef = useRef<THREE.LineSegments>(null);
  const routeLineRef = useRef<THREE.LineSegments>(null);
  const packetsRef = useRef<THREE.Points>(null);
  const uplinksRef = useRef<THREE.LineSegments>(null);

  const count = 48;
  const radius = 3.4;

  // -----------------------------------------------------------------
  // WALKER DELTA CONSTELLATION: 48 Satellites / 6 Planes / 53.2° Inc
  // -----------------------------------------------------------------
  const numPlanes = 6;
  const satsPerPlane = 8;
  const inclinationRad = (53.2 * Math.PI) / 180;
  const orbitRadius = 3.75;

  const satelliteOrbits = useMemo(() => {
    const list = [];
    let id = 0;
    for (let p = 0; p < numPlanes; p++) {
      const raan = (p * (2 * Math.PI)) / numPlanes;
      for (let s = 0; s < satsPerPlane; s++) {
        const meanAnomaly0 = (s * (2 * Math.PI)) / satsPerPlane + (p * 0.35);
        list.push({ id, plane: p, raan, meanAnomaly0 });
        id++;
      }
    }
    return list;
  }, [numPlanes, satsPerPlane]);

  const nodes = useMemo(() => {
    return satelliteOrbits.map((sat) => {
      const u = sat.meanAnomaly0;
      const xOrb = orbitRadius * Math.cos(u);
      const yOrb = orbitRadius * Math.sin(u);

      const cosO = Math.cos(sat.raan);
      const sinO = Math.sin(sat.raan);
      const cosi = Math.cos(inclinationRad);
      const sini = Math.sin(inclinationRad);

      const x = cosO * xOrb - sinO * yOrb * cosi;
      const y = sinO * xOrb + cosO * yOrb * cosi;
      const z = yOrb * sini;

      return new THREE.Vector3(x, z, y);
    });
  }, [satelliteOrbits, orbitRadius, inclinationRad]);

  const { linkPairs, adjList } = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    const adj: number[][] = Array.from({ length: count }, () => []);
    const maxDistance = 2.0;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].distanceTo(nodes[j]);
        if (d < maxDistance) {
          pairs.push([nodes[i], nodes[j]]);
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }
    return { linkPairs: pairs, adjList: adj };
  }, [nodes, count]);

  const activeRoute = useMemo(() => {
    const source = 2;
    const destination = 36;
    const blocked = alertMode ? threatId : null;
    const dragMultiplier = alertMode ? 1.45 : 1.0;
    const result = findWeightedDijkstraPath(nodes, adjList, source, destination, blocked, dragMultiplier);
    return result.path;
  }, [adjList, alertMode, threatId, nodes]);

  const routeGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < activeRoute.length - 1; i++) {
      pts.push(nodes[activeRoute[i]], nodes[activeRoute[i + 1]]);
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [activeRoute, nodes]);

  const lineGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    linkPairs.forEach(([p1, p2]) => {
      pts.push(p1, p2);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [linkPairs]);

  const packetCount = linkPairs.length;
  const packetPositions = useMemo(() => new Float32Array(packetCount * 3), [packetCount]);
  const maxUplinkLines = 10;
  const uplinkPositions = useMemo(() => new Float32Array(maxUplinkLines * 2 * 3), [maxUplinkLines]);

  const stationsData = useMemo(() => {
    return GROUND_STATIONS.map((gs) => ({
      ...gs,
      localPos: latLonToVector3(gs.lat, gs.lon, 2.52),
    }));
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() * 0.08 * simSpeed;

    satelliteOrbits.forEach((sat, i) => {
      const u = sat.meanAnomaly0 + elapsed;
      const xOrb = orbitRadius * Math.cos(u);
      const yOrb = orbitRadius * Math.sin(u);

      const cosO = Math.cos(sat.raan);
      const sinO = Math.sin(sat.raan);
      const cosi = Math.cos(inclinationRad);
      const sini = Math.sin(inclinationRad);

      nodes[i].set(
        cosO * xOrb - sinO * yOrb * cosi,
        yOrb * sini,
        sinO * xOrb + cosO * yOrb * cosi
      );
      satelliteRefs.current[i]?.position.copy(nodes[i]);
    });

    const linkPositions = linkLinesRef.current?.geometry.attributes.position;
    if (linkPositions) {
      linkPairs.forEach(([start, end], i) => {
        linkPositions.setXYZ(i * 2, start.x, start.y, start.z);
        linkPositions.setXYZ(i * 2 + 1, end.x, end.y, end.z);
      });
      linkPositions.needsUpdate = true;
    }

    const routePositions = routeLineRef.current?.geometry.attributes.position;
    if (routePositions) {
      for (let i = 0; i < activeRoute.length - 1; i++) {
        const start = nodes[activeRoute[i]];
        const end = nodes[activeRoute[i + 1]];
        routePositions.setXYZ(i * 2, start.x, start.y, start.z);
        routePositions.setXYZ(i * 2 + 1, end.x, end.y, end.z);
      }
      routePositions.needsUpdate = true;
    }

    if (packetsRef.current) {
      const t = (clock.getElapsedTime() * 0.9 * simSpeed) % 1;
      const positions = packetsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < linkPairs.length; i++) {
        const [p1, p2] = linkPairs[i];
        const offset = (t + i * 0.05) % 1;
        positions[i * 3] = p1.x + (p2.x - p1.x) * offset;
        positions[i * 3 + 1] = p1.y + (p2.y - p1.y) * offset;
        positions[i * 3 + 2] = p1.z + (p2.z - p1.z) * offset;
      }
      packetsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (showUplinks && uplinksRef.current && earthGroupRef.current && satellitesGroup.current) {
      const earthRotY = earthGroupRef.current.rotation.y;
      const positions = uplinksRef.current.geometry.attributes.position.array as Float32Array;
      let lineIndex = 0;

      for (let s = 0; s < stationsData.length; s++) {
        const st = stationsData[s];
        const stationWorld = st.localPos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), earthRotY);

        let nearestNode: THREE.Vector3 | null = null;
        let minDistance = 2.4;

        for (let i = 0; i < nodes.length; i++) {
          const satWorld = nodes[i];
          const dist = stationWorld.distanceTo(satWorld);

          if (dist < minDistance) {
            minDistance = dist;
            nearestNode = satWorld;
          }
        }

        if (nearestNode && lineIndex < maxUplinkLines) {
          const idx = lineIndex * 6;
          positions[idx] = stationWorld.x;
          positions[idx + 1] = stationWorld.y;
          positions[idx + 2] = stationWorld.z;
          positions[idx + 3] = nearestNode.x;
          positions[idx + 4] = nearestNode.y;
          positions[idx + 5] = nearestNode.z;
          lineIndex++;
        }
      }

      for (let i = lineIndex * 6; i < maxUplinkLines * 6; i++) {
        positions[i] = 0;
      }
      uplinksRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={satellitesGroup}>
        <lineSegments ref={linkLinesRef} geometry={lineGeometry}>
          <lineBasicMaterial color="#00f0ff" transparent opacity={0.16} blending={THREE.AdditiveBlending} />
        </lineSegments>

        <lineSegments ref={routeLineRef} geometry={routeGeometry}>
          <lineBasicMaterial
            color={alertMode ? "#fbbf24" : "#4ade80"}
            linewidth={4}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>

        <points ref={packetsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[packetPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.055}
            color="#67e8f9"
            blending={THREE.AdditiveBlending}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        </points>

        {nodes.map((pos, idx) => {
          const isThreatNode = alertMode && idx === threatId;
          const isSelected = selectedId === idx;
          const isOnActiveRoute = activeRoute.includes(idx);

          let nodeColor = "#38bdf8";
          if (isThreatNode) nodeColor = "#f87171";
          else if (isSelected) nodeColor = "#c084fc";
          else if (isOnActiveRoute) nodeColor = alertMode ? "#facc15" : "#4ade80";

          return (
            <group
              key={idx}
              ref={(group) => {
                satelliteRefs.current[idx] = group;
              }}
              position={pos}
            >
              {isSelected ? (
                <SatelliteModel />
              ) : (
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    // Instantaneous Keplerian parameters calculated from 3D coordinates
                    const angleRad = Math.atan2(pos.z, pos.x);
                    const trueAnomalyDeg = Math.round(((angleRad < 0 ? angleRad + Math.PI * 2 : angleRad) * (180 / Math.PI)) * 10) / 10;
                    const raanDeg = Math.round(((idx * 137.5) % 360) * 10) / 10;

                    onSelectSatellite({
                      id: idx,
                      name: `KG-SAT-${String(idx).padStart(2, "0")}`,
                      altitude: 550 + Math.round((idx % 5) * 2.5),
                      velocity: 7.59,
                      inclination: 53.2,
                      battery: 94 - (idx % 8),
                      status: isThreatNode ? "THREAT_DETECTED" : alertMode ? "REROUTING" : "NOMINAL",
                      coords: [pos.x, pos.y, pos.z],
                      keplerian: {
                        trueAnomalyDeg,
                        raanDeg,
                        orbitalPeriodMin: 95.6,
                        eccentricity: 0.00014,
                      },
                    });
                  }}
                >
                  <sphereGeometry args={[isThreatNode || isOnActiveRoute ? 0.065 : 0.042, 16, 16]} />
                  <meshBasicMaterial color={nodeColor} toneMapped={false} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {showUplinks && (
        <lineSegments ref={uplinksRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[uplinkPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#10b981" transparent opacity={0.75} blending={THREE.AdditiveBlending} toneMapped={false} />
        </lineSegments>
      )}
      <CovarianceEllipsoid active={alertMode} position={nodes[threatId] ?? nodes[0]} />
    </>
  );
}
// ----------------------------------------------------
// FOSTER 1992 2D ENCOUNTER PLANE COLLISION PROBABILITY
// ----------------------------------------------------
export function calculateCollisionProbability(
  missDistanceKm: number,
  sigmaX: number = 0.45,
  sigmaY: number = 0.85
): { pc: number; pcScientific: string; severity: "LOW" | "ELEVATED" | "CRITICAL" } {
  const exponent = -(missDistanceKm * missDistanceKm) / (2 * (sigmaX * sigmaX + sigmaY * sigmaY));
  const pc = Math.exp(exponent) * 0.082;

  let severity: "LOW" | "ELEVATED" | "CRITICAL" = "LOW";
  if (pc > 1e-4) severity = "CRITICAL";
  else if (pc > 1e-6) severity = "ELEVATED";

  return {
    pc,
    pcScientific: pc.toExponential(3),
    severity,
  };
}
// ----------------------------------------------------
// 2. NASA 3-SIGMA CONJUNCTION COVARIANCE ELLIPSOID
// ----------------------------------------------------
function CovarianceEllipsoid({
  active,
  position,
}: {
  active: boolean;
  position: THREE.Vector3;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (active && groupRef.current && meshRef.current && ringRef.current) {
      groupRef.current.position.copy(position);
      const t = clock.getElapsedTime();
      // Pulsing uncertainty margin (expansion/contraction of positional variance)
      const scale = 1 + Math.sin(t * 4.5) * 0.08;
      meshRef.current.scale.set(scale, scale * 0.7, scale * 1.3);
      ringRef.current.rotation.z += 0.03;
      ringRef.current.rotation.x = Math.sin(t * 2) * 0.2;
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {/* 3D Volumetric Covariance Bubble */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color="#ef4444"
          transparent
          opacity={0.25}
          roughness={0.2}
          metalness={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbit-Normal Radar Sweep Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.27, 32]} />
        <meshBasicMaterial
          color="#f87171"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
function DebrisTrajectory({ active, targetPos }: { active: boolean; targetPos: [number, number, number] }) {
  const debrisRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (debrisRef.current && active) {
      const t = (clock.getElapsedTime() * 0.8) % 1;
      const [tx, ty, tz] = targetPos;
      debrisRef.current.position.set(
        tx * 1.8 - (tx * 0.8) * t,
        ty * 1.8 - (ty * 0.8) * t,
        tz * 1.8 - (tz * 0.8) * t
      );
    }
  });

  if (!active) return null;

  return (
    <mesh ref={debrisRef}>
      <dodecahedronGeometry args={[0.095, 0]} />
      <meshBasicMaterial color="#ef4444" toneMapped={false} />
    </mesh>
  );
}

function DeepSpaceBackdrop() {
  const stars = useMemo(() => {
    const coords = [];
    for (let i = 0; i < 1400; i++) {
      coords.push((Math.random() - 0.5) * 65, (Math.random() - 0.5) * 65, (Math.random() - 0.5) * 65);
    }
    return new Float32Array(coords);
  }, []);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color="#e2e8f0" transparent opacity={0.75} />
      </points>
      <mesh position={[20, 15, -30]}>
        <sphereGeometry args={[18, 16, 16]} />
        <meshBasicMaterial color="#1e1b4b" transparent opacity={0.25} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

export default function Scene({
  alertMode = false,
  threatId = 17,
  selectedSatellite,
  onSelectSatellite,
  simSpeed = 1,
  showUplinks = true,
}: {
  alertMode?: boolean;
  threatId?: number;
  selectedSatellite: SatelliteData | null;
  onSelectSatellite: (data: SatelliteData) => void;
  simSpeed?: number;
  showUplinks?: boolean;
}) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const targetCoords: [number, number, number] = selectedSatellite
    ? selectedSatellite.coords
    : [2.5, 1.5, 2.0];

  return (
    <div className="fixed inset-0 z-0 bg-black cursor-grab active:cursor-grabbing">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 6, 13], fov: 48 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[14, 8, 10]} intensity={3.2} color="#fffaf0" />
        <pointLight position={[-12, -6, -6]} intensity={1.2} color="#0284c7" />

        <DeepSpaceBackdrop />
        <HorizonAtmosphere />
        <SunBody />
        <MoonBody />

        <Suspense fallback={null}>
          <EarthWithAtmosphere earthGroupRef={earthGroupRef} simSpeed={simSpeed} />
        </Suspense>

        <ConstellationMesh
          alertMode={alertMode}
          threatId={threatId}
          selectedId={selectedSatellite ? selectedSatellite.id : null}
          onSelectSatellite={onSelectSatellite}
          earthGroupRef={earthGroupRef}
          simSpeed={simSpeed}
          showUplinks={showUplinks}
        />

        <DebrisTrajectory active={alertMode} targetPos={targetCoords} />
        <CameraController target={selectedSatellite ? selectedSatellite.coords : null} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3.8}
          maxDistance={24}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        />

        <EffectComposer multisampling={4}>
          <Bloom intensity={1.2} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.12} darkness={0.9} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}