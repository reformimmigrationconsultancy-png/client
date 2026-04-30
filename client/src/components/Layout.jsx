import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex bg-slate-50 items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <div className="w-64 flex-shrink-0 hidden md:flex flex-col border-r shadow-sm">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Placeholder (mobile) */}
        <div className="md:hidden flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">Manpreet</h1>
        </div>

        {/* Outlet Area - Fixed to remaining space */}
        <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
