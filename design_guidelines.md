# Farcaster Link Reveal App - Design Guidelines

## Design Approach

**Selected Approach**: Design System (Function-Differentiated)
**Primary Reference**: Material Design with Web3 app patterns (Uniswap, Rainbow aesthetic)
**Justification**: This is a utility-focused tool where clarity, trust, and efficient interaction are paramount. The payment integration (ETH) requires a professional, trustworthy interface that emphasizes functionality over visual flourish.

## Core Design Elements

### A. Typography
**Font Family**: Inter (Google Fonts)
- **Primary Text**: 400 weight for body content
- **Headings**: 600 weight for section headers, 500 for card titles
- **Buttons**: 500 weight, slightly increased letter-spacing (0.025em)
- **Wallet Address/Hash**: Mono font (Roboto Mono) at 14px for technical data

**Scale**:
- Hero Action Button Text: text-2xl (24px)
- Section Headers: text-lg (18px)
- Body/Labels: text-base (16px)
- Activity Feed Items: text-sm (14px)
- Metadata/Timestamps: text-xs (12px)

### B. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-6 or p-8
- Button padding: px-8 py-4
- Section gaps: gap-8 or gap-12
- Modal spacing: p-8
- Card spacing: p-6

**Container**:
- Main container: max-w-2xl mx-auto (centered, focused experience)
- Full-width activity slider at bottom
- Modal: max-w-md

**Grid Structure**:
- Single-column layout (mobile-first utility app)
- Header: Flex row with justify-between
- Activity feed: Horizontal scroll with flex

## Component Library

### Core Components

**1. Header Bar**
- Full-width, fixed position at top
- Height: h-16
- Flex layout: justify-between items-center
- Left: App logo/name (text-xl font-semibold)
- Right: Profile picture (rounded-full, w-10 h-10) OR Connect Wallet button
- Background: Subtle border-bottom (border-b)

**2. Main Action Button (Reveal Link)**
- Centered in viewport: Absolute center using flex
- Large, prominent: min-h-[120px] min-w-[280px]
- Rounded: rounded-2xl
- Shadow: Elevated with shadow-xl
- Text: text-2xl font-semibold
- Icon: Arrow or link icon from Heroicons

**3. Add Link Button**
- Positioned: Absolute top-right area (below header)
- Size: Standard button (px-6 py-3)
- Rounded: rounded-lg
- Icon + Text: "Add Link" with plus icon from Heroicons
- Shadow: shadow-md

**4. Modal (Add Link)**
- Overlay: Fixed inset-0 with semi-transparent backdrop
- Modal card: Centered, max-w-md, rounded-2xl
- Padding: p-8
- Components:
  - Close button (top-right, icon only)
  - Title: text-xl font-semibold, mb-6
  - Input field: Full-width, border, rounded-lg, p-4, mb-6
  - Submit button: Full-width, prominent, rounded-lg, py-4
  - Button text: "Post (0.00001 ETH)"

**5. Activity Feed Slider**
- Position: Fixed bottom-0, full-width
- Height: h-24
- Horizontal scroll: overflow-x-auto
- Items: Flex row with gap-4, px-6
- Each item card:
  - Compact design: px-4 py-3
  - Rounded: rounded-lg
  - Shadow: shadow-sm
  - Contains: Small avatar, truncated address, timestamp
  - Width: min-w-[240px]

**6. Notification Toast**
- Position: Fixed bottom-28 (above activity feed), right-4
- Rounded: rounded-lg
- Padding: px-6 py-4
- Shadow: shadow-lg
- Icon + Message layout
- Auto-dismiss visual indicator

### Form Elements

**Input Fields**:
- Border: border-2 for focus states, border for default
- Rounded: rounded-lg
- Padding: px-4 py-3
- Full-width within containers
- Placeholder: Lower opacity text

**Buttons**:
- Primary: Solid background, rounded-lg, px-8 py-4
- Secondary: Outline style, same sizing
- Icon buttons: Circular or square, p-3
- All buttons: Shadow on hover, transform scale on active

### Navigation

**Navigation Pattern**: Minimal (single page app)
- No traditional navigation
- Header serves as anchor point
- Modal overlay for interactions

### Data Display

**Activity Cards**:
- Horizontal layout
- Avatar (w-8 h-8, rounded-full) + Text content
- Text hierarchy: Username bold, timestamp light
- Compact spacing for feed efficiency

**Wallet Display**:
- Mono font for addresses
- Truncation pattern: 0x1234...5678
- Copy button with icon

### Overlays

**Modal Backdrop**:
- Fixed inset-0
- Semi-transparent background
- Blur effect (backdrop-blur-sm)
- Click to dismiss

**Modal Content**:
- White background
- Elevated shadow (shadow-2xl)
- Smooth animations on enter/exit
- Focus trap for accessibility

## Animations

**Use Sparingly** - Only where they enhance UX:
- Modal fade-in/out: 200ms duration
- Button hover: Subtle scale (1.02) with 150ms transition
- Toast slide-in from bottom: 250ms
- Activity feed: Smooth horizontal scroll (no animation on items)

## Icons

**Library**: Heroicons (via CDN)
**Usage**:
- Plus icon for "Add Link" button
- Arrow/External link icon for main action button
- Close X icon for modal
- Check icon for success notifications
- User/Avatar icon as fallback

## Page Structure

**Layout Hierarchy**:
1. Header (fixed top) - h-16
2. Main content area (flex, items-center, justify-center, min-h-screen)
   - Main action button (centered)
   - Add link button (absolute positioned top-right area)
3. Activity slider (fixed bottom) - h-24
4. Modal overlay (conditional, fixed inset-0)

**Spacing Strategy**:
- Generous padding around main action: p-12
- Consistent modal spacing: p-8
- Activity feed internal padding: px-6 py-4
- Header padding: px-6

## Accessibility

- Keyboard navigation for all interactive elements
- Focus indicators on all buttons and inputs
- Screen reader labels for icon-only buttons
- ARIA labels for modal open/close states
- Contrast ratios meeting WCAG AA standards
- Touch targets minimum 44x44px for mobile

## Responsive Behavior

**Mobile (default)**:
- Main button: Slightly smaller (min-w-[240px])
- Activity feed: Full scrollable on mobile
- Modal: Full-screen on small devices (sm:max-w-md)
- Header: Compact padding (px-4)

**Desktop (md and up)**:
- Spacious layout
- Larger hit targets
- More generous whitespace
- Activity feed shows more items