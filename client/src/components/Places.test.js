import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Places from './Places';

beforeEach(() => {
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
});

test('submits the entered address when Search is clicked', () => {
  const search = jest.fn();
  render(<Places search={search} />);

  fireEvent.change(screen.getByPlaceholderText('Enter your address'), {
    target: { value: '10 Main St, New York, NY 10001' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(search).toHaveBeenCalledWith({
    address: '10 Main St, New York, NY 10001',
    lat: 40.7128,
    long: -74.0060,
  });
});
