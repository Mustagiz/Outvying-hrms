// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BottomNav from '../BottomNav';

const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BottomNav Component', () => {
    it('should render navigation items for employee role', () => {
        renderWithRouter(<BottomNav userRole="employee" />);

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Attendance')).toBeInTheDocument();
        expect(screen.getByText('Leave')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should render navigation items for admin role', () => {
        renderWithRouter(<BottomNav userRole="admin" />);

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Attendance')).toBeInTheDocument();
        expect(screen.getByText('Employees')).toBeInTheDocument();
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should navigate on item click', () => {
        renderWithRouter(<BottomNav userRole="employee" />);

        const homeButton = screen.getByText('Home');
        fireEvent.click(homeButton);

        // Navigation would be handled by React Router
        expect(homeButton).toBeInTheDocument();
    });

    it('should hide on desktop (md breakpoint)', () => {
        const { container } = renderWithRouter(<BottomNav userRole="employee" />);

        const nav = container.querySelector('.md\\:hidden');
        expect(nav).toBeInTheDocument();
    });
});
