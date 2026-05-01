import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { translations } from '../translations';
import { 
  LayoutDashboard, 
  History, 
  Briefcase, 
  Settings as SettingsIcon, 
  BarChart3, 
  Calendar as CalendarIcon,
  Layers,
  User,
  LogOut,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TabType } from '../types';

const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, settings } = useApp();
  const { user, logout } = useAuth();
  const t = translations[settings.language];

  const navItems = ([
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={20} /> },
    { id: 'register', label: t.register, icon: <History size={20} /> },
    { id: 'projects', label: t.projects, icon: <Briefcase size={20} /> },
    { id: 'clients', label: t.clients, icon: <Users size={20} /> },
    { id: 'core-tasks', label: t.coreTasks, icon: <Layers size={20} /> },
    { id: 'calendar', label: t.calendar, icon: <CalendarIcon size={20} /> },
    { id: 'reports', label: t.reports, icon: <BarChart3 size={20} /> },
    { id: 'settings', label: t.settings, icon: <SettingsIcon size={20} /> },
  ] as { id: TabType; label: string; icon: React.ReactNode }[]).filter(item => item.id !== 'core-tasks' || settings.useCoreTasks);

  return (
    <aside className={cn(
      "w-64 border-r flex flex-col pt-8 h-screen sticky top-0 transition-colors duration-300",
      settings.theme === 'light' ? "bg-white border-slate-200 shadow-sm" : "bg-slate-950 border-slate-800"
    )}>
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center font-bold text-white">75</div>
        <span className={cn(
          "text-xl font-semibold tracking-tight uppercase italic",
          settings.theme === 'light' ? "text-slate-900" : "text-white"
        )}>75TimeTrackPro</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer text-sm font-medium",
              activeTab === item.id
                ? "bg-sky-500/10 border-l-2 border-sky-400 text-sky-400 font-bold"
                : settings.theme === 'light'
                  ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className={cn(
        "p-6 border-t space-y-4",
        settings.theme === 'light' ? "border-slate-100" : "border-slate-800"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden shadow-inner",
            settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-sky-500" : "bg-slate-800 border-slate-700 text-slate-400"
          )}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="overflow-hidden">
            <p className={cn(
              "text-sm font-medium truncate",
              settings.theme === 'light' ? "text-slate-900" : "text-white"
            )}>{user?.displayName || (user?.email ? user.email.split('@')[0] : 'Gebruiker')}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold truncate">{user?.email}</p>
          </div>
        </div>

        <button 
          onClick={() => logout()}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-xl transition-all text-xs font-black uppercase tracking-widest",
            settings.theme === 'light'
              ? "bg-sky-50 hover:bg-red-50 text-sky-600 hover:text-red-500 border-sky-100 hover:border-red-200"
              : "bg-slate-900 hover:bg-red-500/10 text-slate-500 hover:text-red-500 border-slate-800 hover:border-red-500/20"
          )}
        >
          <LogOut size={14} strokeWidth={3} />
          Uitloggen
        </button>
      </div>
    </aside>
  );
};

export default Navigation;
