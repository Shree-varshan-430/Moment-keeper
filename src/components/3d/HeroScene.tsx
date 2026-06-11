// ─── Premium 3D Centerpiece Component ─────────────────────────

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface SceneProps {
  type: 'birthday' | 'anniversary' | 'celebration' | 'general';
}

// ── Birthday Cake Mesh ────────────────────────────────────────
const BirthdayCake: React.FC = () => {
  const meshRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 1.5) * 0.15;
    meshRef.current.rotation.y = t * 0.4;
  });

  return (
    <group ref={meshRef}>
      {/* Cake Base Body */}
      <mesh castShadow receiveShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.8, 32]} />
        <meshStandardMaterial color="#2E2E2E" roughness={0.1} metalness={0.7} />
      </mesh>
      {/* Cake Top Frosting */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.15, 32]} />
        <meshStandardMaterial color="#B8B8B8" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Candle 1 */}
      <mesh castShadow position={[-0.4, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.3} />
      </mesh>
      {/* Candle 2 */}
      <mesh castShadow position={[0.4, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.3} />
      </mesh>
      {/* Candle Flame Light Glows */}
      <mesh position={[-0.4, 0.9, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#FFF" />
      </mesh>
      <mesh position={[0.4, 0.9, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#FFF" />
      </mesh>
      <pointLight position={[0, 1.5, 0]} intensity={2} color="#FFF" />
    </group>
  );
};

// ── Anniversary Rings Mesh ────────────────────────────────────
const AnniversaryRings: React.FC = () => {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.15;
    groupRef.current.rotation.y = t * 0.35;
    groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {/* Ring 1 */}
      <mesh castShadow rotation={[Math.PI / 4, 0, 0]} position={[-0.4, 0, 0]}>
        <torusGeometry args={[0.7, 0.12, 16, 100]} />
        <meshStandardMaterial color="#C0C0C0" roughness={0.05} metalness={0.95} />
      </mesh>
      {/* Ring 2 */}
      <mesh castShadow rotation={[-Math.PI / 4, Math.PI / 6, 0]} position={[0.4, 0, 0]}>
        <torusGeometry args={[0.7, 0.12, 16, 100]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.05} metalness={0.95} />
      </mesh>
    </group>
  );
};

// ── Floating Gift Box Mesh ────────────────────────────────────
const GiftBox: React.FC = () => {
  const meshRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 1.5) * 0.15;
    meshRef.current.rotation.y = t * 0.45;
  });

  return (
    <group ref={meshRef}>
      {/* Main Box */}
      <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[1.3, 1.3, 1.3]} />
        <meshStandardMaterial color="#1F1F1F" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Box Lid */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[1.4, 0.3, 1.4]} />
        <meshStandardMaterial color="#404040" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Ribbon Cross (Y) */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.35, 1.35, 0.25]} />
        <meshStandardMaterial color="#B8B8B8" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Ribbon Cross (X) */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.25, 1.35, 1.35]} />
        <meshStandardMaterial color="#B8B8B8" roughness={0.1} metalness={0.8} />
      </mesh>
    </group>
  );
};

// ── General Events Calendar Mesh ──────────────────────────────
const EventCalendar: React.FC = () => {
  const meshRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 1.5) * 0.15;
    meshRef.current.rotation.y = t * 0.3;
  });

  return (
    <group ref={meshRef}>
      {/* Calendar Base Plate */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0.2, -0.4, 0]}>
        <boxGeometry args={[1.4, 1.6, 0.15]} />
        <meshStandardMaterial color="#2E2E2E" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Page Sheet */}
      <mesh position={[0, 0.05, 0.1]} rotation={[0.2, -0.4, 0]}>
        <boxGeometry args={[1.2, 1.3, 0.05]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.2} />
      </mesh>
      {/* Page Header Accent */}
      <mesh position={[0, 0.55, 0.11]} rotation={[0.2, -0.4, 0]}>
        <boxGeometry args={[1.2, 0.25, 0.05]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.5} />
      </mesh>
      {/* Metal Binder Rings */}
      <mesh position={[-0.4, 0.8, 0.1]} rotation={[Math.PI / 2, 0.2, 0]}>
        <torusGeometry args={[0.15, 0.04, 8, 32]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} />
      </mesh>
      <mesh position={[0.4, 0.8, 0.1]} rotation={[Math.PI / 2, 0.2, 0]}>
        <torusGeometry args={[0.15, 0.04, 8, 32]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} />
      </mesh>
    </group>
  );
};

export const HeroScene: React.FC<SceneProps> = ({ type }) => {
  return (
    <div className="relative h-[280px] sm:h-[350px] w-full rounded-2xl border border-mk-glass-border overflow-hidden glass shadow-silver">
      {/* Ambient background glow gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-white/[0.03] to-transparent pointer-events-none"></div>

      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        
        {/* Luxury lighting keys */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-4, -4, -4]} intensity={0.5} color="#B8B8B8" />

        <Suspense fallback={null}>
          {type === 'birthday' && <BirthdayCake />}
          {type === 'anniversary' && <AnniversaryRings />}
          {type === 'celebration' && <GiftBox />}
          {type === 'general' && <EventCalendar />}
          <Stars radius={100} depth={50} count={200} factor={4} saturation={0.5} fade speed={1.2} />
        </Suspense>

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
};
