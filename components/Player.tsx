
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
  onImpact: (intensity: number) => void;
  isPlaying: boolean;
  sensitivity: number;
}

export const Player: React.FC<PlayerProps> = ({ 
  platforms, 
  enemies, 
  onDie, 
  onUpdatePosition, 
  onImpact,
  isPlaying,
  sensitivity
}) => {
  const groupRef = useRef<Group>(null);
  const [velocity] = useState(new Vector3(0, JUMP_FORCE, 0));
  const position = useRef(new Vector3(0, 2, 0)); 
  const controlFactor = useRef(AIR_CONTROL_FACTOR); // Lerp speed for movement
  const inputService = InputService.getInstance();
  const bodyRef = useRef<Group>(null);
  const lastPlatformId = useRef<string | null>(null);

  useFrame((state, delta) => {
    if (!isPlaying || !groupRef.current) return;

    const input = inputService.getInput();
    
    // Physics: Gravity
    velocity.y += GRAVITY * delta;
    
    // --- Movement Physics ---
    // Calculate target velocity based on Input * Sensitivity
    const targetVx = input.x * sensitivity * MOVE_SPEED;
    const targetVz = input.z * sensitivity * MOVE_SPEED;
    
    // We use a variable lerp speed (controlFactor) to simulate friction/traction.
    // High controlFactor = Snappy (Ground/Air). Low controlFactor = Sliding (Ice).
    const lerpSpeed = controlFactor.current * delta;

    velocity.x = MathUtils.lerp(velocity.x, targetVx, lerpSpeed);
    
    // For Z axis, we add a base forward momentum so player doesn't have to hold 'up' constantly,
    // but holding 'back' (negative Z) can stop them.
    const forwardBias = 2.0;
    velocity.z = MathUtils.lerp(velocity.z, targetVz + forwardBias, lerpSpeed);

    // Apply Velocity to Position
    position.current.x += velocity.x * delta;
    position.current.y += velocity.y * delta;
    position.current.z += velocity.z * delta;

    // --- Collision Detection ---
    
    // 1. Sharks
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
    if (position.current.y <= 0 && velocity.y <= 0) {
      // Check for platform landing
      const platform = platforms.current.find(p => {
        const dx = p.x - position.current.x;
        const dz = p.z - position.current.z;
        return (dx * dx + dz * dz) < (PLATFORM_RADIUS * PLATFORM_RADIUS);
      });

      if (platform) {
        // HIT PLATFORM
        position.current.y = 0; // Clamp to floor
        
        // Only trigger specific interactions once per landing
        if (lastPlatformId.current !== platform.id) {
            // Shake Camera on Impact
            onImpact(platform.type === PlatformType.WHALE ? 0.8 : 0.3);
            lastPlatformId.current = platform.id;

            // Handle Cracked Ice
            if (platform.type === PlatformType.CRACKED) {
                if (platform.steppedOn) {
                    platform.active = false;
                } else {
                    platform.steppedOn = true;
                }
            }
        }

        // Physics & Control based on Surface
        if (platform.type === PlatformType.SLIPPERY) {
            controlFactor.current = SLIPPERY_CONTROL_FACTOR; // Lose control (slide)
            // Boost speed slightly on ice to make it feel fast/uncontrollable
            velocity.x *= 1.02; 
        } else {
            controlFactor.current = AIR_CONTROL_FACTOR; // Regain control
        }

        // --- BOUNCE LOGIC ---
        // "Jump should not wear out": Reset velocity to fixed force every impact.
        let bounceForce = JUMP_FORCE;

        if (platform.type === PlatformType.WHALE) {
            bounceForce = WHALE_JUMP_FORCE;
            controlFactor.current = AIR_CONTROL_FACTOR * 0.5; // Less control on big jump
        } else if (platform.type === PlatformType.SLIPPERY) {
            bounceForce = JUMP_FORCE * 0.8; // Lower bounce on ice to emphasize sliding
        }

        velocity.y = bounceForce;
        
        // Squish animation
        if (bodyRef.current) {
            bodyRef.current.scale.set(1.4, 0.6, 1.4);
        }

      } else {
        // Missed platform -> Water (Game Over) if we fell significantly below 0
        if (position.current.y < -0.5) {
            onDie();
        }
      }
    } else if (position.current.y > 0.1) {
        // In the air
        lastPlatformId.current = null;
    }

    // Visual Recovery (Unsquish)
    if (bodyRef.current) {
        bodyRef.current.scale.lerp(new Vector3(1, 1, 1), 15 * delta);
    }

    // Update Scene Object
    groupRef.current.position.copy(position.current);
    
    // Look Rotation: Smoothly look towards movement direction
    const lookTarget = new Vector3(
        position.current.x + velocity.x, 
        position.current.y, 
        position.current.z + velocity.z
    );
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
