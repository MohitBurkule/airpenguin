import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { EnemyData } from '../types';
import { SHARK_PATROL_RANGE } from '../constants';

interface SharkProps {
  data: EnemyData;
}

export const Shark: React.FC<SharkProps> = ({ data }) => {
  const groupRef = useRef<Group>(null);
  const initialX = useRef(data.x);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    // Patrol movement in water
    const t = clock.getElapsedTime();
    const offset = Math.sin(t * 2 + parseFloat(data.id.split('-')[1] || '0')) * SHARK_PATROL_RANGE;
    
    // Move mostly on X axis in the gap
    groupRef.current.position.x = initialX.current + offset;
    
    // Update data for collision
    data.x = groupRef.current.position.x;
    
    // Bob up and down
    groupRef.current.position.y = Math.sin(t * 5) * 0.2 - 0.5;
    
    // Rotation to face movement
    const velocityX = Math.cos(t * 2 + parseFloat(data.id.split('-')[1] || '0'));
    groupRef.current.rotation.y = velocityX > 0 ? Math.PI / 2 : -Math.PI / 2;
  });

  if (!data.active) return null;

  return (
    <group ref={groupRef} position={[data.x, 0, data.z]}>
       {/* Shark Fin */}
       <mesh position={[0, 0.5, 0]}>
         <coneGeometry args={[0.4, 0.8, 4]} />
         <meshStandardMaterial color="#334155" roughness={0.2} />
       </mesh>
       {/* Body hint underwater */}
       <mesh position={[0, -0.2, 0]} scale={[1, 0.5, 2]}>
         <sphereGeometry args={[0.4]} />
         <meshStandardMaterial color="#475569" />
       </mesh>
    </group>
  );
};