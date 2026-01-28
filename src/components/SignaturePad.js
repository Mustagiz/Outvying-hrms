/**
 * Signature Pad Component
 * Provides a canvas for capturing digital signatures
 */

import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Check, MousePointer2 } from 'lucide-react';

const SignaturePad = ({ onSave, onClear }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Handle High DPI displays
        const ratio = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.scale(ratio, ratio);

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#2563eb'; // blue-600
    }, []);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        setHasContent(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        if (e.touches && e.touches[0]) {
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        onClear?.();
    };

    const save = () => {
        if (!hasContent) return;
        const dataURL = canvasRef.current.toDataURL('image/png');
        onSave?.(dataURL);
    };

    return (
        <div className="space-y-4">
            <div className="relative h-64 w-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-inner">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                />
                {!hasContent && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                        <MousePointer2 size={48} className="text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-400">Sign here using mouse or touch</p>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={clear}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    <Eraser size={18} />
                    Clear
                </button>
                <button
                    onClick={save}
                    disabled={!hasContent}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${hasContent
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <Check size={18} />
                    Confirm Signature
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
