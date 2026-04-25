import { Navbar } from '@/components/layout/navbar';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
}
