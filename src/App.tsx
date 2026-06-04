/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { translations } from './translations';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TimeRegister from './components/TimeRegister';
import Projects from './components/Projects';
import Clients from './components/Clients';
import CoreTasks from './components/CoreTasks';
import Calendar from './components/Calendar';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

const AppContent: React.FC = () => {
  const { activeTab, settings } = useApp();
  const { user } = useAuth();
  const t = translations[settings.language];

  if (!user) {
    return <Login />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'register': return <TimeRegister />;
      case 'projects': return <Projects />;
      case 'clients': return <Clients />;
      case 'core-tasks': return settings.useCoreTasks ? <CoreTasks /> : <Dashboard />;
      case 'calendar': return <Calendar />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen transition-all duration-300",
      settings.theme === 'light' ? 'light bg-slate-50 text-slate-950' : 'bg-[#020617] text-slate-50'
    )}>
      <Navigation />
      <main className="flex-1 max-w-7xl mx-auto px-8 py-10 overflow-x-hidden">
        <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
           <h1 className={cn(
             "text-3xl font-bold tracking-tight",
             settings.theme === 'light' ? 'text-slate-900' : 'text-slate-50'
           )}>
             {t[activeTab as keyof typeof t] || activeTab}
           </h1>
           <p className={cn(
             "mt-1",
             settings.theme === 'light' ? 'text-slate-500' : 'text-slate-400'
           )}>
             {t.todayIs} {new Intl.DateTimeFormat(settings.language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
           </p>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
