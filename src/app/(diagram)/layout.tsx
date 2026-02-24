import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export default function DiagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkflowProvider>
      <ErrorBoundary>
        <div className="flex h-screen">
          {children}
        </div>
      </ErrorBoundary>
    </WorkflowProvider>
  );
}
