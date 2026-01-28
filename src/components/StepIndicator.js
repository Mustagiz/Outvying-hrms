import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const steps = [
    { id: 1, name: 'Personal Info', description: 'Basic details' },
    { id: 2, name: 'Employment', description: 'Job information' },
    { id: 3, name: 'Documents', description: 'Upload files' },
    { id: 4, name: 'Review', description: 'Confirm details' },
];

const StepIndicator = ({ currentStep, steps }) => {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    const isUpcoming = currentStep < step.id;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step */}
                            <div className="flex flex-col items-center relative">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                                            ? 'bg-primary-600 border-primary-600'
                                            : isCurrent
                                                ? 'bg-white dark:bg-gray-800 border-primary-600'
                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-6 h-6 text-white" />
                                    ) : (
                                        <span
                                            className={`text-sm font-semibold ${isCurrent
                                                    ? 'text-primary-600'
                                                    : 'text-gray-400 dark:text-gray-500'
                                                }`}
                                        >
                                            {step.id}
                                        </span>
                                    )}
                                </motion.div>

                                <div className="mt-2 text-center">
                                    <p
                                        className={`text-sm font-medium ${isCurrent
                                                ? 'text-gray-900 dark:text-white'
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {step.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="flex-1 px-4">
                                    <div className="h-0.5 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                        <motion.div
                                            initial={{ width: '0%' }}
                                            animate={{
                                                width: isCompleted ? '100%' : '0%',
                                            }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="h-full bg-primary-600 absolute top-0 left-0"
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
