'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface MapErrorBoundaryProps {
  children: ReactNode;
}

interface MapErrorBoundaryState {
  failed: boolean;
}

/**
 * Mapbox throws when its token is missing or invalid. Keep that failure local
 * so the rest of the landing page, including LUMEN, remains interactive.
 */
export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Mapbox failed to initialize; continuing without the map.', error, info);
  }

  render() {
    if (this.state.failed) {
      return <div className="h-full w-full bg-black" aria-hidden="true" />;
    }
    return this.props.children;
  }
}

export default MapErrorBoundary;
