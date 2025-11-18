const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0000] via-[#5b0000] to-[#d00000] px-4 py-12 text-white">
    {children}
  </div>
);

export default AuthLayout;
