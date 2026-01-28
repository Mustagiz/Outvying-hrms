/**
 * Virtual Orientation / Onboarding Journey
 * Immersive experience for remote-first employees
 */

import React, { useState } from 'react';
import {
    Play,
    CheckCircle2,
    ArrowRight,
    Video,
    MapPin,
    Compass,
    Coffee,
    Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VirtualOnboarding = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const steps = [
        {
            id: 0,
            title: 'Welcome to the Team!',
            desc: "A personal message from our CEO about our vision and where you fit in.",
            videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            icon: Compass,
            tasks: ['Watch welcome video', 'Read Mission Statement']
        },
        {
            id: 1,
            title: 'Our Culture & Values',
            desc: "How we work, how we communicate, and how we celebrate.",
            videoUrl: '',
            icon: Coffee,
            tasks: ['Join Slack channels', 'Set up profile picture']
        },
        {
            id: 2,
            title: 'Tools of the Trade',
            desc: "Deep dive into our internal tech stack and development workflows.",
            videoUrl: '',
            icon: Headphones,
            tasks: ['Login to GitHub', 'Environment setup']
        },
        {
            id: 3,
            title: 'Your First Project',
            desc: "Understand your day 1 goals and meet your onboarding buddy.",
            videoUrl: '',
            icon: MapPin,
            tasks: ['First 1:1 with manager', 'Review project board']
        }
    ];

    const currentStep = steps[activeStep];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="text-center space-y-4 pt-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest"
                >
                    <Video size={14} />
                    Day 1 Journey
                </motion.div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white">Your Immersive Orientation</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">We're so glad you're here. Follow this journey to get acquainted with the tools, the people, and the mission of Outvying.</p>
            </div>

            {/* Progression Bar */}
            <div className="flex gap-2 max-w-3xl mx-auto px-4">
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className="flex-1 space-y-2"
                    >
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= activeStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tighter block text-center ${i === activeStep ? 'text-blue-600' : 'text-gray-400'}`}>
                            {step.title.split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Content (Video/Modules) */}
                <div className="lg:col-span-3 space-y-6">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-900 rounded-[2.5rem] aspect-video relative overflow-hidden group shadow-2xl"
                    >
                        {isPlaying ? (
                            <iframe
                                className="w-full h-full"
                                src="about:blank"
                                title="Onboarding Video"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-gradient-to-t from-black/80 to-transparent">
                                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform cursor-pointer" onClick={() => setIsPlaying(true)}>
                                    <Play size={32} fill="currentColor" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h2>
                                <p className="text-gray-400 text-sm max-w-md">{currentStep.desc}</p>
                            </div>
                        )}
                    </motion.div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">What is this session about?</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {currentStep.desc} This module is designed to give you a deep dive into {currentStep.title.toLowerCase()}.
                            Take your time to explore the resources and check off the tasks on the right once you're done.
                        </p>
                    </div>
                </div>

                {/* Sidebar (Checklist & Navigation) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">Session Tasks</h4>
                        <div className="space-y-4">
                            {currentStep.tasks.map((task, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-6 h-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-white group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                                        <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-100 group-hover:text-blue-500" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">{task}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            disabled={activeStep === 0}
                            onClick={() => { setActiveStep(prev => prev - 1); setIsPlaying(false); }}
                            className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-gray-600 dark:text-gray-400 disabled:opacity-30"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => {
                                if (activeStep < steps.length - 1) {
                                    setActiveStep(prev => prev + 1);
                                    setIsPlaying(false);
                                } else {
                                    alert("Congratulations! Journey Complete.");
                                }
                            }}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                        >
                            {activeStep === steps.length - 1 ? 'Finish Journey' : 'Next Session'}
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* Fun Suggestion */}
                    <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <Coffee size={24} />
                            <h5 className="font-bold">Pro Tip</h5>
                        </div>
                        <p className="text-xs text-indigo-50/80 leading-relaxed mb-4">
                            Don't forget to grab a cup of coffee and introduce yourself in the #general-welcome channel on Slack!
                        </p>
                        <button className="text-[10px] uppercase font-black bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                            Open Slack
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualOnboarding;
