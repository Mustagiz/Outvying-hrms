# Testing Guide

## Overview
This project uses Jest and React Testing Library for unit and integration testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- validation.test.js
```

## Writing Tests

### Unit Tests

Test individual functions and utilities:

```javascript
import { validateData, employeeSchema } from '../validation';

describe('Validation', () => {
  it('should validate correct data', () => {
    const data = { /* valid data */ };
    const result = validateData(employeeSchema, data);
    
    expect(result.success).toBe(true);
  });
});
```

### Component Tests

Test React components:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  
  it('should handle click events', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));
    // Assert expected behavior
  });
});
```

### Integration Tests

Test component interactions:

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Form Integration', () => {
  it('should submit form data', async () => {
    const onSubmit = jest.fn();
    render(<MyForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
    });
  });
});
```

## Best Practices

### 1. Test Behavior, Not Implementation
Focus on what the component does, not how it does it.

### 2. Use Semantic Queries
Prefer `getByRole`, `getByLabelText` over `getByTestId`.

### 3. Avoid Testing Implementation Details
Don't test state, props, or internal methods directly.

### 4. Mock External Dependencies
Mock Firebase, API calls, and third-party libraries.

### 5. Keep Tests Simple
One assertion per test when possible.

### 6. Use Descriptive Test Names
```javascript
it('should display error message when email is invalid', () => {
  // test code
});
```

## Coverage Goals
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Mocking

### Mock Firebase
```javascript
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {},
}));
```

### Mock API Calls
```javascript
jest.mock('../services/api', () => ({
  employeeService: {
    getAll: jest.fn(() => Promise.resolve([])),
  },
}));
```

### Mock React Router
```javascript
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};
```

## Common Testing Patterns

### Testing Async Operations
```javascript
it('should load data', async () => {
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing Forms
```javascript
it('should validate form', async () => {
  render(<MyForm />);
  
  const input = screen.getByLabelText('Email');
  await userEvent.type(input, 'invalid');
  
  expect(screen.getByText('Invalid email')).toBeInTheDocument();
});
```

### Testing Modals
```javascript
it('should open and close modal', async () => {
  render(<MyModal />);
  
  await userEvent.click(screen.getByText('Open'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  
  await userEvent.click(screen.getByText('Close'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

## Debugging Tests

### View DOM
```javascript
import { screen } from '@testing-library/react';

screen.debug(); // Print entire DOM
screen.debug(screen.getByRole('button')); // Print specific element
```

### Check Available Queries
```javascript
screen.logTestingPlaygroundURL();
```

## CI/CD Integration

Tests run automatically on:
- Pre-commit (via husky)
- Pull requests
- Main branch pushes

## Resources
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
