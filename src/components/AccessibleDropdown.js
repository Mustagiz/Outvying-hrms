import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { keyboard, announce } from '../utils/accessibility';

const AccessibleDropdown = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    disabled = false,
    error = '',
    required = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                setIsOpen(!isOpen);
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                buttonRef.current?.focus();
                break;
            case 'ArrowDown':
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    const newIndex = keyboard.handleListNavigation(
                        e,
                        options,
                        focusedIndex,
                        null
                    );
                    setFocusedIndex(newIndex);
                }
                break;
            default:
                break;
        }
    };

    const handleOptionClick = (option) => {
        onChange(option.value);
        setIsOpen(false);
        buttonRef.current?.focus();
        announce.message(`${option.label} selected`);
    };

    const handleOptionKeyDown = (e, option, index) => {
        const newIndex = keyboard.handleListNavigation(
            e,
            options,
            index,
            handleOptionClick
        );
        setFocusedIndex(newIndex);
    };

    return (
        <div ref={dropdownRef} className="relative">
            {label && (
                <label
                    id={`dropdown-label-${label}`}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                    {label}
                    {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={label ? `dropdown-label-${label}` : undefined}
                aria-label={!label ? placeholder : undefined}
                aria-required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `dropdown-error-${label}` : undefined}
                className={`
          w-full flex items-center justify-between px-4 py-2 text-left
          bg-white dark:bg-gray-800 border rounded-lg
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:border-transparent'}
          transition-colors
        `}
            >
                <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                />
            </button>

            {error && (
                <p
                    id={`dropdown-error-${label}`}
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {isOpen && (
                <ul
                    role="listbox"
                    aria-labelledby={label ? `dropdown-label-${label}` : undefined}
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                    {options.map((option, index) => (
                        <li
                            key={option.value}
                            role="option"
                            aria-selected={option.value === value}
                            tabIndex={0}
                            onClick={() => handleOptionClick(option)}
                            onKeyDown={(e) => handleOptionKeyDown(e, option, index)}
                            className={`
                px-4 py-2 cursor-pointer
                ${option.value === value ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'}
                ${focusedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''}
                hover:bg-gray-100 dark:hover:bg-gray-700
                focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none
              `}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AccessibleDropdown;
