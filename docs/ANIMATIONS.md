# Animation Patterns & Components

**Best-class animations throughout the app.** Using Framer Motion, Three.js, and GSAP for rich, performant animations.

---

## Design Principles

1. **Purpose**: Every animation should enhance UX (provide feedback, draw attention, clarify state)
2. **Performance**: Use GPU-accelerated transforms (not layout-affecting properties)
3. **Accessibility**: Respect `prefers-reduced-motion` media query
4. **Micro-interactions**: Subtle hover/focus states on buttons, inputs, links
5. **Spring physics**: Use spring animation for natural, organic motion

---

## Global Animation Components

### PageTransition Wrapper
Animates page route changes with slide + fade.

**Location**: `src/components/animations/PageTransition.tsx`

**Usage**:
```tsx
import PageTransition from '@/components/animations/PageTransition'

export default function Page() {
  return (
    <PageTransition>
      <div>Page content</div>
    </PageTransition>
  )
}
```

**Animation**:
- Entry: Slide from right + fade in (0.3s spring)
- Exit: Slide to left + fade out (0.2s)

---

### ParticleBackground
Three.js 3D particle system with mouse tracking and text morphing.

**Location**: `src/components/animations/ParticleBackground.tsx`

**Usage** (Landing page):
```tsx
<ParticleBackground
  particleCount={200}
  textString="Auto Apply Jobs"
  interactive={true}
/>
```

**Features**:
- Responsive canvas (fullscreen on mobile, constrained on desktop)
- 200-500 particles depending on device
- Particles respond to mouse movement (attraction/repulsion)
- Slow rotation + floating motion
- Text morphing when hovering specific areas
- Color gradient from blue → purple → pink
- Performance optimized (requestAnimationFrame)

**Performance**:
- Disable on mobile (< 768px)
- Reduce particles on lower-end devices
- Use OffscreenCanvas if available

---

### TextReveal
Character-by-character text reveal animation.

**Location**: `src/components/animations/TextReveal.tsx`

**Usage**:
```tsx
<TextReveal text="Welcome to Auto Apply Jobs" delay={0.3} />
```

**Props**:
- `text`: String to animate
- `delay`: Initial delay (seconds)
- `duration`: Duration per character (default 0.05s)
- `className`: Apply custom styling

**Animation**:
- Each character reveals with slight stagger
- Spring easing for natural feel
- Supports emojis and special characters

---

### ScrollReveal
Reveal elements as they come into viewport.

**Location**: `src/components/animations/ScrollReveal.tsx`

**Usage**:
```tsx
<ScrollReveal>
  <Card>Content revealed on scroll</Card>
</ScrollReveal>
```

**Features**:
- Uses Intersection Observer (performant)
- Fade + slide up animation
- Configurable trigger position
- Staggered animation for lists

---

## Page-Specific Animations

### Landing Page (`src/app/page.tsx`)

**Hero Section**:
- ParticleBackground with 500 particles
- Large heading with TextReveal
- Subheading with fade-in (staggered after heading)
- Hero image with subtle parallax on scroll
- CTA button with magnetic effect (follows cursor near button)

**Feature Cards**:
- Fade + slide up on scroll (ScrollReveal)
- Hover: Inner glow, slight scale (1.05x)
- Icon animated on hover (bounce)

**Floating Elements**:
- Decorative circles/blobs with slow animation
- GSAP timeline: rotate + scale + position changes
- Parallax effect (slower on scroll)

**Call-to-Action Button**:
- Magnetic effect: button moves slightly toward cursor
- Hover: Inner glow + shadow expansion
- Click: Scale down (0.95x) + ripple animation spreading outward

---

### Auth Pages (`src/app/(auth)/login/page.tsx` & `/register/page.tsx`)

**Card Container**:
- Glassmorphism style (backdrop blur + semi-transparent background)
- Fade in + slide up on mount
- Border glow animation (pulsing subtle border color)

**Form Fields**:
- Label floats up on focus (not just on value)
- Underline expands from center on focus
- Input border color animates (gray → blue)
- Error state: border flashes red

**Form Submission**:
- Submit button: transforms into loader on click
  - Button height: same, width: expand to circular
  - Show spinner inside
  - On success: checkmark animation (spring bounce)
  - On error: shake animation + revert to button

**Password Visibility Toggle**:
- Icon rotates 180° when toggled
- Smooth color transition

---

### Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

**Sidebar**:
- Slide in from left on mount (0.3s)
- Link hover: sliding underline appears (from left to right)
- Active link: glow background + underline stays visible
- Collapse button: icon rotates 180°

**Navbar**:
- Sticky header with subtle shadow on scroll
- Profile dropdown: slide down + fade in
- Search bar: expands on focus (width animation)

---

### Resume Upload (`src/app/(dashboard)/resume/page.tsx`)

**Drop Zone**:
- Normal state: dashed border with subtle pulsing animation
- Hover state: 
  - Border becomes solid + color brightens
  - Expands slightly (scale 1.02x)
  - Background color hint appears
- Drag over state:
  - Border glows with color
  - Scale 1.05x
  - Text changes to "Drop to upload"

**File Upload Progress**:
- Progress bar slides in (height animation)
- Gradient sweep animation (left to right, loops)
- Percentage text counts up in real time
- On completion: progress bar slides out, success checkmark fades in

**Parsed Resume Display**:
- Sections appear with staggered fade + slide from left
- Each skill tag appears with scale animation
- Experience blocks: timeline animation (left line draws, content fades in)
- Collapsible sections: smooth height animation

---

### Job Cards (`src/app/(dashboard)/jobs/page.tsx`)

**Job Card 3D Flip**:
- Front: Title, company, location, match score
- Back: Description snippet, apply button, skills
- Hover: 3D flip animation (perspective transform)
- Flip smoothly on both enter/exit

**Match Score Circle**:
- Circular SVG progress ring
- Number counts up from 0 to match score (e.g., 0 → 87)
- Ring color transitions based on score:
  - 0-40: Red
  - 40-70: Yellow
  - 70-100: Green
- Animated on component mount (spring animation)

**Job List**:
- Cards appear with staggered animation (50ms delay between each)
- Each card: slide up + fade in (spring physics)
- Hover: subtle lift (transform: translateY(-4px), shadow expands)

**Save/Dismiss Actions**:
- Buttons have micro-interactions on hover
- On save: heart fills with animation
- On dismiss: card slides out to right (physics-based)
- Confirmation toast slides in from bottom

---

### Settings Pages (`src/app/(dashboard)/settings/page.tsx`)

**API Key Input**:
- Reveal/hide toggle: eye icon animates rotation
- On valid key: green checkmark with pulse animation
- On error: error message slides in + input border flashes red

**Preferences Form**:
- Multi-select fields with tag animations (enter/exit)
- Salary range slider: animated labels follow thumb
- Remote preference buttons: selected state has glow + scale

**Save Button**:
- On submit: button morphs into loader
- On success: checkmark with confetti animation (canvas-based)
- On error: shake animation + error toast

---

## Reusable Animation Utilities

### useSpringAnimation Hook
Framer Motion spring animation preset.

```ts
// Usage
import { springConfig } from '@/lib/animations'

motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ ...springConfig.gentle }}
```

**Presets**:
- `spring.gentle`: Quick, bouncy (damping: 20)
- `spring.moderate`: Balanced (damping: 15)
- `spring.bouncy`: Playful (damping: 10)
- `spring.stiff`: Responsive (damping: 25)

---

### AnimatedText Component
Renders text with character-level animations.

```tsx
<AnimatedText variant="title" stagger={0.02}>
  Your Title Here
</AnimatedText>
```

**Variants**:
- `title`: Larger, slower reveal
- `body`: Normal speed reveal
- `list`: Reveal lines sequentially

---

### LoadingSkeleton Component
Shimmer effect while loading.

```tsx
<LoadingSkeleton count={3} height="100px" className="rounded-lg" />
```

**Features**:
- Animated gradient sweep (left to right, loops)
- Respects `prefers-reduced-motion`
- Customizable height/width/count

---

## Animation Best Practices

### Do:
✅ Use `transform` and `opacity` (GPU-accelerated)
✅ Keep animations under 400ms for responsive feel
✅ Use spring animation for natural motion
✅ Provide visual feedback on all interactions
✅ Test performance on low-end devices
✅ Respect `prefers-reduced-motion` setting

### Don't:
❌ Animate `width`, `height`, `margin`, `padding` (triggers layout)
❌ Use `animation` CSS for interactive elements (use Framer Motion)
❌ Animate too many elements simultaneously
❌ Use `box-shadow` for large animations (expensive)
❌ Forget to add loading states

---

## Performance Optimization

### GPU Acceleration
```tsx
// Good: uses GPU
transform: translate3d(x, y, 0)
opacity: value

// Bad: triggers layout recalc
width: value
margin: value
```

### Limiting Repaints
```tsx
// Use willChange to hint browser
style={{ willChange: 'transform' }}

// Use contain property for performance
style={{ contain: 'layout style paint' }}
```

### Intersection Observer
Use for scroll-triggered animations:
```tsx
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Trigger animation
    }
  })
})
```

---

## Testing Animations

**Unit Tests** (Jest):
```tsx
// Test animation presence
expect(component).toHaveAttribute('data-testid', 'animated-element')

// Note: Vitest/Jest can't easily test animation completion
// Focus on presence and props
```

**Visual Tests** (Manual):
1. Check animations on multiple devices (mobile, tablet, desktop)
2. Verify smooth 60fps (DevTools Performance tab)
3. Test with `prefers-reduced-motion: reduce` enabled
4. Check on slower devices/network

---

## Common Patterns

### Staggered List
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}
```

### Loading State
```tsx
// Show skeleton while loading
{isLoading ? <LoadingSkeleton /> : <Content />}

// Animate transition between states
<AnimatePresence mode="wait">
  {isLoading ? <Skeleton key="skeleton" /> : <Content key="content" />}
</AnimatePresence>
```

### Button Hover Effects
```tsx
button
  whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba..." }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
```

---

## Accessibility

All animations must:
1. Respect `prefers-reduced-motion` media query
2. Not block interaction
3. Not cause motion sickness (avoid excessive parallax)
4. Provide non-animated fallbacks

```tsx
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

<motion.div
  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
  transition={prefersReducedMotion ? { duration: 0 } : {...}}
/>
```

---

## Future Enhancements

- [ ] Lottie animations for complex sequences
- [ ] SVG path animations for drawing effects
- [ ] Canvas-based particle effects for backgrounds
- [ ] Gesture-based animations (swipe, pinch on mobile)
- [ ] Dark mode transition animation
- [ ] Success/error confetti animations

---

See **CLAUDE.md** for overview and **DEVELOPMENT.md** for setup.
