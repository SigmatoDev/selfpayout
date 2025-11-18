import Sidebar from '../../components/sidebar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-[#fff3f3] via-[#ffe1e1] to-[#ffd0d0] px-4 py-6 text-[color:var(--foreground)]">
    <div className="mx-auto flex w-full px-3 flex-col gap-6 lg:flex-row">
      <Sidebar />
      <main className="flex-1 rounded-[20px] bg-white/90 p-8 shadow-[0_40px_120px_rgba(208,0,0,0.15)] backdrop-blur">
        {children}
      </main>
    </div>
  </div>
);

export default DashboardLayout;
