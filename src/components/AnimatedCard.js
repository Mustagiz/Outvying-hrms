import React from 'react';
import { motion } from 'framer-motion';
import { animations } from '../utils/animations';

const AnimatedCard = ({ children, className = '', delay = 0, ...props }) => {
    return (
        <motion.div
            initial={animations.slideInBottom.initial}
            animate={animations.slideInBottom.animate}
            exit={animations.slideInBottom.exit}
            whileHover={animations.cardHover.whileHover}
            whileTap={animations.cardHover.whileTap}
            transition={{
                ...animations.slideInBottom.transition,
                delay,
            }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedCard;
