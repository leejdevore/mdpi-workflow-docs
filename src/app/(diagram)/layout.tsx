import { Header } from '@/components/layout/Header';

export default function DiagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Draw Process Workflow"
        subtitle="Real Estate Development - 70 S. Orange"
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
