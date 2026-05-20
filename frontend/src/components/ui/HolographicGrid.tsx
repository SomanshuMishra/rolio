'use client'

export default function HolographicGrid() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {/* Vertical lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 100%',
        }} />

        {/* Horizontal lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(0deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
          backgroundSize: '100% 50px',
          animation: 'grid-move 8s linear infinite',
        }} />
      </div>

      {/* Animated glow effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <style>{`
        @keyframes grid-move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 50px;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(20px, 20px) scale(1.1);
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  )
}
