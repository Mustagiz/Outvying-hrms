import { useEffect, useCallback, useRef } from 'react';

// Keyboard shortcuts hook
export const useKeyboardShortcuts = (shortcuts) => {
    const shortcutsRef = useRef(shortcuts);

    // Update ref when shortcuts change
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    const handleKeyDown = useCallback((event) => {
        const shortcuts = shortcutsRef.current;

        // Check each shortcut
        for (const shortcut of shortcuts) {
            const {
                key,
                ctrl = false,
                shift = false,
                alt = false,
                meta = false,
                callback,
                preventDefault = true,
            } = shortcut;

            // Check if all modifiers match
            const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
            const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
            const altMatch = alt ? event.altKey : !event.altKey;
            const metaMatch = meta ? event.metaKey : !event.metaKey;

            // Check if key matches (case-insensitive)
            const keyMatch = event.key.toLowerCase() === key.toLowerCase();

            if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
                if (preventDefault) {
                    event.preventDefault();
                }
                callback(event);
                break;
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};

// Pre-defined keyboard shortcuts
export const commonShortcuts = {
    save: {
        key: 's',
        ctrl: true,
        description: 'Save',
    },
    search: {
        key: 'k',
        ctrl: true,
        description: 'Search',
    },
    newItem: {
        key: 'n',
        ctrl: true,
        description: 'New Item',
    },
    delete: {
        key: 'Delete',
        description: 'Delete',
    },
    escape: {
        key: 'Escape',
        description: 'Close/Cancel',
    },
    refresh: {
        key: 'r',
        ctrl: true,
        description: 'Refresh',
    },
    help: {
        key: '?',
        shift: true,
        description: 'Help',
    },
    selectAll: {
        key: 'a',
        ctrl: true,
        description: 'Select All',
    },
};

export default useKeyboardShortcuts;
