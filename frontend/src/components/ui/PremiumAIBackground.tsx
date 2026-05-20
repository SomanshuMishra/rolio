'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function PremiumAIBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const linesRef = useRef<THREE.LineSegments | null>(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const cameraTarget = useRef({ x: 0, y: 0, z: 5 })

  useEffect(() => {
    if (!containerRef.current) return

    // Scene Setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 5
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Particles
    const particleCount = window.innerWidth < 768 ? 300 : 800
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20
      positions[i + 1] = (Math.random() - 0.5) * 20
      positions[i + 2] = (Math.random() - 0.5) * 20

      velocities[i] = (Math.random() - 0.5) * 0.02
      velocities[i + 1] = (Math.random() - 0.5) * 0.02
      velocities[i + 2] = (Math.random() - 0.5) * 0.02
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.userData.velocities = velocities

    const material = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)
    particlesRef.current = particles

    // Neural Network Lines
    const lineCount = window.innerWidth < 768 ? 80 : 200
    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(lineCount * 6)

    for (let i = 0; i < lineCount * 6; i += 6) {
      linePositions[i] = (Math.random() - 0.5) * 20
      linePositions[i + 1] = (Math.random() - 0.5) * 20
      linePositions[i + 2] = (Math.random() - 0.5) * 20

      linePositions[i + 3] = (Math.random() - 0.5) * 20
      linePositions[i + 4] = (Math.random() - 0.5) * 20
      linePositions[i + 5] = (Math.random() - 0.5) * 20
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.15,
      linewidth: 1,
    })

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)
    linesRef.current = lines

    // Mouse Move Handler
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      cameraTarget.current.x = mousePos.current.x * 0.5
      cameraTarget.current.y = mousePos.current.y * 0.5
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation Loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Update particles
      if (particlesRef.current) {
        const positionAttribute = particlesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
        const positions = positionAttribute.array as Float32Array
        const velocities = (particlesRef.current.geometry as any).userData.velocities as Float32Array

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i]
          positions[i + 1] += velocities[i + 1]
          positions[i + 2] += velocities[i + 2]

          if (Math.abs(positions[i]) > 10) velocities[i] *= -1
          if (Math.abs(positions[i + 1]) > 10) velocities[i + 1] *= -1
          if (Math.abs(positions[i + 2]) > 10) velocities[i + 2] *= -1
        }
        positionAttribute.needsUpdate = true
      }

      // Rotate lines
      if (linesRef.current) {
        linesRef.current.rotation.x += 0.0001
        linesRef.current.rotation.y += 0.0003
      }

      // Smooth camera movement
      camera.position.x += (cameraTarget.current.x - camera.position.x) * 0.05
      camera.position.y += (cameraTarget.current.y - camera.position.y) * 0.05

      renderer.render(scene, camera)
    }

    animate()

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      containerRef.current?.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #111827 50%, #131a2b 100%)' }}
    />
  )
}
