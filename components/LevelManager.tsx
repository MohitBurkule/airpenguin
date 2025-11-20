import React, { useEffect, useRef, useState } from 'react';
import { PlatformData, PlatformType, EnemyData } from '../types';
import { CHUNK_SIZE, PLATFORM_GAP, WORLD_WIDTH } from '../constants';
import { Platform } from './Platform';
import { Shark } from './Shark';

interface LevelManagerProps {
  playerZ: number;
  platformsRef: React.MutableRefObject<PlatformData[]>;
  enemiesRef: React.MutableRefObject<EnemyData[]>;
}

export const LevelManager: React.FC<LevelManagerProps> = ({ playerZ, platformsRef, enemiesRef }) => {
  const [renderPlatforms, setRenderPlatforms] = useState<PlatformData[]>([]);
  const [renderEnemies, setRenderEnemies] = useState<EnemyData[]>([]);
  
  const lastGeneratedZ = useRef(0);
  const nextId = useRef(0);

  useEffect(() => {
    generateInitialChunk();
  }, []);

  useEffect(() => {
    const renderDist = 40;
    if (playerZ + renderDist > lastGeneratedZ.current) {
        generateChunk(lastGeneratedZ.current + PLATFORM_GAP);
    }
    
    // Cleanup
    const cleanupThreshold = playerZ - 25;
    setRenderPlatforms(prev => prev.filter(p => p.z > cleanupThreshold));
    setRenderEnemies(prev => prev.filter(e => e.z > cleanupThreshold));
    
    // Sync refs for physics
    platformsRef.current = platformsRef.current.filter(p => p.z > cleanupThreshold && p.active);
    enemiesRef.current = enemiesRef.current.filter(e => e.z > cleanupThreshold && e.active);

  }, [playerZ]);

  const generateInitialChunk = () => {
    const plats: PlatformData[] = [];
    
    // Safe zone
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
    const newEnemies: EnemyData[] = [];
    
    for (let row = 0; row < CHUNK_SIZE; row++) {
        const z = startZ + (row * PLATFORM_GAP);
        
        let hasPlatformInRow = false;
        const isSharkRow = Math.random() > 0.7; // 30% chance row has sharks in gaps

        for (let col = 0; col < WORLD_WIDTH; col++) {
             const x = (col - Math.floor(WORLD_WIDTH / 2)) * PLATFORM_GAP;
             
             const rand = Math.random();
             let type = PlatformType.STANDARD;
             let active = true;

             // Procedural Logic
             if (rand > 0.8) {
                 active = false; // Gap
             } else if (rand > 0.75) {
                 type = PlatformType.TURTLE; // 5% Turtle
             } else if (rand > 0.70) {
                 type = PlatformType.WHALE; // 5% Whale
             } else if (rand > 0.60) {
                 type = PlatformType.CRACKED; // 10% Cracked
             } else if (rand > 0.50) {
                 type = PlatformType.SLIPPERY; // 10% Slippery
             }

             // Safety: Ensure middle lane isn't impossible early on
             if (col === Math.floor(WORLD_WIDTH/2) && !hasPlatformInRow && !active && z < 100) {
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
                     active,
                     initialX: x // Store initial X for movers
                 });
             } else if (isSharkRow && Math.abs(x) <= PLATFORM_GAP) {
                 // Spawn shark in the gap if it's a "Shark Row" and near center
                 newEnemies.push({
                     id: `e-${nextId.current++}`,
                     x,
                     z,
                     type: 'SHARK',
                     active: true
                 });
             }
        }
    }

    lastGeneratedZ.current = startZ + (CHUNK_SIZE * PLATFORM_GAP);
    
    platformsRef.current = [...platformsRef.current, ...newPlats];
    enemiesRef.current = [...enemiesRef.current, ...newEnemies];
    
    setRenderPlatforms(prev => [...prev, ...newPlats]);
    setRenderEnemies(prev => [...prev, ...newEnemies]);
  };

  return (
    <group>
      {renderPlatforms.map(p => (
        <Platform key={p.id} data={p} />
      ))}
      {renderEnemies.map(e => (
        <Shark key={e.id} data={e} />
      ))}
      
      {/* Infinite Water Plane */}
      <mesh position={[0, -0.5, playerZ]} rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[100, 100]} />
         <meshStandardMaterial color="#0ea5e9" opacity={0.8} transparent roughness={0.1} />
      </mesh>
    </group>
  );
};