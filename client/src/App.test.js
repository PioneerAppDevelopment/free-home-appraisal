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

test('keeps the Learn More logo in the shared header position', () => {
  render(
    <MemoryRouter initialEntries={['/learn-more']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByAltText('FreeHomeAppraisal.com Logo').closest('.logo-container')).not.toBeNull();
});

test('keeps Learn More hero content below the shared navigation area', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/learn-more']}>
      <App />
    </MemoryRouter>
  );

  const heroContent = container.querySelector('.hero-header-content');

  expect(heroContent).not.toBeNull();
  expect(heroContent.querySelector('.logo-container')).not.toBeNull();
  expect(heroContent.querySelector('.main-menu')).not.toBeNull();
  expect(heroContent.querySelector('.left-window')).not.toBeNull();
});

test('renders the Contact form inside the shared Home-page hero', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/contact']}>
      <App />
    </MemoryRouter>
  );

  const contactHero = container.querySelector('.contact-page-hero');

  expect(contactHero).not.toBeNull();
  expect(contactHero.querySelector('.logo-container')).not.toBeNull();
  expect(contactHero.querySelector('.main-menu')).not.toBeNull();
  expect(contactHero.querySelector('.contact-form-card')).not.toBeNull();
});
