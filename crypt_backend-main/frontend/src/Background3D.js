import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// This component creates the interactive starfield
function Starfield() {
  const pointsRef = useRef();

  // Create the star positions once and memoize them to prevent recalculation
  const particles = useMemo(() => {
    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Position stars randomly within a deep 3D box
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, []);

  // useFrame runs on every single frame, creating the animation
  useFrame((state) => {
    const { mouse } = state;

    // Create a parallax effect by moving the camera based on the mouse position
    const targetX = mouse.x * 0.5;
    const targetY = mouse.y * 0.5;
    
    // Smoothly move (lerp) the camera towards the target for a fluid feel
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.02);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.02);
    
    // Always ensure the camera is looking at the center of the starfield
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.015} 
        color="#ffffff" 
        sizeAttenuation 
        depthWrite={false} 
      />
    </points>
  );
}

// Main export that sets up the full-screen canvas
export default function Background3D({ eventSource }) {
  return (
    <div className="background-canvas">
      {/* The eventSource prop is essential for forwarding mouse events */}
      <Canvas eventSource={eventSource} camera={{ position: [0, 0, 1], fov: 75 }}>
        <Starfield />
      </Canvas>
    </div>
  );
}