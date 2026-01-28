# UI/UX Component Library

## Overview
This document provides a comprehensive guide to all reusable UI components in the HRMS application.

---

## Animation Components

### AnimatedCard
Animated card with hover effects and entrance animation.

**Usage:**
```jsx
import AnimatedCard from './components/AnimatedCard';

<AnimatedCard delay={0.1}>
  <h3>Card Title</h3>
  <p>Card content</p>
</AnimatedCard>
```

**Props:**
- `delay` (number): Animation delay in seconds
- `className` (string): Additional CSS classes

---

### StatCard
Stat card with trend indicators and icons.

**Usage:**
```jsx
import StatCard from './components/StatCard';
import { Users } from 'lucide-react';

<StatCard
  title="Total Employees"
  value="150"
  change={5.2}
  changeType="increase"
  icon={Users}
  color="blue"
/>
```

**Props:**
- `title` (string): Card title
- `value` (string|number): Main value
- `change` (number): Percentage change
- `changeType` ('increase'|'decrease'|'neutral'): Trend direction
- `icon` (Component): Lucide icon component
- `color` ('blue'|'green'|'yellow'|'red'|'purple'): Color theme

---

## Interactive Components

### AdvancedSearch
Advanced search with expandable filters.

**Usage:**
```jsx
import AdvancedSearch from './components/AdvancedSearch';

<AdvancedSearch
  onSearch={(params) => console.log(params)}
  filters={[
    { key: 'department', label: 'Department', options: [...] },
    { key: 'status', label: 'Status', options: [...] }
  ]}
/>
```

**Props:**
- `onSearch` (function): Callback with search params
- `filters` (array): Filter configuration

---

### Accordion
Collapsible accordion with smooth animations.

**Usage:**
```jsx
import Accordion from './components/Accordion';
import { HelpCircle } from 'lucide-react';

<Accordion
  items={[
    {
      title: 'Question 1',
      subtitle: 'Subtitle',
      icon: HelpCircle,
      content: <p>Answer content</p>
    }
  ]}
  allowMultiple={false}
/>
```

**Props:**
- `items` (array): Accordion items
- `allowMultiple` (boolean): Allow multiple open items

---

### Tabs
Animated tabs with smooth transitions.

**Usage:**
```jsx
import Tabs from './components/Tabs';
import { User, Settings } from 'lucide-react';

<Tabs
  tabs={[
    {
      label: 'Profile',
      icon: User,
      badge: '3',
      content: <ProfileContent />
    },
    {
      label: 'Settings',
      icon: Settings,
      content: <SettingsContent />
    }
  ]}
  defaultTab={0}
  onChange={(index) => console.log(index)}
/>
```

**Props:**
- `tabs` (array): Tab configuration
- `defaultTab` (number): Initial active tab
- `onChange` (function): Tab change callback

---

### ProgressBar
Animated progress bar with labels.

**Usage:**
```jsx
import ProgressBar from './components/ProgressBar';

<ProgressBar
  value={75}
  max={100}
  color="primary"
  size="md"
  showLabel={true}
  label="Upload Progress"
  animated={true}
/>
```

**Props:**
- `value` (number): Current value
- `max` (number): Maximum value
- `color` ('primary'|'success'|'warning'|'danger'|'info'): Color theme
- `size` ('sm'|'md'|'lg'): Bar size
- `showLabel` (boolean): Show percentage
- `label` (string): Label text
- `animated` (boolean): Enable animation

---

### StepIndicator
Multi-step form progress indicator.

**Usage:**
```jsx
import StepIndicator from './components/StepIndicator';

<StepIndicator
  currentStep={2}
  steps={[
    { id: 1, name: 'Personal Info', description: 'Basic details' },
    { id: 2, name: 'Employment', description: 'Job info' },
    { id: 3, name: 'Review', description: 'Confirm' }
  ]}
/>
```

**Props:**
- `currentStep` (number): Current active step
- `steps` (array): Step configuration

---

## Accessibility Components

### AccessibleModal
Fully accessible modal with focus trapping.

**Usage:**
```jsx
import AccessibleModal from './components/AccessibleModal';

<AccessibleModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content</p>
</AccessibleModal>
```

**Props:**
- `isOpen` (boolean): Modal visibility
- `onClose` (function): Close callback
- `title` (string): Modal title
- `size` ('sm'|'md'|'lg'|'xl'|'full'): Modal size

---

### AccessibleDropdown
Fully accessible dropdown with keyboard navigation.

**Usage:**
```jsx
import AccessibleDropdown from './components/AccessibleDropdown';

<AccessibleDropdown
  label="Department"
  options={[
    { value: 'eng', label: 'Engineering' },
    { value: 'hr', label: 'HR' }
  ]}
  value={selected}
  onChange={setSelected}
  required={true}
  error={errors.department}
/>
```

**Props:**
- `label` (string): Field label
- `options` (array): Dropdown options
- `value` (string): Selected value
- `onChange` (function): Change callback
- `required` (boolean): Required field
- `error` (string): Error message

---

## Animation Utilities

### animations.js
Pre-configured animation presets.

**Usage:**
```jsx
import { animations } from './utils/animations';
import { motion } from 'framer-motion';

<motion.div {...animations.fadeIn}>
  Content
</motion.div>

<motion.div {...animations.slideInBottom}>
  Content
</motion.div>
```

**Available Animations:**
- `fadeIn`
- `slideInBottom`, `slideInTop`, `slideInLeft`, `slideInRight`
- `scaleIn`
- `bounceIn`
- `cardHover`
- `buttonPress`
- `modalBackdrop`, `modalContent`
- `collapse`
- `pageTransition`

---

## Best Practices

### 1. Consistent Spacing
Use Tailwind spacing scale (4, 6, 8, 12, 16, etc.)

### 2. Color Usage
- Primary: Main actions, links
- Success: Confirmations, positive actions
- Warning: Cautions, important notices
- Danger: Errors, destructive actions

### 3. Animations
- Keep animations subtle (200-300ms)
- Use easing functions for natural motion
- Respect `prefers-reduced-motion`

### 4. Accessibility
- Always provide ARIA labels
- Ensure keyboard navigation
- Maintain color contrast
- Test with screen readers

### 5. Responsive Design
- Mobile-first approach
- Test on all breakpoints
- Use responsive utilities

---

## Component Checklist

When creating new components:
- [ ] TypeScript/PropTypes for type safety
- [ ] Accessibility features (ARIA, keyboard)
- [ ] Dark mode support
- [ ] Responsive design
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Documentation
- [ ] Unit tests
- [ ] Storybook story (if applicable)
