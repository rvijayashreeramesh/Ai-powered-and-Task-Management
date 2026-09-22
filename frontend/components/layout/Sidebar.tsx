'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  X, 
  Sparkles, 
  BarChart2, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const topNavigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  ];

  const bottomNavigation = [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const desktopWidth = isCollapsed ? 'w-20' : 'w-64';

  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
          isActive 
            ? 'bg-slate-100 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        } ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon 
          size={18} 
          className={`transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
        />
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out flex flex-col
        md:sticky md:top-0 md:h-screen md:translate-x-0 ${desktopWidth}
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}
      >
        {/* Collapse toggle (desktop only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-6 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-full w-7 h-7 items-center justify-center shadow-sm z-10 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo area */}
        <div className={`flex items-center h-16 border-b border-slate-100 ${isCollapsed ? 'justify-center px-0' : 'px-5 justify-between'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-sm text-white">
              <Sparkles size={16} className="text-white" />
            </div>
            {!isCollapsed && <span className="text-slate-900 text-[15px] font-bold tracking-tight">TaskFlow AI</span>}
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-6 px-3">
          <nav className="flex flex-col space-y-1">
            {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overview</h3>}
            {topNavigation.map((item) => <NavItem key={item.name} item={item} />)}
          </nav>

          <div className="h-px bg-slate-100 mx-3"></div>

          <nav className="flex flex-col space-y-1">
            {!isCollapsed && <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System</h3>}
            {bottomNavigation.map((item) => <NavItem key={item.name} item={item} />)}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group`}>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-medium text-sm shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">Online</p>
              </div>
            )}
            {!isCollapsed && (
              <Settings size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
