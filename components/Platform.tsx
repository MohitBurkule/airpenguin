import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { PlatformData, PlatformType } from '../types';
import { PLATFORM_SIZE } from '../constants';

interface PlatformProps {
  data: PlatformData;
}

export const Platform: React.FC<PlatformProps> = ({ data }) => {
  const { type, active, initialX } = data;
  const groupRef = useRef<Group>(null);
  
  useFrame(({ clock }) => {
    if (!active || !groupRef.current) return;
    
    // Handle Moving Platforms (Turtles)
    if (type === PlatformType.TURTLE && initialX !== undefined) {
      const t = clock.getElapsedTime();
      // Move left and right
      const offsetX = Math.sin(t * 1.5 + parseFloat(data.id.split('-')[1] || '0')) * 2.5;
      groupRef.current.position.x = initialX + offsetX;
      
      // CRITICAL: Update the data object so logic (Player collision) knows the true position
      data.x = groupRef.current.position.x;
    }
    
    // Animate Whales breathing/bobbing
    if (type === PlatformType.WHALE) {
       groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  const color = useMemo(() => {
    switch (type) {
      case PlatformType.CRACKED: return '#cbd5e1'; // Slate 300
      case PlatformType.SLIPPERY: return '#bfdbfe'; // Blue 200 (lighter)
      case PlatformType.TURTLE: return '#22c55e'; // Green 500
      case PlatformType.WHALE: return '#1e3a8a'; // Blue 900
      default: return '#e2e8f0'; // Slate 200
    }
  }, [type]);

  if (!active) return null;

  return (
    <group ref={groupRef} position={[data.x, 0, data.z]}>
      {/* Visuals based on type */}
      
      {type === PlatformType.TURTLE ? (
        // TURTLE VISUAL
        <group>
          {/* Shell */}
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[PLATFORM_SIZE / 2.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, -0.2, 0.9]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#86efac" />
          </mesh>
          {/* Flippers */}
          <mesh position={[0.8, -0.2, 0.4]} rotation={[0, 0.5, 0]} scale={[1, 0.2, 0.5]}>
             <sphereGeometry args={[0.4]} />
             <meshStandardMaterial color="#86efac" />
          </mesh>
           <mesh position={[-0.8, -0.2, 0.4]} rotation={[0, -0.5, 0]} scale={[1, 0.2, 0.5]}>
             <sphereGeometry args={[0.4]} />
             <meshStandardMaterial color="#86efac" />
          </mesh>
        </group>
      ) : type === PlatformType.WHALE ? (
        // WHALE VISUAL
        <group>
           <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[PLATFORM_SIZE / 1.8, PLATFORM_SIZE / 1.8, 0.8, 32]} />
            <meshStandardMaterial color={color} roughness={0.3} />
           </mesh>
           {/* Spout hole */}
           <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <circleGeometry args={[0.2, 16]} />
             <meshStandardMaterial color="black" />
           </mesh>
           {/* Water Effect */}
           <mesh position={[0, 0.5, 0]}>
             <coneGeometry args={[0.2, 1, 16]} />
             <meshStandardMaterial color="cyan" transparent opacity={0.6} />
           </mesh>
        </group>
      ) : (
        // STANDARD ICE VISUAL
        <group>
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[PLATFORM_SIZE / 2, PLATFORM_SIZE / 2, 1, 32]} />
            <meshStandardMaterial 
              color={color} 
              roughness={type === PlatformType.SLIPPERY ? 0.0 : 0.8}
              metalness={type === PlatformType.SLIPPERY ? 0.2 : 0.0}
            />
          </mesh>
          
          {/* Snow/Detail Top */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[PLATFORM_SIZE / 2 - 0.1, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={1} />
          </mesh>

          {/* Cracked Visuals */}
          {type === PlatformType.CRACKED && (
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0, PLATFORM_SIZE / 3, 6]} />
              <meshBasicMaterial color="#94a3b8" wireframe />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
};