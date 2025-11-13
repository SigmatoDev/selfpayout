import Sidebar from '../../components/sidebar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-slate-50 text-slate-900">
    <Sidebar />
    <main className="flex-1 p-8">{children}</main>
  </div>
);

export default DashboardLayout;
