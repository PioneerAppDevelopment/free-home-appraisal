import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./services/usageApi', () => ({
  trackPageVisit: jest.fn(),
}));

jest.mock('html2canvas', () => jest.fn());

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(),
}));

test('renders the home estimate copy', () => {
  window.google = {
    maps: {
      places: {
        Autocomplete: class {
          addListener() {}
        },
        AutocompleteService: class {},
      },
    },
  };

  const { getByText } = render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <App />
    </MemoryRouter>
  );

  expect(getByText(/get a free home value estimate/i)).toBeInTheDocument();
  expect(getByText(/estimated values from dozens of real estate websites/i)).toBeInTheDocument();
});
