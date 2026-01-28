// Animation utilities using Framer Motion

export const animations = {
    // Fade in animation
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
    },

    // Slide in from bottom
    slideInBottom: {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 20, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
    },

    // Slide in from top
    slideInTop: {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -20, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
    },

    // Slide in from left
    slideInLeft: {
        initial: { x: -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
    },

    // Slide in from right
    slideInRight: {
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
    },

    // Scale in
    scaleIn: {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
        transition: { duration: 0.2, ease: 'easeOut' },
    },

    // Bounce in
    bounceIn: {
        initial: { scale: 0 },
        animate: { scale: 1 },
        exit: { scale: 0 },
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
        },
    },

    // Stagger children
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    },

    // List item animation
    listItem: {
        initial: { x: -10, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.2 },
    },

    // Card hover
    cardHover: {
        whileHover: {
            scale: 1.02,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            transition: { duration: 0.2 },
        },
        whileTap: { scale: 0.98 },
    },

    // Button press
    buttonPress: {
        whileTap: { scale: 0.95 },
        transition: { duration: 0.1 },
    },

    // Rotate
    rotate: {
        animate: { rotate: 360 },
        transition: { duration: 1, repeat: Infinity, ease: 'linear' },
    },

    // Pulse
    pulse: {
        animate: {
            scale: [1, 1.05, 1],
        },
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },

    // Shake
    shake: {
        animate: {
            x: [0, -10, 10, -10, 10, 0],
        },
        transition: {
            duration: 0.5,
        },
    },

    // Modal backdrop
    modalBackdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
    },

    // Modal content
    modalContent: {
        initial: { scale: 0.9, opacity: 0, y: 20 },
        animate: { scale: 1, opacity: 1, y: 0 },
        exit: { scale: 0.9, opacity: 0, y: 20 },
        transition: { duration: 0.3, ease: 'easeOut' },
    },

    // Notification slide in
    notification: {
        initial: { x: 400, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 400, opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
    },

    // Page transition
    pageTransition: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
        transition: { duration: 0.3 },
    },

    // Collapse/Expand
    collapse: {
        initial: { height: 0, opacity: 0 },
        animate: { height: 'auto', opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.3 },
    },

    // Loading spinner
    spinner: {
        animate: {
            rotate: 360,
        },
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
        },
    },

    // Progress bar
    progressBar: (progress) => ({
        initial: { width: 0 },
        animate: { width: `${progress}%` },
        transition: { duration: 0.5, ease: 'easeOut' },
    }),

    // Number counter
    counter: (value) => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
    }),
};

// Preset animation combinations
export const presets = {
    // Card entrance
    cardEntrance: {
        ...animations.slideInBottom,
        ...animations.cardHover,
    },

    // Button interaction
    button: {
        ...animations.scaleIn,
        ...animations.buttonPress,
    },

    // Modal
    modal: {
        backdrop: animations.modalBackdrop,
        content: animations.modalContent,
    },

    // List with stagger
    list: {
        container: animations.staggerContainer,
        item: animations.listItem,
    },
};

export default animations;
