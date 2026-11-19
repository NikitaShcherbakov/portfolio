import { Component, type ReactNode } from 'react';

import { FeatureFallback } from './feature-fallback';

type FeatureBoundaryProps = {
  children: ReactNode;
};

type FeatureBoundaryState = {
  hasError: boolean;
};

export class FeatureBoundary extends Component<
  FeatureBoundaryProps,
  FeatureBoundaryState
> {
  override state: FeatureBoundaryState = { hasError: false };

  static getDerivedStateFromError(): FeatureBoundaryState {
    return { hasError: true };
  }

  override render() {
    return this.state.hasError ? <FeatureFallback /> : this.props.children;
  }
}
