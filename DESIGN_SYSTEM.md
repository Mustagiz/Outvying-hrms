# Design System

## Color Palette

### Primary Colors
- **Primary 50**: `#eff6ff`
- **Primary 100**: `#dbeafe`
- **Primary 200**: `#bfdbfe`
- **Primary 300**: `#93c5fd`
- **Primary 400**: `#60a5fa`
- **Primary 500**: `#3b82f6`
- **Primary 600**: `#2563eb` (Main)
- **Primary 700**: `#1d4ed8`
- **Primary 800**: `#1e40af`
- **Primary 900**: `#1e3a8a`

### Semantic Colors
- **Success**: `#10b981` (Green 500)
- **Warning**: `#f59e0b` (Amber 500)
- **Error**: `#ef4444` (Red 500)
- **Info**: `#3b82f6` (Blue 500)

### Neutral Colors
- **Gray 50**: `#f9fafb`
- **Gray 100**: `#f3f4f6`
- **Gray 200**: `#e5e7eb`
- **Gray 300**: `#d1d5db`
- **Gray 400**: `#9ca3af`
- **Gray 500**: `#6b7280`
- **Gray 600**: `#4b5563`
- **Gray 700**: `#374151`
- **Gray 800**: `#1f2937`
- **Gray 900**: `#111827`

## Typography

### Font Family
- **Primary**: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Monospace**: 'Fira Code', 'Courier New', monospace

### Font Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing

Using 8px base unit:
- **0**: 0
- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **5**: 1.25rem (20px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **10**: 2.5rem (40px)
- **12**: 3rem (48px)
- **16**: 4rem (64px)

## Border Radius
- **sm**: 0.125rem (2px)
- **base**: 0.25rem (4px)
- **md**: 0.375rem (6px)
- **lg**: 0.5rem (8px)
- **xl**: 0.75rem (12px)
- **2xl**: 1rem (16px)
- **full**: 9999px

## Shadows
- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **base**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

## Component Patterns

### Button Variants
- **Primary**: Blue background, white text
- **Secondary**: Gray background, dark text
- **Outline**: Transparent background, border
- **Ghost**: Transparent background, no border
- **Danger**: Red background, white text

### Button Sizes
- **sm**: padding 0.5rem 1rem, text-sm
- **md**: padding 0.75rem 1.5rem, text-base
- **lg**: padding 1rem 2rem, text-lg

### Card
- Background: White (light) / Gray 800 (dark)
- Border: 1px solid Gray 200 (light) / Gray 700 (dark)
- Border Radius: lg (8px)
- Shadow: base
- Padding: 1.5rem (24px)

### Input Fields
- Height: 2.5rem (40px)
- Padding: 0.5rem 0.75rem
- Border: 1px solid Gray 300
- Border Radius: md (6px)
- Focus: 2px ring Primary 600

### Modal
- Backdrop: rgba(0, 0, 0, 0.5)
- Container: White background, rounded-lg
- Max Width: 32rem (512px)
- Padding: 1.5rem (24px)

## Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Animation
- **Duration Fast**: 150ms
- **Duration Base**: 200ms
- **Duration Slow**: 300ms
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)

## Icons
- **Size sm**: 16px
- **Size md**: 20px
- **Size lg**: 24px
- **Size xl**: 32px

## Accessibility
- Minimum touch target: 44x44px
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text
- Focus indicators: 2px ring with offset

## Dark Mode
All components should support dark mode using Tailwind's `dark:` prefix.

### Dark Mode Colors
- Background: Gray 900
- Surface: Gray 800
- Text Primary: White
- Text Secondary: Gray 400
- Border: Gray 700
