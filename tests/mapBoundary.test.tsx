import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';

function BrokenMap(): never {
  throw new Error('Mapbox token is missing');
}

describe('MapErrorBoundary', () => {
  it('renders a quiet placeholder instead of crashing the page', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <MapErrorBoundary>
        <BrokenMap />
      </MapErrorBoundary>,
    );
    expect(container.querySelector('.bg-black')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
