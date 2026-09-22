'use client';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, User as UserIcon, Search, Bell, Sparkles } from 'lucide-react';

export const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/tasks')) return 'Tasks';
    if (pathname.startsWith('/ai-assistant')) return 'AI Assistant';
    if (pathname.startsWith('/analytics')) return 'Analytics';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/profile')) return 'Profile';
    return 'Dashboard';
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 transition-all duration-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 gap-4">
        
        {/* Left: Mobile Menu & Breadcrumb */}
        <div className="flex items-center gap-3 md:gap-0 flex-1 md:flex-none">
          <button 
            type="button" 
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={onMenuClick}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search tasks, projects, or ask AI..." 
              className="w-full bg-slate-100/50 border border-transparent rounded-lg pl-9 pr-4 py-1.5 text-sm placeholder:text-slate-500 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
          <button className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Sparkles size={18} />
          </button>
          
          <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1"></div>
          
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-medium text-sm group-hover:ring-2 group-hover:ring-indigo-500/20 transition-all">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
