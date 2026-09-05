import React from 'react';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./services/usageApi', () => ({
  trackPageVisit: jest.fn(),
}));

jest.mock('html2canvas', () => jest.fn());

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(),
}));

jest.mock('google-map-react', () => ({ children }) => <div>{children}</div>);

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

test('clears estimate results when returning home from navigation', () => {
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

  const appRef = React.createRef();
  render(
    <MemoryRouter
      initialEntries={['/estimates']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <App ref={appRef} />
    </MemoryRouter>
  );

  act(() => {
    appRef.current.setState({
      foundHome: {
        street_address: '195 San Juan Dr',
        city: 'Hauppauge',
        state: 'NY',
        zip_code: '11788',
        lat: 40.8,
        long: -73.2
      }
    });
  });

  expect(screen.getByText(/195 San Juan Dr/i)).toBeInTheDocument();
  fireEvent.click(screen.getAllByText('HOME')[0]);
  expect(screen.queryByText(/195 San Juan Dr/i)).not.toBeInTheDocument();
  expect(screen.getByText(/get a free home value estimate/i)).toBeInTheDocument();
});
