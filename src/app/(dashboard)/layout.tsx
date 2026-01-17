import { Navbar } from '@/components/layout/navbar';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
