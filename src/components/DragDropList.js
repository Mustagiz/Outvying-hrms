/**
 * Drag and Drop List Component
 * Sortable list with drag and drop functionality
 */

import React from 'react';
import { GripVertical } from 'lucide-react';
import useDragDrop from '../hooks/useDragDrop';

const DragDropList = ({
    items: initialItems = [],
    onReorder,
    renderItem,
    className = '',
    itemClassName = '',
}) => {
    const { items, draggedItem, draggedOverItem, handlers } = useDragDrop(initialItems, onReorder);

    return (
        <div className={`space-y-2 ${className}`}>
            {items.map((item, index) => {
                const isDragging = draggedItem?.index === index;
                const isDraggedOver = draggedOverItem === index;

                return (
                    <div
                        key={item.id || index}
                        draggable
                        onDragStart={(e) => handlers.onDragStart(e, item, index)}
                        onDragEnter={(e) => handlers.onDragEnter(e, index)}
                        onDragLeave={handlers.onDragLeave}
                        onDragOver={handlers.onDragOver}
                        onDrop={(e) => handlers.onDrop(e, index)}
                        onDragEnd={handlers.onDragEnd}
                        className={`
              flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
              transition-all duration-200 cursor-move
              ${isDragging ? 'opacity-50 scale-95' : ''}
              ${isDraggedOver ? 'border-blue-500 dark:border-blue-400 shadow-lg' : ''}
              hover:shadow-md
              ${itemClassName}
            `}
                    >
                        <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                            {renderItem ? renderItem(item, index) : (
                                <div className="text-gray-900 dark:text-white">{item.label || item.name || item.title}</div>
                            )}
                        </div>
                    </div>
                );
            })}
            {items.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No items to display
                </div>
            )}
        </div>
    );
};

export default DragDropList;
