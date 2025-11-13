const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
    {children}
  </div>
);

export default AuthLayout;
