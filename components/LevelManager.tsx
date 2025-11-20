import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Vector3 } from 'three';
import { PlatformData, PlatformType } from '../types';
import { CHUNK_SIZE, PLATFORM_GAP, WORLD_WIDTH } from '../constants';
import { Platform } from './Platform';

interface LevelManagerProps {
  playerZ: number;
  platformsRef: React.MutableRefObject<PlatformData[]>;
}

export const LevelManager: React.FC<LevelManagerProps> = ({ playerZ, platformsRef }) => {
  const [renderPlatforms, setRenderPlatforms] = useState<PlatformData[]>([]);
  const lastGeneratedZ = useRef(0);
  const nextId = useRef(0);

  // Initialization
  useEffect(() => {
    generateInitialChunk();
  }, []);

  // Continuous Generation loop based on player position
  useEffect(() => {
    const renderDist = 30;
    if (playerZ + renderDist > lastGeneratedZ.current) {
        generateChunk(lastGeneratedZ.current + PLATFORM_GAP);
    }
    
    // Cleanup old platforms (visual optimization)
    // We keep them in ref for collision logic safety for a bit, but remove from state
    const cleanupThreshold = playerZ - 20;
    setRenderPlatforms(prev => prev.filter(p => p.z > cleanupThreshold));
    
    // Sync ref (keep all relevant platforms in ref for physics, even if not rendered? No, keep in sync)
    platformsRef.current = platformsRef.current.filter(p => p.z > cleanupThreshold && p.active);

  }, [playerZ]);

  const generateInitialChunk = () => {
    const plats: PlatformData[] = [];
    
    // Safe zone at start
    for (let i = 0; i < 5; i++) {
        plats.push({
            id: `start-${i}`,
            x: 0,
            z: i * PLATFORM_GAP,
            type: PlatformType.STANDARD,
            active: true
        });
    }
    lastGeneratedZ.current = 4 * PLATFORM_GAP;
    
    platformsRef.current = [...plats];
    setRenderPlatforms([...plats]);
  };

  const generateChunk = (startZ: number) => {
    const newPlats: PlatformData[] = [];
    
    for (let row = 0; row < CHUNK_SIZE; row++) {
        const z = startZ + (row * PLATFORM_GAP);
        
        // Logic to ensure playability:
        // We need at least one platform reachable from the previous row's average centers?
        // Simple grid noise approach
        
        let hasPlatformInRow = false;

        for (let col = 0; col < WORLD_WIDTH; col++) {
             // Center the grid
             const x = (col - Math.floor(WORLD_WIDTH / 2)) * PLATFORM_GAP;
             
             // Random Generation Logic
             const rand = Math.random();
             let type = PlatformType.STANDARD;
             let active = true;

             if (rand > 0.85) {
                 active = false; // Gap
             } else if (rand > 0.7) {
                 type = PlatformType.CRACKED;
             } else if (rand > 0.6) {
                 type = PlatformType.SLIPPERY;
             }

             // Force at least one platform in center lanes if row is empty so far
             if (col === Math.floor(WORLD_WIDTH/2) && !hasPlatformInRow && !active) {
                 active = true;
                 type = PlatformType.STANDARD;
             }

             if (active) {
                 hasPlatformInRow = true;
                 newPlats.push({
                     id: `p-${nextId.current++}`,
                     x, 
                     z,
                     type,
                     active
                 });
             }
        }
    }

    lastGeneratedZ.current = startZ + (CHUNK_SIZE * PLATFORM_GAP);
    
    platformsRef.current = [...platformsRef.current, ...newPlats];
    setRenderPlatforms(prev => [...prev, ...newPlats]);
  };

  return (
    <group>
      {renderPlatforms.map(p => (
        <Platform key={p.id} data={p} />
      ))}
      {/* Infinite Water Plane */}
      <mesh position={[0, -0.5, playerZ]} rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[100, 100]} />
         <meshStandardMaterial color="#0ea5e9" opacity={0.8} transparent roughness={0.1} />
      </mesh>
    </group>
  );
};