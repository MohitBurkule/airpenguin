import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, MathUtils } from 'three';
import { InputService } from '../services/inputService';
import { 
  GRAVITY, JUMP_FORCE, MOVE_SPEED, PLATFORM_RADIUS, 
  WHALE_JUMP_FORCE, SLIPPERY_CONTROL_FACTOR, AIR_CONTROL_FACTOR,
  SHARK_RADIUS 
} from '../constants';
import { PlatformData, PlatformType, EnemyData } from '../types';

interface PlayerProps {
  platforms: React.MutableRefObject<PlatformData[]>;
  enemies: React.MutableRefObject<EnemyData[]>;
  onDie: () => void;
  onUpdatePosition: (pos: Vector3) => void;
  isPlaying: boolean;
}

export const Player: React.FC<PlayerProps> = ({ platforms, enemies, onDie, onUpdatePosition, isPlaying }) => {
  const groupRef = useRef<Group>(null);
  const [velocity] = useState(new Vector3(0, JUMP_FORCE, 0));
  const position = useRef(new Vector3(0, 2, 0)); 
  const airControl = useRef(AIR_CONTROL_FACTOR); // Determines how much you can steer
  const inputService = InputService.getInstance();
  const bodyRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!isPlaying || !groupRef.current) return;

    const input = inputService.getInput();
    
    // Physics: Gravity
    velocity.y += GRAVITY * delta;
    
    // Physics: Input (Air Control)
    // If we just hit slippery ice, control is low
    const targetVx = input.x * MOVE_SPEED;
    const targetVz = input.z * MOVE_SPEED;
    const lerpSpeed = 5 * delta * airControl.current;

    velocity.x = MathUtils.lerp(velocity.x, targetVx, lerpSpeed);
    velocity.z = MathUtils.lerp(velocity.z, targetVz + 2, lerpSpeed); // Forward momentum

    // Apply Velocity
    position.current.x += velocity.x * delta;
    position.current.y += velocity.y * delta;
    position.current.z += velocity.z * delta;

    // --- Collision Detection ---
    
    // 1. Sharks (Check regardless of height if really close, or just when low)
    if (position.current.y < 1.0) {
       const shark = enemies.current.find(e => {
           if (!e.active) return false;
           const dx = e.x - position.current.x;
           const dz = e.z - position.current.z;
           return (dx * dx + dz * dz) < (SHARK_RADIUS * SHARK_RADIUS);
       });
       if (shark) {
           onDie();
       }
    }

    // 2. Platforms
    if (position.current.y <= 0) {
      // Check for platform landing
      const platform = platforms.current.find(p => {
        const dx = p.x - position.current.x;
        const dz = p.z - position.current.z;
        return (dx * dx + dz * dz) < (PLATFORM_RADIUS * PLATFORM_RADIUS);
      });

      if (platform) {
        // HIT PLATFORM
        position.current.y = 0; // Clamp to floor
        
        // Handle Cracked Ice
        if (platform.type === PlatformType.CRACKED) {
            if (platform.steppedOn) {
                platform.active = false;
            } else {
                platform.steppedOn = true;
            }
        }

        // Reset Control unless slippery
        if (platform.type === PlatformType.SLIPPERY) {
            airControl.current = SLIPPERY_CONTROL_FACTOR;
            // Slide visuals: maintain or boost horizontal velocity
            velocity.x *= 1.3;
            velocity.z *= 1.1;
        } else {
            airControl.current = AIR_CONTROL_FACTOR;
        }

        // Bounce Force
        if (platform.type === PlatformType.WHALE) {
            velocity.y = WHALE_JUMP_FORCE;
            // Reset control on whale to allow adjusting the massive jump
            airControl.current = AIR_CONTROL_FACTOR * 0.8; 
        } else if (platform.type === PlatformType.SLIPPERY) {
            velocity.y = JUMP_FORCE * 0.7; // Low bounce on slide
        } else {
            velocity.y = JUMP_FORCE;
        }
        
        // Squish animation
        if (bodyRef.current) bodyRef.current.scale.set(1.3, 0.7, 1.3);

      } else {
        // Missed platform -> Water
        onDie();
      }
    }

    // Visual Recovery (Unsquish)
    if (bodyRef.current) {
        bodyRef.current.scale.lerp(new Vector3(1, 1, 1), 10 * delta);
    }

    // Update Scene Object
    groupRef.current.position.copy(position.current);
    const lookTarget = new Vector3(position.current.x + velocity.x, position.current.y, position.current.z + velocity.z);
    groupRef.current.lookAt(lookTarget);

    onUpdatePosition(position.current);
  });

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {/* Shadow Blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position.current.y + 0.05, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="black" opacity={0.4} transparent />
      </mesh>

      <group ref={bodyRef}>
        {/* Body */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        {/* Belly */}
        <mesh position={[0, 0.5, 0.35]} scale={[0.8, 0.8, 0.5]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Beak */}
        <mesh position={[0, 0.7, 0.4]} rotation={[1.5, 0, 0]}>
           <coneGeometry args={[0.1, 0.3, 32]} />
           <meshStandardMaterial color="#f59e0b" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.15, 0.8, 0.35]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.15, 0.8, 0.35]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[-0.15, 0.8, 0.42]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.15, 0.8, 0.42]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
    </group>
  );
};