
import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { Player } from './Player';
import { LevelManager } from './LevelManager';
import { PlatformData, EnemyData, GameState } from '../types';
import { CAMERA_OFFSET_Y, CAMERA_OFFSET_Z, CAMERA_LOOK_Z_OFFSET } from '../constants';
import { Environment } from '@react-three/drei';

interface GameSceneProps {
  gameState: GameState;
  onDie: () => void;
  setScore: (s: number) => void;
  sensitivity: number;
}

// Ref for imperative camera shake commands
interface ShakeState {
  intensity: number;
}

const CameraController: React.FC<{ playerPos: Vector3, shakeRef: React.MutableRefObject<ShakeState> }> = ({ playerPos, shakeRef }) => {
  const { camera } = useThree();
  
  useFrame((state, delta) => {
    // Decay Shake
    shakeRef.current.intensity = MathUtils.lerp(shakeRef.current.intensity, 0, delta * 5);
    const shake = shakeRef.current.intensity;
    
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;
    const shakeZ = (Math.random() - 0.5) * shake;

    const targetX = playerPos.x * 0.3; 
    const targetZ = playerPos.z - CAMERA_OFFSET_Z;
    
    // Smooth Follow
    camera.position.x = MathUtils.lerp(camera.position.x, targetX, 0.1) + shakeX;
    camera.position.z = MathUtils.lerp(camera.position.z, targetZ, 0.1) + shakeZ;
    camera.position.y = MathUtils.lerp(camera.position.y, CAMERA_OFFSET_Y, 0.1) + shakeY;
    
    camera.lookAt(playerPos.x * 0.1, 0, playerPos.z + CAMERA_LOOK_Z_OFFSET);
  });
  
  return null;
};

export const GameScene: React.FC<GameSceneProps> = ({ gameState, onDie, setScore, sensitivity }) => {
  const platformsRef = useRef<PlatformData[]>([]);
  const enemiesRef = useRef<EnemyData[]>([]);
  const [playerPos, setPlayerPos] = useState(new Vector3(0, 0, 0));
  const shakeRef = useRef<ShakeState>({ intensity: 0 });

  const handleUpdatePosition = (pos: Vector3) => {
    setPlayerPos(pos.clone());
    if (gameState === GameState.PLAYING) {
      setScore(pos.z);
    }
  };
  
  const triggerShake = (amount: number) => {
    shakeRef.current.intensity = amount;
  };

  return (
    <Canvas shadows camera={{ position: [0, CAMERA_OFFSET_Y, -CAMERA_OFFSET_Z], fov: 50 }}>
      <Suspense fallback={null}>
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        
        <CameraController playerPos={playerPos} shakeRef={shakeRef} />

        {gameState === GameState.PLAYING && (
          <Player 
            platforms={platformsRef}
            enemies={enemiesRef}
            onDie={onDie}
            onUpdatePosition={handleUpdatePosition}
            onImpact={triggerShake}
            isPlaying={true}
            sensitivity={sensitivity}
          />
        )}

        <LevelManager 
            playerZ={playerPos.z} 
            platformsRef={platformsRef} 
            enemiesRef={enemiesRef}
        />
        
        {/* Fog for depth hiding */}
        <fog attach="fog" args={['#1e293b', 10, 40]} />
      </Suspense>
    </Canvas>
  );
};
