import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Layers,
  History,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  isWithinInterval,
  isSameDay,
  parseISO,
  setHours,
  setMinutes
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { TimeEntry } from '../types';

const TimeRegister: React.FC = () => {
  const { entries, projects, settings, updateEntry, deleteEntry } = useApp();
  const t = translations[settings.language];
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'today'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // Edit state
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editFormData, setEditFormData] = useState({
    projectId: '',
    activityId: '',
    subProjectId: '',
    startTime: '',
    endTime: '',
    notes: '',
    date: ''
  });

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (!entry.startTime) return false;
      const entryDate = entry.startTime;
      let dateMatch = false;
      if (viewMode === 'month') {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        dateMatch = isWithinInterval(entryDate, { start, end });
      } else {
        dateMatch = isSameDay(entryDate, currentDate);
      }

      // Search term
      const notes = entry.notes || '';
      const searchMatch = notes.toLowerCase().includes(searchTerm.toLowerCase());

      // Project filter
      const projectMatch = projectFilter === 'all' || entry.projectId === projectFilter;

      // Classification filter
      const classMatch = classFilter === 'all' || entry.classification === classFilter;

      return dateMatch && searchMatch && projectMatch && classMatch;
    });
  }, [entries, currentDate, viewMode, searchTerm, projectFilter, classFilter]);

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() - 86400000));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() + 86400000));
  };

  const startEditing = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditFormData({
      projectId: entry.projectId,
      activityId: entry.activityId,
      subProjectId: entry.subProjectId || '',
      startTime: entry.startTime ? format(entry.startTime, 'HH:mm') : '09:00',
      endTime: entry.endTime ? format(entry.endTime, 'HH:mm') : '',
      notes: entry.notes,
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
      // Ensure end is after start (simple check for same day)
      if (newEndTime < newStartTime) {
        newEndTime = addMonths(newEndTime, 0); // placeholder for date logic if needed
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

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* Header & Main Filters */}
      <div className={cn(
        "glass rounded-3xl p-8 border shadow-2xl space-y-8 relative overflow-hidden",
        settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <h2 className={cn("text-2xl font-black tracking-tight uppercase italic", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.register}</h2>
            <div className={cn(
              "flex p-1 border rounded-2xl backdrop-blur-md",
              settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900/80 border-slate-800"
            )}>
              <button 
                onClick={() => { setViewMode('today'); setCurrentDate(new Date()); }}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'today' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-slate-500 hover:text-sky-500"
                )}
              >
                {t.today}
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'month' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-slate-500 hover:text-sky-500"
                )}
              >
                {t.thisMonth}
              </button>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-4 p-1 rounded-2xl border",
            settings.theme === 'light' ? "bg-sky-50/50 border-sky-100" : "bg-slate-900/50 border-slate-800/50"
          )}>
            <button 
              onClick={handlePrev}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                settings.theme === 'light' ? "hover:bg-white text-slate-400 hover:text-sky-500" : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <ChevronLeft size={20} />
            </button>
            <div className={cn(
              "px-4 py-2 font-black min-w-[160px] text-center text-xs uppercase tracking-[0.2em]",
              settings.theme === 'light' ? "text-slate-900" : "text-white"
            )}>
              {viewMode === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'dd MMMM yyyy')}
            </div>
            <button 
              onClick={handleNext}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                settings.theme === 'light' ? "hover:bg-white text-slate-400 hover:text-sky-500" : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t.search + "..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm placeholder:text-slate-400 font-medium",
                settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
              )}
            />
          </div>
          
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
            <select 
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-xs font-bold uppercase tracking-widest transition-all appearance-none",
                settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-slate-400"
              )}
            >
              <option value="all" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.all} {t.project}</option>
              {projects.filter(p => !p.archived).slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{p.name}</option>)}
            </select>
          </div>

          {settings.useCoreTasks && (
            <div className="relative group">
              <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
              <select 
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-xs font-bold uppercase tracking-widest transition-all appearance-none",
                  settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-slate-400"
                )}
              >
                <option value="all" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.all} {t.classification}</option>
                <option value="core" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.core}</option>
                <option value="additional" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.additional}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className={cn(
        "glass rounded-3xl border shadow-2xl overflow-hidden",
        settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn(
                "border-b",
                settings.theme === 'light' ? "bg-sky-50 border-sky-100" : "bg-slate-900/50 border-slate-800"
              )}>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.date}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.project} / {t.activity}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.time}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.duration}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.notes}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", settings.theme === 'light' ? "divide-slate-100" : "divide-slate-800/30")}>
              {filteredEntries.map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                const activity = (project?.activities || []).find(a => a.id === entry.activityId);
                return (
                  <tr key={entry.id} className={cn(
                    "group transition-all",
                    settings.theme === 'light' ? "hover:bg-slate-50" : "hover:bg-slate-800/40"
                  )}>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-bold mb-0.5",
                          settings.theme === 'light' ? "text-slate-900" : "text-white"
                        )}>{entry.startTime ? format(entry.startTime, 'dd MMM yyyy') : '-'}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                          {entry.startTime ? format(entry.startTime, 'EEEE', { locale: settings.language === 'nl' ? nl : undefined }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-1.5 h-6 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: project?.color }} />
                        <span className={cn(
                          "font-bold",
                          settings.theme === 'light' ? "text-slate-700" : "text-slate-200"
                        )}>{project?.name || 'Verwijderd Project'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 border rounded uppercase font-bold tracking-widest",
                          settings.theme === 'light' ? "text-slate-500 bg-slate-50 border-slate-200" : "text-slate-500 bg-slate-900 border-slate-800"
                        )}>
                          {activity?.name || 'Verwijderde Activiteit'}
                        </span>
                        {entry.subProjectId && (
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 border rounded uppercase font-extrabold tracking-widest bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          )}>
                            {(project?.subProjects || []).find(sp => sp.id === entry.subProjectId)?.name || 'Subproject'}
                          </span>
                        )}
                        {settings.useCoreTasks && (
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded border uppercase font-black tracking-widest transition-colors",
                            entry.classification === 'core' 
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          )}>
                            {entry.classification === 'core' ? t.core : t.additional}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                       <span className="text-xs font-mono text-slate-400 tabular-nums">
                         {entry.startTime ? format(entry.startTime, 'HH:mm') : '--:--'} - {entry.endTime ? format(entry.endTime, 'HH:mm') : '--:--'}
                       </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-400/5 border border-sky-400/10 rounded-lg">
                         <span className="text-sm font-black text-sky-400 tabular-nums uppercase">
                           {Math.floor(entry.durationInMinutes / 60)}u {entry.durationInMinutes % 60}m
                         </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 max-w-sm">
                      <div className="text-xs text-slate-500 line-clamp-2 italic group-hover:text-slate-300 transition-colors">
                        {entry.notes || '-'}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => startEditing(entry)}
                          className={cn(
                            "p-2.5 rounded-xl border transition-colors",
                            settings.theme === 'light' ? "bg-white text-slate-400 hover:text-sky-500 border-slate-200" : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          )}
                          title={t.edit}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => { if(confirm(t.deleteEntryConfirm)) deleteEntry(entry.id); }}
                          className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30 group">
                       <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:scale-110 transition-transform duration-500">
                         <History size={40} strokeWidth={1} />
                       </div>
                       <p className="text-sm uppercase tracking-[0.3em] font-black italic">{t.noResults}</p>
                    </div>
                  </td>
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
              <h2 className={cn("text-2xl font-black uppercase tracking-tight italic", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.editTimeEntry}</h2>
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

export default TimeRegister;
