import ParticleBackground from '@/components/animations/ParticleBackground'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative w-full min-h-screen bg-black overflow-hidden">
      <ParticleBackground
        particleCount={150}
        textString="Rolio"
        interactive={true}
      />

      <div className="relative z-10 w-full min-h-screen flex items-center justify-center px-4 py-8">
        {children}
      </div>
    </main>
  )
}
