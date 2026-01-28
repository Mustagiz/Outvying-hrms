// Example test for toast utilities
import { render, screen } from '@testing-library/react';
import { showToast, ToastProvider } from '../toast';

describe('Toast Utilities', () => {
    const TestComponent = () => {
        return (
            <ToastProvider>
                <button onClick={() => showToast.success('Test message')}>
                    Show Toast
                </button>
            </ToastProvider>
        );
    };

    it('should render ToastProvider without crashing', () => {
        render(<TestComponent />);
        expect(screen.getByText('Show Toast')).toBeInTheDocument();
    });

    it('should have success toast method', () => {
        expect(typeof showToast.success).toBe('function');
    });

    it('should have error toast method', () => {
        expect(typeof showToast.error).toBe('function');
    });

    it('should have loading toast method', () => {
        expect(typeof showToast.loading).toBe('function');
    });

    it('should have promise toast method', () => {
        expect(typeof showToast.promise).toBe('function');
    });
});
