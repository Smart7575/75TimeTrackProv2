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
  History,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, setHours, setMinutes, addMonths } from 'date-fns';

const Dashboard: React.FC = () => {
  const { 
    projects, entries, settings, activeTimer, 
    startTimer, stopTimer, addEntry, deleteEntry, updateEntry, setActiveTab 
  } = useApp();
  const t = translations[settings.language];
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedSubProject, setSelectedSubProject] = useState('');
  const [notes, setNotes] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [manualData, setManualData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00'
  });

  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    projectId: '',
    activityId: '',
    subProjectId: '',
    startTime: '09:00',
    endTime: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd')
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
      startTimer(selectedProject, selectedActivity, notes, selectedSubProject || undefined);
      setNotes('');
      setSelectedSubProject('');
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
          subProjectId: selectedSubProject || undefined,
          notes: notes || '',
          startTime: start,
          endTime: end,
          classification: activity?.classification || 'core',
          durationInMinutes: duration > 0 ? duration : 0
        });
        
        setNotes('');
        setSelectedSubProject('');
        setIsManual(false);
      } catch (err: any) {
        console.error("Error creating manual entry:", err);
        setError("Er is iets misgegaan bij het opslaan.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const startEditing = (entry: any) => {
    setEditingEntry(entry);
    setEditFormData({
      projectId: entry.projectId,
      activityId: entry.activityId,
      subProjectId: entry.subProjectId || '',
      startTime: entry.startTime ? format(entry.startTime, 'HH:mm') : '09:00',
      endTime: entry.endTime ? format(entry.endTime, 'HH:mm') : '',
      notes: entry.notes || '',
      date: entry.startTime ? format(entry.startTime, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    });
  };

  const saveEdit = () => {
    if (!editingEntry) return;

    const [startH, startM] = editFormData.startTime.split(':').map(Number);
    const [endH, endM] = editFormData.endTime ? editFormData.endTime.split(':').map(Number) : [null, null];
    
    const baseDate = parseISO(editFormData.date);
    const newStartTime = setMinutes(setHours(baseDate, startH), startM);
    
    let newEndTime = null;
    let durationInMinutes = 0;

    if (endH !== null && endM !== null) {
      newEndTime = setMinutes(setHours(baseDate, endH), endM);
      if (newEndTime < newStartTime) {
        newEndTime = addMonths(newEndTime, 0);
      }
      durationInMinutes = Math.round((newEndTime.getTime() - newStartTime.getTime()) / 60000);
    }

    const project = projects.find(p => p.id === editFormData.projectId);
    const activity = (project?.activities || []).find(a => a.id === editFormData.activityId);

    updateEntry(editingEntry.id, {
      projectId: editFormData.projectId,
      activityId: editFormData.activityId,
      subProjectId: editFormData.subProjectId || '',
      startTime: newStartTime,
      endTime: newEndTime || undefined,
      durationInMinutes: durationInMinutes > 0 ? durationInMinutes : editingEntry.durationInMinutes,
      notes: editFormData.notes,
      classification: activity?.classification || editingEntry.classification
    });

    setEditingEntry(null);
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
              {activeTimer.subProjectId && (
                <span className="text-xs text-emerald-400 mt-1 uppercase tracking-widest font-bold">
                  {(projects.find(p => p.id === activeTimer.projectId)?.subProjects || []).find(sp => sp.id === activeTimer.subProjectId)?.name}
                </span>
              )}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                    setSelectedSubProject('');
                  }}
                >
                  <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.selectProject}</option>
                  {projects.filter(p => !p.archived).slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{p.name}</option>)}
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
                  <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.selectActivity}</option>
                  {(selectedProjectObj?.activities || []).filter(a => !a.archived).slice().sort((a, b) => a.name.localeCompare(b.name)).map(a => <option key={a.id} value={a.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{t.subproject}</label>
                <select 
                  className={cn(
                    "w-full border rounded-xl p-4 text-sm focus:ring-1 focus:ring-sky-400 outline-none transition-all appearance-none",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                  )}
                  value={selectedSubProject}
                  onChange={(e) => setSelectedSubProject(e.target.value)}
                  disabled={!selectedProject}
                >
                  <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.selectSubProjectOptional}</option>
                  {(selectedProjectObj?.subProjects || []).filter(sp => !sp.archived).slice().sort((a, b) => a.name.localeCompare(b.name)).map(sp => <option key={sp.id} value={sp.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{sp.name}</option>)}
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{t.start}</label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">{t.end}</label>
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
                placeholder={t.detailsPlaceholder}
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
             <span className="text-[10px] text-slate-500">{t.today.toLowerCase()}</span>
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
                <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{t.actions}</th>
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
                       {entry.subProjectId && (
                         <span className={cn(
                            "text-xs px-2 py-1 rounded-md border font-extrabold uppercase transition-colors ml-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                         )}>
                           {(project?.subProjects || []).find(sp => sp.id === entry.subProjectId)?.name || 'Subproject'}
                         </span>
                       )}
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
                    <td className="py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => startEditing(entry)}
                          className={cn(
                            "p-2 rounded-xl border transition-colors",
                            settings.theme === 'light' ? "bg-white text-slate-400 hover:text-sky-500 border-slate-200" : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          )}
                          title={t.edit}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => { if(confirm(t.deleteEntryConfirm)) deleteEntry(entry.id); }}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {last5.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-600 text-sm italic">{t.noRecentActivities}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={cn(
            "w-full max-w-2xl rounded-3xl border shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300",
            settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          )}>
            <div className="flex items-center justify-between">
              <h2 className={cn("text-2xl font-black uppercase tracking-tight italic", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.editTimeEntry || 'Tijdregistratie Bewerken'}</h2>
              <button 
                onClick={() => setEditingEntry(null)} 
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.project}</label>
                <select 
                  value={editFormData.projectId}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    setEditFormData({
                      ...editFormData, 
                      projectId: e.target.value, 
                      activityId: (project?.activities || [])[0]?.id || '',
                      subProjectId: ''
                    });
                  }}
                  className={cn(
                    "w-full px-5 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all appearance-none text-sm font-bold",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                >
                  {projects.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.activity}</label>
                <select 
                  value={editFormData.activityId}
                  onChange={(e) => setEditFormData({...editFormData, activityId: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all appearance-none text-sm font-bold",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                >
                  {(projects.find(p => p.id === editFormData.projectId)?.activities || []).slice().sort((a, b) => a.name.localeCompare(b.name)).map(a => (
                    <option key={a.id} value={a.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.subproject}</label>
                <select 
                  value={editFormData.subProjectId || ''}
                  onChange={(e) => setEditFormData({...editFormData, subProjectId: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all appearance-none text-sm font-bold",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                >
                  <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.noSubProjectSelect}</option>
                  {(projects.find(p => p.id === editFormData.projectId)?.subProjects || []).filter(sp => !sp.archived).slice().sort((a, b) => a.name.localeCompare(b.name)).map(sp => (
                    <option key={sp.id} value={sp.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{sp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.date}</label>
                <input 
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                  className={cn(
                    "w-full px-5 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm font-bold",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.start}</label>
                  <input 
                    type="time"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                    className={cn(
                      "w-full px-5 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm font-bold text-center",
                      settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.end}</label>
                  <input 
                    type="time"
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})}
                    className={cn(
                      "w-full px-5 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm font-bold text-center",
                      settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.notes}</label>
              <textarea 
                value={editFormData.notes}
                onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                className={cn(
                  "w-full px-5 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm font-medium h-24 resize-none",
                  settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                )}
                placeholder="..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
              <button 
                onClick={() => setEditingEntry(null)}
                className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={saveEdit}
                className="px-10 py-4 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
