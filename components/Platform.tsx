import React, { useMemo } from 'react';
import { PlatformData, PlatformType } from '../types';
import { PLATFORM_SIZE } from '../constants';

interface PlatformProps {
  data: PlatformData;
}

export const Platform: React.FC<PlatformProps> = ({ data }) => {
  const { x, z, type, active } = data;
  
  const color = useMemo(() => {
    switch (type) {
      case PlatformType.CRACKED: return '#cbd5e1'; // Slate 300
      case PlatformType.SLIPPERY: return '#bfdbfe'; // Blue 200 (lighter)
      default: return '#e2e8f0'; // Slate 200
    }
  }, [type]);

  const scaleY = active ? 1 : 0.1; // Animate out if inactive

  return (
    <group position={[x, 0, z]}>
      {/* Main Ice Body */}
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
  );
};