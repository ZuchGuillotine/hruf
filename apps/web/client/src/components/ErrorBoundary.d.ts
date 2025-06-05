import { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}
export declare class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props);
  static getDerivedStateFromError(error: Error): State;
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
  render(): ReactNode;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map
