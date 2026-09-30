"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function SatelliteModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={[0.13, 0.13, 0.13]}>
      {/* Central Avionics Core with Multi-Layer Gold Foil Insulation */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.5, 1.0]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.9}
          roughness={0.25}
          emissive="#78590c"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Equipment Bay & Thermal Radiator Deck */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.66, 0.02, 0.94]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Optical Crosslink (ISL) Laser Transceivers (Fore & Aft) */}
      <mesh position={[0, 0, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 0.22, 16]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.58]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 0.22, 16]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Dual Articulated High-Efficiency Solar Panel Arrays */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.4, 0, 0]}>
          {/* Carbon-fiber Deployment Truss Boom */}
          <mesh position={[side * 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>

          {/* Silicon Photovoltaic Wing */}
          <mesh position={[side * 1.15, 0, 0]}>
            <boxGeometry args={[1.6, 0.02, 0.75]} />
            <meshStandardMaterial
              color="#172554"
              metalness={0.9}
              roughness={0.15}
              emissive="#1e3a8a"
              emissiveIntensity={0.25}
            />
          </mesh>

          {/* Cell Grid Framing */}
          <mesh position={[side * 1.15, 0.015, 0]}>
            <boxGeometry args={[1.62, 0.005, 0.77]} />
            <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}