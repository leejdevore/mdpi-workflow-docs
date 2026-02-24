import { WorkflowProvider } from '@/contexts/WorkflowContext';

export default function DiagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkflowProvider>
      <div className="flex h-screen">
        {children}
      </div>
    </WorkflowProvider>
  );
}
