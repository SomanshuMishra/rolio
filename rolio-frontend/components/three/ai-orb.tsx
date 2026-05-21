"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sphere, MeshDistortMaterial, Float, Stars } from "@react-three/drei"
import * as THREE from "three"

function AICore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const innerMeshRef = useRef<THREE.Mesh>(null)
  const { pointer } = useThree()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
      // React to mouse
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        pointer.x * 0.3,
        0.05
      )
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        pointer.y * 0.3,
        0.05
      )
    }
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.x = -state.clock.elapsedTime * 0.3
      innerMeshRef.current.rotation.y = -state.clock.elapsedTime * 0.4
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group>
        {/* Outer glowing sphere */}
        <Sphere ref={meshRef} args={[1.5, 64, 64]}>
          <MeshDistortMaterial
            color="#8B5CF6"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.7}
          />
        </Sphere>
        
        {/* Inner energy core */}
        <Sphere ref={innerMeshRef} args={[0.8, 32, 32]}>
          <MeshDistortMaterial
            color="#00D4FF"
            attach="material"
            distort={0.6}
            speed={4}
            roughness={0}
            metalness={1}
            emissive="#00D4FF"
            emissiveIntensity={0.5}
          />
        </Sphere>

        {/* Orbiting rings */}
        <OrbitalRing radius={2.2} color="#8B5CF6" speed={1} />
        <OrbitalRing radius={2.6} color="#00D4FF" speed={-0.7} tilt={Math.PI / 4} />
        <OrbitalRing radius={3} color="#FF4D9D" speed={0.5} tilt={Math.PI / 3} />
      </group>
    </Float>
  )
}

function OrbitalRing({ radius, color, speed, tilt = 0 }: { radius: number; color: string; speed: number; tilt?: number }) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * speed
    }
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, tilt, 0]}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  )
}

function ParticleField() {
  const count = 500
  const particlesRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 5 + Math.random() * 10
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3)
    const colorPalette = [
      new THREE.Color("#8B5CF6"),
      new THREE.Color("#00D4FF"),
      new THREE.Color("#FF4D9D"),
    ]
    
    for (let i = 0; i < count; i++) {
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      cols[i * 3] = color.r
      cols[i * 3 + 1] = color.g
      cols[i * 3 + 2] = color.b
    }
    return cols
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

export default function AIOrb() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#8B5CF6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00D4FF" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          color="#FF4D9D"
        />
        
        <AICore />
        <ParticleField />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0.5} fade speed={1} />
      </Canvas>
    </div>
  )
}
