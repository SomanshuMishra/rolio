import { Variants } from 'framer-motion'

export const ORB_COLORS = {
  idle: {
    core: '#2d1b69',
    glow: '#7c3aed',
    ring: '#a78bfa',
    text: '#7c3aed',
  },
  thinking: {
    core: '#1e1b4b',
    glow: '#6d28d9',
    ring: '#8b5cf6',
    text: '#8b5cf6',
  },
  searching: {
    core: '#0c4a6e',
    glow: '#06b6d4',
    ring: '#22d3ee',
    text: '#06b6d4',
  },
  success: {
    core: '#14532d',
    glow: '#10b981',
    ring: '#34d399',
    text: '#10b981',
  },
}

export const STATUS_MESSAGES = {
  idle: [
    'Ready to find your next role',
    'Click to search jobs',
    'Ask me to analyze positions',
  ],
  thinking: [
    'Analyzing your profile...',
    'Preparing smart queries...',
    'Tuning AI models...',
  ],
  searching: [
    'Scanning 50+ job boards...',
    'Matching against your resume...',
    'Ranking by AI score...',
    'Filtering for best fits...',
  ],
  success: (count: number) => [
    `Found ${count} perfect match${count !== 1 ? 'es' : ''}!`,
    `Your top ${count} opportunities`,
  ],
}

// Framer Motion Variants

export const auraVariants: Variants = {
  idle: {
    opacity: [0.4, 0.7, 0.4],
    scale: [1, 1.1, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  thinking: {
    opacity: [0.5, 0.8, 0.5],
    scale: [1.1, 1.2, 1.1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  searching: {
    opacity: [0.6, 1, 0.6],
    scale: [1.15, 1.3, 1.15],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  success: {
    opacity: [1, 0],
    scale: [1.3, 1.5],
    transition: {
      duration: 1,
      ease: 'easeOut',
    },
  },
}

export const orbCoreVariants: Variants = {
  idle: {
    y: [0, -10, 0],
    scale: [1, 1.02, 1],
    boxShadow: [
      '0 0 20px rgba(124, 58, 237, 0.4), inset 0 0 20px rgba(124, 58, 237, 0.2)',
      '0 0 40px rgba(124, 58, 237, 0.6), inset 0 0 30px rgba(124, 58, 237, 0.3)',
      '0 0 20px rgba(124, 58, 237, 0.4), inset 0 0 20px rgba(124, 58, 237, 0.2)',
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  thinking: {
    y: [0, -8, 0],
    scale: [1, 1.05, 1],
    boxShadow: [
      '0 0 30px rgba(109, 40, 217, 0.6), inset 0 0 20px rgba(139, 92, 246, 0.3)',
      '0 0 50px rgba(109, 40, 217, 0.8), inset 0 0 30px rgba(139, 92, 246, 0.4)',
      '0 0 30px rgba(109, 40, 217, 0.6), inset 0 0 20px rgba(139, 92, 246, 0.3)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  searching: {
    scale: [1, 1.08, 1],
    boxShadow: [
      '0 0 40px rgba(6, 182, 212, 0.6), inset 0 0 25px rgba(34, 211, 238, 0.3)',
      '0 0 60px rgba(6, 182, 212, 0.8), inset 0 0 35px rgba(34, 211, 238, 0.4)',
      '0 0 40px rgba(6, 182, 212, 0.6), inset 0 0 25px rgba(34, 211, 238, 0.3)',
    ],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  success: {
    scale: [1, 1.4, 0.9, 1],
    opacity: [1, 1, 1, 0.8],
    boxShadow: '0 0 80px rgba(16, 185, 129, 0.8), inset 0 0 40px rgba(52, 211, 153, 0.4)',
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
}

export const ringVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: [0.3, 0.6, 0.3],
    scale: 1,
    transition: {
      opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      scale: { duration: 0.3 },
    },
  },
  spin: {
    rotate: 360,
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  spinReverse: {
    rotate: -360,
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const shimmerVariants: Variants = {
  idle: {
    x: [-5, 5, -5],
    y: [-5, 5, -5],
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  thinking: {
    x: [-8, 8, -8],
    y: [-8, 8, -8],
    opacity: [0.5, 0.9, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  searching: {
    x: [-10, 10, -10],
    y: [-10, 10, -10],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const statusChipVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
}

export const energyBeamVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 0.4,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
  },
}
