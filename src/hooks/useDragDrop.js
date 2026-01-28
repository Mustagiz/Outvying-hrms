/**
 * Drag and Drop Hook
 * Provides drag and drop functionality for lists and components
 */

import { useState, useRef } from 'react';

export const useDragDrop = (initialItems = [], onReorder) => {
    const [items, setItems] = useState(initialItems);
    const [draggedItem, setDraggedItem] = useState(null);
    const [draggedOverItem, setDraggedOverItem] = useState(null);
    const dragCounter = useRef(0);

    const handleDragStart = (e, item, index) => {
        setDraggedItem({ item, index });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target);
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault();
        dragCounter.current++;
        setDraggedOverItem(index);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDraggedOverItem(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        dragCounter.current = 0;

        if (draggedItem === null) return;

        const newItems = [...items];
        const draggedItemContent = newItems[draggedItem.index];

        // Remove from old position
        newItems.splice(draggedItem.index, 1);

        // Insert at new position
        newItems.splice(dropIndex, 0, draggedItemContent);

        setItems(newItems);
        setDraggedItem(null);
        setDraggedOverItem(null);

        onReorder?.(newItems);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDraggedOverItem(null);
        dragCounter.current = 0;
    };

    return {
        items,
        setItems,
        draggedItem,
        draggedOverItem,
        handlers: {
            onDragStart: handleDragStart,
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            onDragOver: handleDragOver,
            onDrop: handleDrop,
            onDragEnd: handleDragEnd,
        },
    };
};

export default useDragDrop;
