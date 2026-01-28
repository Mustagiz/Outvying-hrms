import { useState, useEffect, useCallback, useRef } from 'react';
import { showToast } from '../utils/toast';

// Auto-save hook for forms
export const useAutoSave = (data, saveFunction, options = {}) => {
    const {
        delay = 2000, // 2 seconds delay
        enabled = true,
        onSaveStart,
        onSaveSuccess,
        onSaveError,
    } = options;

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const timeoutRef = useRef(null);
    const previousDataRef = useRef(data);

    const save = useCallback(async () => {
        if (!enabled) return;

        try {
            setIsSaving(true);
            if (onSaveStart) onSaveStart();

            await saveFunction(data);

            setLastSaved(new Date());
            if (onSaveSuccess) onSaveSuccess();

            // Update previous data reference
            previousDataRef.current = data;
        } catch (error) {
            console.error('Auto-save error:', error);
            if (onSaveError) onSaveError(error);
            showToast.error('Failed to auto-save changes');
        } finally {
            setIsSaving(false);
        }
    }, [data, saveFunction, enabled, onSaveStart, onSaveSuccess, onSaveError]);

    useEffect(() => {
        if (!enabled) return;

        // Check if data has actually changed
        const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

        if (!hasChanged) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            save();
        }, delay);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, delay, enabled, save]);

    // Manual save function
    const saveNow = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        return save();
    }, [save]);

    return {
        isSaving,
        lastSaved,
        saveNow,
    };
};

export default useAutoSave;
