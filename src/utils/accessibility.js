// Accessibility utilities and helpers

// Focus management
export const focusManagement = {
    // Trap focus within an element
    trapFocus: (element) => {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        element.addEventListener('keydown', handleTabKey);

        // Return cleanup function
        return () => {
            element.removeEventListener('keydown', handleTabKey);
        };
    },

    // Focus first element
    focusFirst: (element) => {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    },

    // Return focus to previous element
    returnFocus: (previousElement) => {
        if (previousElement && previousElement.focus) {
            previousElement.focus();
        }
    },
};

// ARIA announcements
export const announce = {
    // Create live region for announcements
    createLiveRegion: () => {
        if (document.getElementById('aria-live-region')) {
            return;
        }

        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    },

    // Announce message to screen readers
    message: (message, priority = 'polite') => {
        announce.createLiveRegion();
        const liveRegion = document.getElementById('aria-live-region');

        if (liveRegion) {
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;

            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    },

    // Announce error
    error: (message) => {
        announce.message(message, 'assertive');
    },

    // Announce success
    success: (message) => {
        announce.message(message, 'polite');
    },
};

// Keyboard navigation helpers
export const keyboard = {
    // Check if key is navigation key
    isNavigationKey: (key) => {
        return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key);
    },

    // Handle arrow key navigation in list
    handleListNavigation: (event, items, currentIndex, onSelect) => {
        const { key } = event;
        let newIndex = currentIndex;

        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                newIndex = Math.min(currentIndex + 1, items.length - 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = items.length - 1;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (onSelect) {
                    onSelect(items[currentIndex]);
                }
                return currentIndex;
            default:
                return currentIndex;
        }

        return newIndex;
    },
};

// Color contrast checker
export const contrast = {
    // Calculate relative luminance
    getLuminance: (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map((c) => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    },

    // Calculate contrast ratio
    getContrastRatio: (color1, color2) => {
        const l1 = contrast.getLuminance(...color1);
        const l2 = contrast.getLuminance(...color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    },

    // Check if contrast meets WCAG AA standards
    meetsWCAG_AA: (color1, color2, isLargeText = false) => {
        const ratio = contrast.getContrastRatio(color1, color2);
        return isLargeText ? ratio >= 3 : ratio >= 4.5;
    },

    // Check if contrast meets WCAG AAA standards
    meetsWCAG_AAA: (color1, color2, isLargeText = false) => {
        const ratio = contrast.getContrastRatio(color1, color2);
        return isLargeText ? ratio >= 4.5 : ratio >= 7;
    },
};

// Screen reader utilities
export const screenReader = {
    // Check if screen reader is likely active
    isScreenReaderActive: () => {
        return (
            window.navigator.userAgent.includes('NVDA') ||
            window.navigator.userAgent.includes('JAWS') ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
    },

    // Add screen reader only text
    addSROnlyText: (text) => {
        const span = document.createElement('span');
        span.className = 'sr-only';
        span.textContent = text;
        return span;
    },
};

// Skip links
export const skipLinks = {
    // Create skip to main content link
    createSkipLink: () => {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    `;

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '0';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    },
};

export default {
    focusManagement,
    announce,
    keyboard,
    contrast,
    screenReader,
    skipLinks,
};
