import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

// Pull to refresh component for mobile
export const PullToRefresh = ({ onRefresh, children, threshold = 80 }) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);

    const handleTouchStart = (e) => {
        // Only trigger if at top of page
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e) => {
        if (startY === 0 || window.scrollY > 0) return;

        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;

        if (distance > 0 && distance < threshold * 2) {
            setPullDistance(distance);

            // Prevent default scroll behavior when pulling
            if (distance > 10) {
                e.preventDefault();
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh error:', error);
            } finally {
                setIsRefreshing(false);
            }
        }

        setPullDistance(0);
        setStartY(0);
    };

    const pullProgress = Math.min((pullDistance / threshold) * 100, 100);
    const showRefreshIndicator = pullDistance > 0 || isRefreshing;

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
        >
            {/* Refresh indicator */}
            {showRefreshIndicator && (
                <div
                    className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50"
                    style={{
                        height: `${Math.min(pullDistance, threshold)}px`,
                        opacity: pullProgress / 100,
                    }}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                        <RefreshCw
                            className={`w-6 h-6 text-primary-600 dark:text-primary-400 ${isRefreshing ? 'animate-spin' : ''
                                }`}
                            style={{
                                transform: `rotate(${pullProgress * 3.6}deg)`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance > 0 ? Math.min(pullDistance / 2, threshold / 2) : 0}px)`,
                    transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
