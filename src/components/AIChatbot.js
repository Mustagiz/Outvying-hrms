/**
 * AI HR Assistant Chatbot Component
 * A floating chatbot interface for employees
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, CornerDownRight } from 'lucide-react';
import { processQuery } from '../utils/aiAssistant';
import { motion, AnimatePresence } from 'framer-motion';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Hi! I am your AI HR Assistant. How can I help you today?', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = {
            id: Date.now(),
            type: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI "thinking"
        setTimeout(() => {
            const aiResponse = processQuery(input);
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: aiResponse.text,
                action: aiResponse.action,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[999]">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600'
                    } text-white`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="absolute bottom-20 right-0 w-[380px] h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-blue-600 p-4 text-white flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold">HR Assistant</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    AI Powered • Online
                                </p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${msg.type === 'user' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-white dark:bg-gray-800'
                                            }`}>
                                            {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${msg.type === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                            {msg.action && (
                                                <button className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-500 hover:underline">
                                                    <CornerDownRight size={12} />
                                                    {msg.action}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-2 rounded-xl">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={handleSend}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIChatbot;
