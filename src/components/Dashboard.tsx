import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  Play, 
  Square, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

const Dashboard: React.FC = () => {
  const { 
    projects, entries, settings, activeTimer, 
    startTimer, stopTimer, addEntry, setActiveTab 
  } = useApp();
  const t = translations[settings.language];
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [manualData, setManualData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00'
  });

  // Today's total time
  const todayEntries = entries.filter(e => 
    e.startTime && isWithinInterval(e.startTime, { 
      start: startOfDay(new Date()), 
      end: endOfDay(new Date()) 
    })
  );
  
  const totalMinutesToday = todayEntries.reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0);
  const hoursToday = Math.floor(totalMinutesToday / 60);
  const minutesToday = totalMinutesToday % 60;

  // Last 5 activities
  const last5 = entries.slice(0, 5);

  // Core vs Additional stats
  const coreMinutes = todayEntries
    .filter(e => e.classification === 'core')
    .reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0);
  const additionalMinutes = todayEntries
    .filter(e => e.classification === 'additional')
    .reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0);
  
  const corePercentage = totalMinutesToday > 0 ? (coreMinutes / totalMinutesToday) * 100 : 0;
  
  // Timer clock update
  const [timerText, setTimerText] = useState('00:00:00');
  
  useEffect(() => {
    if (!activeTimer) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - activeTimer.startTime.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimerText(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartTimer = () => {
    if (selectedProject && selectedActivity) {
      startTimer(selectedProject, selectedActivity, notes);
      setNotes('');
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManualAdd = async () => {
    if (selectedProject && selectedActivity && manualData.date && manualData.startTime && manualData.endTime) {
      setError(null);
      setIsSubmitting(true);
      try {
        const [year, month, day] = manualData.date.split('-').map(Number);
        const [startH, startM] = manualData.startTime.split(':').map(Number);
        const [endH, endM] = manualData.endTime.split(':').map(Number);
        
        const start = new Date(year, month - 1, day, startH, startM);
        const end = new Date(year, month - 1, day, endH, endM);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          setError("Ongeldige datum of tijd.");
          setIsSubmitting(false);
          return;
        }

        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        
        const project = projects.find(p => p.id === selectedProject);
        const activity = (project?.activities || []).find(a => a.id === selectedActivity);
        
        await addEntry({
          projectId: selectedProject,
          activityId: selectedActivity,
          notes: notes || '',
          startTime: start,
          endTime: end,
          classification: activity?.classification || 'core',
          durationInMinutes: duration > 0 ? duration : 0
        });
        
        setNotes('');
        setIsManual(false);
      } catch (err: any) {
        console.error("Error creating manual entry:", err);
        setError("Er is iets misgegaan bij het opslaan.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const selectedProjectObj = projects.find(p => p.id === selectedProject);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
      
      {/* Registration Widget */}
        <div className={cn(
          "lg:col-span-8 glass rounded-3xl p-8 border shadow-xl relative overflow-hidden",
          settings.theme === 'light' ? 'bg-white border-sky-100' : 'bg-slate-900/40 border-sky-900/30 glow-blue'
        )}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Clock className="text-sky-400" size={24} />
            {isManual ? t.manual : t.startRegistration}
          </h2>
          <button 
            onClick={() => setIsManual(!isManual)}
            className={cn(
              "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-all border",
              settings.theme === 'light' ? "text-slate-500 hover:text-sky-500 border-slate-200" : "text-slate-400 hover:text-sky-400 border-slate-700"
            )}
          >
            {isManual ? t.startRegistration : t.manual}
          </button>
        </div>

        {activeTimer ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in zoom-in-95">
            <div className={cn(
              "text-7xl font-mono tracking-tighter tabular-nums",
              settings.theme === 'light' ? "text-slate-900" : "text-white"
            )}>
              {timerText}
            </div>
            <div className={cn(
              "flex flex-col items-center px-6 py-3 rounded-2xl border",
              settings.theme === 'light' ? "bg-sky-50 border-sky-100" : "bg-slate-800/40 border-slate-700/50"
            )}>
              <span className="font-bold text-sky-400">
                {projects.find(p => p.id === activeTimer.projectId)?.name}
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-black mt-1">
                {(projects.find(p => p.id === activeTimer.projectId)?.activities || []).find(a => a.id === activeTimer.activityId)?.name}
              </span>
            </div>
            <button 
              onClick={stopTimer}
              className="w-24 h-24 bg-red-500/20 hover:bg-red-500 border border-red-500/50 rounded-full flex items-center justify-center text-red-500 hover:text-white shadow-xl shadow-red-500/10 transition-all active:scale-90 group"
            >
              <Square fill="currentColor" size={32} className="group-hover:scale-90 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{t.project}</label>
                <select 
                  className={cn(
                    "w-full border rounded-xl p-4 text-sm focus:ring-1 focus:ring-sky-400 outline-none transition-all appearance-none",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                  )}
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedActivity('');
                  }}
                >
                  <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>Project selecteren</option>
                  {projects.filter(p => !p.archived).map(p => <option key={p.id} value={p.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{t.activity}</label>
                <select 
                  className={cn(
                    "w-full border rounded-xl p-4 text-sm focus:ring-1 focus:ring-sky-400 outline-none transition-all appearance-none",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                  )}
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  disabled={!selectedProject}
                >
                  <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>Activiteit selecteren</option>
                  {(selectedProjectObj?.activities || []).filter(a => !a.archived).map(a => <option key={a.id} value={a.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{a.name}</option>)}
                </select>
              </div>
            </div>

            {isManual && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{t.date}</label>
                  <input 
                    type="date"
                    className={cn(
                      "w-full border rounded-xl p-4 text-sm focus:ring-1 focus:ring-sky-400 outline-none",
                      settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                    )}
                    value={manualData.date}
                    onChange={(e) => setManualData({...manualData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Start</label>
                  <input 
                    type="time"
                    className={cn(
                      "w-full border rounded-xl p-4 text-sm focus:ring-1 focus:ring-sky-400 outline-none",
                      settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                    )}
                    value={manualData.startTime}
                    onChange={(e) => setManualData({...manualData, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Eind</label>
                  <input 
                    type="time"
                    className={cn(
                      "w-full border rounded-xl p-4 text-sm focus:ring-1 focus:ring-sky-400 outline-none",
                      settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                    )}
                    value={manualData.endTime}
                    onChange={(e) => setManualData({...manualData, endTime: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{t.notes}</label>
              <textarea 
                className={cn(
                  "w-full border rounded-xl p-4 text-sm min-h-[120px] focus:ring-1 focus:ring-sky-400 outline-none transition-all resize-none",
                  settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900 placeholder:text-slate-400" : "bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600"
                )}
                placeholder="Details over je werkzaamheden..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs animate-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <span className="font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}

            <div className="pt-4">
              <button 
                disabled={isSubmitting || !selectedProject || !selectedActivity}
                className={cn(
                  "w-full flex items-center justify-center gap-3 p-5 rounded-2xl font-bold transition-all transform",
                  (selectedProject && selectedActivity && !isSubmitting) 
                    ? settings.theme === 'light'
                      ? "bg-sky-900 text-white shadow-lg shadow-sky-900/30 hover:scale-[1.02] active:scale-[0.98] ring-1 ring-white/10"
                      : "bg-slate-800 text-white shadow-lg shadow-black/40 hover:scale-[1.02] active:scale-[0.98] border border-slate-700"
                    : settings.theme === 'light'
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50"
                )}
                onClick={isManual ? handleManualAdd : handleStartTimer}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : isManual ? (
                  <Plus size={22} strokeWidth={3} className="text-white" />
                ) : (
                  <Play size={22} fill="white" className="text-white" />
                )}
                <span className="uppercase tracking-widest text-sm font-black text-white">
                  {isSubmitting ? 'Bezig...' : (isManual ? t.save : t.startTimer)}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-4 space-y-8">
        {/* Today's Registration */}
        <div className={cn(
          "glass rounded-3xl p-8 border shadow-xl overflow-hidden relative group",
          settings.theme === 'light' ? "bg-white border-sky-100" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={160} strokeWidth={1} />
          </div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">{t.todayRegistered}</h3>
          <div className={cn(
            "text-5xl font-black tracking-tighter mb-2",
            settings.theme === 'light' ? "text-slate-900" : "text-white"
          )}>
            {hoursToday.toString().padStart(2, '0')}:{minutesToday.toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-2">
             <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">
               {(totalMinutesToday / 60).toFixed(1)}h total
             </div>
             <span className="text-[10px] text-slate-500">vandaag</span>
          </div>
        </div>

        {/* Focus Analyse / Core Task Norm */}
        {settings.useCoreTasks && (
          <div className={cn(
            "glass rounded-3xl p-8 border shadow-xl overflow-hidden relative group",
            settings.theme === 'light' ? "bg-white border-sky-100" : "bg-slate-900/40 border-slate-800"
          )}>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">{t.corevsAdditional}</h3>
            
            <div className="relative w-40 h-40 mx-auto mb-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className={cn(settings.theme === 'light' ? "stroke-slate-100" : "stroke-slate-800/50")} strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <path 
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    corePercentage >= settings.coreNorm ? "stroke-sky-400" : "stroke-amber-400"
                  )} 
                  strokeWidth="2.5" 
                  strokeDasharray={`${corePercentage}, 100`} 
                  strokeLinecap="round" 
                  fill="none" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-black", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{Math.round(corePercentage)}%</span>
                <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">{t.core}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Actueel</span>
                <span className={cn("font-bold", settings.theme === 'light' ? "text-slate-800" : "text-white")}>{Math.round(corePercentage)}% Kerntaken</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Norm ({settings.coreNorm}%)</span>
                <span className={cn(
                  "font-bold",
                  corePercentage >= settings.coreNorm ? "text-emerald-400" : "text-amber-400"
                )}>
                  {corePercentage >= settings.coreNorm ? '✓ Gehaald' : '! Onder norm'}
                </span>
              </div>
              <div className={cn("w-full h-1.5 rounded-full overflow-hidden", settings.theme === 'light' ? "bg-slate-100" : "bg-slate-800")}>
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    corePercentage >= settings.coreNorm ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  style={{ width: `${corePercentage}%` }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className={cn(
        "lg:col-span-12 glass rounded-3xl p-8 border shadow-xl overflow-hidden",
        settings.theme === 'light' ? "bg-white border-sky-100" : "bg-slate-900/40 border-slate-800"
      )}>
        <div className="flex items-center justify-between mb-8">
          <h2 className={cn("text-xl font-bold flex items-center gap-3", settings.theme === 'light' ? "text-slate-900" : "text-white")}>
            <History className="text-slate-500" />
            {t.recentActivities}
          </h2>
          <button 
            onClick={() => setActiveTab('register')}
            className="text-xs font-bold text-sky-400 uppercase tracking-widest hover:underline decoration-sky-400/30 underline-offset-4"
          >
            {t.viewAll}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn("border-b", settings.theme === 'light' ? "border-slate-100" : "border-slate-800/50")}>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.project}</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.activity}</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.date}</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.duration}</th>
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.notes}</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", settings.theme === 'light' ? "divide-slate-50" : "divide-slate-800/30")}>
              {last5.map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                const activity = (project?.activities || []).find(a => a.id === entry.activityId);
                return (
                  <tr key={entry.id} className={cn(
                    "group transition-all cursor-default",
                    settings.theme === 'light' ? "hover:bg-slate-50/50" : "hover:bg-slate-800/20"
                  )}>
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: project?.color }} />
                        <span className={cn("font-bold text-sm", settings.theme === 'light' ? "text-slate-700" : "text-slate-200")}>{project?.name}</span>
                      </div>
                    </td>
                    <td className="py-5">
                       <span className={cn(
                         "text-xs px-2 py-1 rounded-md border transition-colors",
                         settings.theme === 'light' ? "text-slate-500 bg-slate-50 border-slate-200 group-hover:border-slate-300" : "text-slate-400 bg-slate-900 border-slate-800 group-hover:border-slate-700"
                       )}>
                         {activity?.name}
                       </span>
                    </td>
                    <td className="py-5 text-xs text-slate-500 font-medium">
                      {entry.startTime ? format(entry.startTime, 'dd MMM') : '-'}
                    </td>
                    <td className="py-5">
                       <span className="text-sm font-mono text-sky-400 bg-sky-400/5 px-2 py-1 rounded-md border border-sky-400/10 font-bold">
                         {Math.floor((Number(entry.durationInMinutes) || 0) / 60)}h {(Number(entry.durationInMinutes) || 0) % 60}m
                       </span>
                    </td>
                    <td className="py-5 text-slate-500 text-xs truncate max-w-sm italic opacity-80 group-hover:opacity-100 transition-opacity">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                );
              })}
              {last5.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-600 text-sm italic">Geen recente activiteiten om weer te geven.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
