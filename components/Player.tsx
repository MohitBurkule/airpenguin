import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, MathUtils } from 'three';
import { InputService } from '../services/inputService';
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, PLATFORM_RADIUS, SLIDE_FRICTION } from '../constants';
import { PlatformData, PlatformType } from '../types';

interface PlayerProps {
  platforms: React.MutableRefObject<PlatformData[]>;
  onDie: () => void;
  onUpdatePosition: (pos: Vector3) => void;
  isPlaying: boolean;
}

export const Player: React.FC<PlayerProps> = ({ platforms, onDie, onUpdatePosition, isPlaying }) => {
  const groupRef = useRef<Group>(null);
  const [velocity] = useState(new Vector3(0, JUMP_FORCE, 0));
  const position = useRef(new Vector3(0, 2, 0)); // Start mid-air
  const isGrounded = useRef(false);
  const inputService = InputService.getInstance();

  // VisualRefs for squash/stretch
  const bodyRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!isPlaying || !groupRef.current) return;

    // 1. Input Handling
    const input = inputService.getInput();
    
    // 2. Physics Integration
    // Apply Gravity
    velocity.y += GRAVITY * delta;
    
    // Apply Input to Horizontal Velocity (Air Control)
    // If grounded or slippery, physics might differ, but Air Penguin is mostly air control
    // We dampen the velocity change to give it mass
    const targetVx = input.x * MOVE_SPEED;
    const targetVz = input.z * MOVE_SPEED;

    velocity.x = MathUtils.lerp(velocity.x, targetVx, 5 * delta);
    
    // In the original game, forward movement is often constant or strictly controlled. 
    // Here we allow full control but bias towards Z+
    velocity.z = MathUtils.lerp(velocity.z, targetVz + 2, 5 * delta); // +2 base forward momentum

    // Update Position
    position.current.x += velocity.x * delta;
    position.current.y += velocity.y * delta;
    position.current.z += velocity.z * delta;

    // 3. Collision Detection (Discrete Ground Check)
    if (position.current.y <= 0) {
      // We hit the "water level" or "platform level"
      
      // Find platform under feet
      const platform = platforms.current.find(p => {
        const dx = p.x - position.current.x;
        const dz = p.z - position.current.z;
        return (dx * dx + dz * dz) < (PLATFORM_RADIUS * PLATFORM_RADIUS);
      });

      if (platform) {
        // HIT PLATFORM
        position.current.y = 0;
        
        if (platform.type === PlatformType.CRACKED && platform.steppedOn) {
            // It breaks on second bounce (or immediately depending on difficulty)
            // For now, let's make cracked ice break immediately after jump off logic?
            // Or simple: if we land on cracked, we bounce, but next time it's gone.
            // Handling destruction in LevelManager via state update might be slow.
            // We'll mark it inactive in the ref immediately.
             platform.active = false; 
        } else if (platform.type === PlatformType.CRACKED) {
            platform.steppedOn = true;
        }

        // BOUNCE LOGIC
        if (platform.type === PlatformType.SLIPPERY) {
             // Slide instead of full bounce immediately? 
             // Arcade feel: Just keep momentum high, normal bounce
             velocity.x *= 1.2; 
             velocity.z *= 1.2;
             velocity.y = JUMP_FORCE * 0.8; // Lower bounce on ice
        } else {
            velocity.y = JUMP_FORCE;
        }
        
        // Squish effect
        if (bodyRef.current) {
            bodyRef.current.scale.set(1.3, 0.7, 1.3);
        }

      } else {
        // HIT WATER
        onDie();
      }
    }

    // Reset Squish
    if (bodyRef.current) {
        bodyRef.current.scale.lerp(new Vector3(1, 1, 1), 10 * delta);
    }

    // Apply to Scene Object
    groupRef.current.position.copy(position.current);
    
    // Face direction of movement
    const lookTarget = new Vector3(position.current.x + velocity.x, position.current.y, position.current.z + velocity.z);
    groupRef.current.lookAt(lookTarget);

    // Report position for Camera
    onUpdatePosition(position.current);
  });

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {/* Shadow Blob - Essential for depth perception */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position.current.y + 0.05, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="black" opacity={0.4} transparent />
      </mesh>

      <group ref={bodyRef}>
        {/* Penguin Body */}
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