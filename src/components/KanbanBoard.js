/**
 * Kanban Board Component
 * Drag and drop kanban board for workflow management
 */

import React, { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';

const KanbanBoard = ({
    columns: initialColumns = [],
    onColumnChange,
    onCardMove,
    onCardClick,
    className = '',
}) => {
    const [columns, setColumns] = useState(initialColumns);
    const [draggedCard, setDraggedCard] = useState(null);

    const handleDragStart = (e, card, columnId) => {
        setDraggedCard({ card, sourceColumnId: columnId });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetColumnId) => {
        e.preventDefault();

        if (!draggedCard) return;

        const { card, sourceColumnId } = draggedCard;

        if (sourceColumnId === targetColumnId) {
            setDraggedCard(null);
            return;
        }

        // Update columns
        const newColumns = columns.map((col) => {
            if (col.id === sourceColumnId) {
                return {
                    ...col,
                    cards: col.cards.filter((c) => c.id !== card.id),
                };
            }
            if (col.id === targetColumnId) {
                return {
                    ...col,
                    cards: [...col.cards, card],
                };
            }
            return col;
        });

        setColumns(newColumns);
        setDraggedCard(null);

        onCardMove?.(card, sourceColumnId, targetColumnId);
        onColumnChange?.(newColumns);
    };

    const Card = ({ card, columnId }) => (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, card, columnId)}
            onClick={() => onCardClick?.(card)}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {card.title}
                </h4>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>
            {card.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {card.description}
                </p>
            )}
            {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {card.labels.map((label, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}
            {card.assignee && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2">
                        {card.assignee.charAt(0).toUpperCase()}
                    </div>
                    {card.assignee}
                </div>
            )}
        </div>
    );

    const Column = ({ column }) => (
        <div className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        {column.title}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {column.cards.length}
                    </span>
                </div>
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                    <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                className="space-y-3 min-h-[200px]"
            >
                {column.cards.map((card) => (
                    <Card key={card.id} card={card} columnId={column.id} />
                ))}
                {column.cards.length === 0 && (
                    <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                        Drop cards here
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`overflow-x-auto ${className}`}>
            <div className="flex gap-4 pb-4">
                {columns.map((column) => (
                    <Column key={column.id} column={column} />
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;
