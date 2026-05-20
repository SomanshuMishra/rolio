'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ParticleBackgroundProps {
  particleCount?: number
  textString?: string
  interactive?: boolean
}

export default function ParticleBackground({
  particleCount = 200,
  interactive = true,
}: ParticleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const width = window.innerWidth
    const height = window.innerHeight

    try {
      // Scene setup
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.z = 100
      cameraRef.current = camera

      // Renderer setup with fallback
      let renderer: THREE.WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      } catch (e) {
        console.warn('WebGL not available, particle background disabled')
        return () => {}
      }

      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(0x000000, 0)
      containerRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Create particles
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const velocities = new Float32Array(particleCount * 3)

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 400
        positions[i + 1] = (Math.random() - 0.5) * 400
        positions[i + 2] = (Math.random() - 0.5) * 100

        velocities[i] = (Math.random() - 0.5) * 0.5
        velocities[i + 1] = (Math.random() - 0.5) * 0.5
        velocities[i + 2] = (Math.random() - 0.5) * 0.5
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

      const material = new THREE.PointsMaterial({
        color: 0x6366f1,
        size: 2,
        sizeAttenuation: true,
        opacity: 0.7,
        transparent: true,
      })

      const particles = new THREE.Points(geometry, material)
      scene.add(particles)
      particlesRef.current = particles

      // Mouse interaction
      const onMouseMove = (event: MouseEvent) => {
        if (!interactive) return
        mouseRef.current.x = (event.clientX / width) * 2 - 1
        mouseRef.current.y = -(event.clientY / height) * 2 + 1
      }

      window.addEventListener('mousemove', onMouseMove)

      // Animation loop
      let rotationSpeed = 0.0005
      let animationFrameId: number

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)

        if (particles && renderer) {
          particles.rotation.x += rotationSpeed
          particles.rotation.y += rotationSpeed

          // Update particle positions
          const positionAttribute = geometry.getAttribute('position')
          const velocityAttribute = geometry.getAttribute('velocity')
          const positions = positionAttribute.array as Float32Array
          const velocities = velocityAttribute.array as Float32Array

          for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i]
            positions[i + 1] += velocities[i + 1]
            positions[i + 2] += velocities[i + 2]

            // Wrap around
            if (Math.abs(positions[i]) > 200) velocities[i] *= -1
            if (Math.abs(positions[i + 1]) > 200) velocities[i + 1] *= -1
            if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1
          }

          positionAttribute.needsUpdate = true

          // Mouse interaction
          if (interactive && mouseRef.current.x) {
            rotationSpeed = 0.001 * Math.abs(mouseRef.current.x + mouseRef.current.y)
          }
        }

        if (renderer) {
          renderer.render(scene, camera)
        }
      }

      animate()

      // Handle window resize
      const handleResize = () => {
        const newWidth = window.innerWidth
        const newHeight = window.innerHeight

        if (camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = newWidth / newHeight
          camera.updateProjectionMatrix()
        }

        renderer.setSize(newWidth, newHeight)
      }

      window.addEventListener('resize', handleResize)

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('resize', handleResize)
        if (renderer && containerRef.current?.contains(renderer.domElement)) {
          containerRef.current?.removeChild(renderer.domElement)
        }
        geometry.dispose()
        material.dispose()
        renderer.dispose()
      }
    } catch (error) {
      console.warn('Failed to initialize Three.js particle background:', error)
      return () => {}
    }
  }, [particleCount, interactive])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)',
      }}
    />
  )
}
