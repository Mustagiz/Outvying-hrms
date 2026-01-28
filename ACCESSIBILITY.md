# Accessibility Guide

## Overview
This guide outlines accessibility best practices and implementations in the HRMS application to ensure WCAG 2.1 Level AA compliance.

## Key Principles

### 1. Perceivable
Information and UI components must be presentable to users in ways they can perceive.

### 2. Operable
UI components and navigation must be operable by all users.

### 3. Understandable
Information and operation of UI must be understandable.

### 4. Robust
Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

---

## Implemented Features

### Focus Management

**Focus Trapping in Modals:**
```javascript
import { focusManagement } from '../utils/accessibility';

// Trap focus within modal
const cleanup = focusManagement.trapFocus(modalElement);

// Focus first element
focusManagement.focusFirst(modalElement);

// Return focus when closing
focusManagement.returnFocus(previousElement);
```

**Skip Links:**
```javascript
import { skipLinks } from '../utils/accessibility';

// Create skip to main content link
skipLinks.createSkipLink();
```

### ARIA Announcements

**Live Regions:**
```javascript
import { announce } from '../utils/accessibility';

// Announce success
announce.success('Form submitted successfully');

// Announce error
announce.error('Please fix the errors');

// Custom announcement
announce.message('Loading complete', 'polite');
```

### Keyboard Navigation

**List Navigation:**
```javascript
import { keyboard } from '../utils/accessibility';

const handleKeyDown = (e) => {
  const newIndex = keyboard.handleListNavigation(
    e,
    items,
    currentIndex,
    onSelect
  );
  setCurrentIndex(newIndex);
};
```

**Supported Keys:**
- `Arrow Up/Down`: Navigate items
- `Home/End`: Jump to first/last
- `Enter/Space`: Select item
- `Escape`: Close/Cancel
- `Tab`: Move focus

### Color Contrast

**Check Contrast Ratios:**
```javascript
import { contrast } from '../utils/accessibility';

const ratio = contrast.getContrastRatio([255, 255, 255], [0, 0, 0]);
const meetsAA = contrast.meetsWCAG_AA([255, 255, 255], [0, 0, 0]);
const meetsAAA = contrast.meetsWCAG_AAA([255, 255, 255], [0, 0, 0]);
```

**Minimum Ratios:**
- Normal text: 4.5:1 (AA), 7:1 (AAA)
- Large text: 3:1 (AA), 4.5:1 (AAA)

---

## Component Guidelines

### Buttons

**Requirements:**
- Clear, descriptive labels
- Sufficient size (44x44px minimum)
- Visible focus indicator
- ARIA labels for icon-only buttons

**Example:**
```jsx
<button
  aria-label="Delete employee"
  className="focus:ring-2 focus:ring-primary-600"
>
  <Trash className="w-5 h-5" />
</button>
```

### Forms

**Requirements:**
- Associated labels for all inputs
- Error messages linked with `aria-describedby`
- Required fields marked with `aria-required`
- Invalid fields marked with `aria-invalid`

**Example:**
```jsx
<label htmlFor="email">Email *</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && <p id="email-error" role="alert">{error}</p>}
```

### Modals

**Requirements:**
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` pointing to title
- Focus trap
- Escape key to close
- Return focus on close

**Example:**
```jsx
<AccessibleModal
  isOpen={isOpen}
  onClose={onClose}
  title="Add Employee"
>
  {/* Modal content */}
</AccessibleModal>
```

### Dropdowns

**Requirements:**
- `role="listbox"` for list
- `role="option"` for items
- `aria-expanded` on trigger
- `aria-selected` on selected item
- Keyboard navigation

**Example:**
```jsx
<AccessibleDropdown
  label="Department"
  options={departments}
  value={selected}
  onChange={setSelected}
  required
/>
```

### Tables

**Requirements:**
- `<th>` for headers
- `scope` attribute on headers
- Caption or `aria-label`
- Sortable columns announced

**Example:**
```jsx
<table aria-label="Employee list">
  <caption className="sr-only">List of all employees</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Department</th>
    </tr>
  </thead>
  <tbody>
    {/* rows */}
  </tbody>
</table>
```

---

## Testing

### Automated Testing

**Tools:**
- axe DevTools
- WAVE
- Lighthouse Accessibility Audit

**Run Lighthouse:**
```bash
npm run lighthouse
```

### Manual Testing

**Keyboard Navigation:**
1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test all keyboard shortcuts
4. Ensure no keyboard traps

**Screen Reader Testing:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

**Checklist:**
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Focus order is logical
- [ ] No keyboard traps
- [ ] Color is not the only indicator
- [ ] Sufficient color contrast
- [ ] Text can be resized to 200%
- [ ] Content reflows at 320px width

---

## Common Patterns

### Loading States

```jsx
<div role="status" aria-live="polite">
  {loading ? 'Loading...' : 'Content loaded'}
</div>
```

### Error Messages

```jsx
<div role="alert" aria-live="assertive">
  {error}
</div>
```

### Progress Indicators

```jsx
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Upload progress"
>
  {progress}%
</div>
```

### Tabs

```jsx
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'tab1'}
    aria-controls="panel1"
  >
    Tab 1
  </button>
</div>
<div role="tabpanel" id="panel1">
  {/* Panel content */}
</div>
```

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

---

## Accessibility Statement

Our HRMS application is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.

**Conformance Status:** WCAG 2.1 Level AA

**Feedback:** If you encounter any accessibility barriers, please contact us.
