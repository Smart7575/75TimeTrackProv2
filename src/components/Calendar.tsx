import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  addWeeks, 
  subWeeks,
  differenceInMinutes,
  startOfDay,
  setHours,
  setMinutes
} from 'date-fns';

const Calendar: React.FC = () => {
  const { entries, projects, settings, addEntry } = useApp();
  const t = translations[settings.language];
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [hoveredEntry, setHoveredEntry] = useState<{
    entry: any;
    projectName: string;
    activityName: string;
    subProjectName: string;
    x: number;
    y: number;
  } | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00

  const handlePrev = () => {
    if (viewMode === 'week') setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    else setCurrentWeekStart(addDays(currentWeekStart, -1));
  };

  const handleNext = () => {
    if (viewMode === 'week') setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    else setCurrentWeekStart(addDays(currentWeekStart, 1));
  };

  const getDayEntries = (day: Date) => {
    return entries.filter(e => e.startTime && isSameDay(e.startTime, day));
  };

  const handleMouseEnter = (e: React.MouseEvent, entry: any, project: any, activity: any, subProject: any) => {
    setHoveredEntry({
      entry,
      projectName: project?.name || '',
      activityName: activity?.name || '',
      subProjectName: subProject?.name || '',
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredEntry) {
      setHoveredEntry(prev => prev ? {
        ...prev,
        x: e.clientX,
        y: e.clientY
      } : null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredEntry(null);
  };

  return (
    <div className="space-y-6">
      <div className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl p-6 shadow-sm border",
        settings.theme === 'light' 
          ? "bg-white border-slate-200 text-slate-900" 
          : "bg-slate-900 border-slate-800 text-white"
      )}>
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="text-neutral-400" />
            {t.calendar}
          </h2>
          <div className={cn(
            "flex p-1 rounded-lg",
            settings.theme === 'light' ? "bg-slate-100" : "bg-slate-800"
          )}>
              <button 
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'day' 
                    ? (settings.theme === 'light' ? "bg-white text-slate-900 shadow-sm" : "bg-slate-700 text-white shadow-sm") 
                    : (settings.theme === 'light' ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white")
                )}
              >
                {t.day}
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'week' 
                    ? (settings.theme === 'light' ? "bg-white text-slate-900 shadow-sm" : "bg-slate-700 text-white shadow-sm") 
                    : (settings.theme === 'light' ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white")
                )}
              >
                {t.week}
              </button>
            </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrev} 
            className={cn(
              "p-2 rounded-lg transition-colors",
              settings.theme === 'light' ? "hover:bg-slate-100 text-slate-700" : "hover:bg-slate-800 text-slate-300"
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-2 font-semibold min-w-[200px] text-center">
            {viewMode === 'week' 
              ? `${format(weekDays[0], 'dd MMM')} - ${format(weekDays[6], 'dd MMM yyyy')}` 
              : format(currentWeekStart, 'EEEE dd MMMM yyyy')
            }
          </div>
          <button 
            onClick={handleNext} 
            className={cn(
              "p-2 rounded-lg transition-colors",
              settings.theme === 'light' ? "hover:bg-slate-100 text-slate-700" : "hover:bg-slate-800 text-slate-300"
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className={cn(
        "rounded-2xl shadow-sm border overflow-hidden",
        settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
      )}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Calendar Grid Header */}
            <div className={cn(
              "grid grid-cols-[100px_repeat(7,1fr)] border-b",
              settings.theme === 'light' ? "border-slate-200" : "border-slate-800"
            )}>
              <div className={cn(
                "p-4",
                settings.theme === 'light' ? "bg-slate-50" : "bg-slate-800/50"
              )} />
              {(viewMode === 'week' ? weekDays : [currentWeekStart]).map(day => (
                <div key={day.toString()} className={cn(
                  "p-4 text-center border-l",
                  settings.theme === 'light' ? "border-slate-200" : "border-slate-800",
                  isSameDay(day, new Date()) 
                    ? (settings.theme === 'light' ? "bg-slate-50" : "bg-slate-800/30") 
                    : ""
                )}>
                  <div className={cn(
                    "text-xs font-bold uppercase",
                    settings.theme === 'light' ? "text-slate-400" : "text-neutral-500"
                  )}>{format(day, 'EEE')}</div>
                  <div className={cn(
                    "text-lg font-bold mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full",
                    isSameDay(day, new Date()) 
                      ? (settings.theme === 'light' ? "bg-slate-900 text-white" : "bg-white text-slate-950") 
                      : (settings.theme === 'light' ? "text-slate-800" : "text-slate-100")
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Time Grid */}
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className={cn(
                  "grid grid-cols-[100px_repeat(7,1fr)] h-20 border-b",
                  settings.theme === 'light' ? "border-slate-100" : "border-slate-800/30"
                )}>
                  <div className={cn(
                    "p-2 text-right pr-4 text-xs font-medium tabular-nums",
                    settings.theme === 'light' ? "text-slate-400" : "text-slate-500"
                  )}>
                    {hour}:00
                  </div>
                  {(viewMode === 'week' ? weekDays : [currentWeekStart]).map(day => (
                    <div key={day.toString()} className={cn(
                      "border-l relative",
                      settings.theme === 'light' ? "border-slate-100" : "border-slate-800/30"
                    )}>
                      {/* Here we would render entries for this hour block */}
                      {getDayEntries(day).filter(e => e.startTime.getHours() === hour).map(entry => {
                        const project = projects.find(p => p.id === entry.projectId);
                        const activity = project?.activities?.find(a => a.id === entry.activityId);
                        const subProject = project?.subProjects?.find(sp => sp.id === entry.subProjectId);
                        
                        const calculatedHeight = (entry.durationInMinutes / 60) * 80 - 4;
                        const isShort = entry.durationInMinutes < 35;
                        const height = isShort ? Math.max(26, calculatedHeight) : calculatedHeight;

                        return (
                          <div 
                            key={entry.id}
                            className="absolute top-0 left-0 right-0 m-1 rounded-lg text-[10px] overflow-hidden shadow-sm transition-all hover:scale-[1.02] hover:z-10 cursor-pointer"
                            style={{ 
                              backgroundColor: `${project?.color}20`,
                              borderLeft: `3px solid ${project?.color}`,
                              color: project?.color,
                              height: `${height}px`
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, entry, project, activity, subProject)}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                          >
                            {isShort ? (
                              <div className="flex items-center justify-between gap-1 h-full px-2 py-0.5 select-none text-[10px]">
                                <div className="font-bold truncate flex items-center gap-1.5 overflow-hidden">
                                  <span className="truncate">{activity?.name || project?.name}</span>
                                  {activity?.name && <span className="opacity-60 text-[8px] font-normal shrink-0">({project?.name})</span>}
                                </div>
                                <div className="text-[9px] opacity-75 shrink-0 tabular-nums whitespace-nowrap hidden sm:block">
                                  {format(entry.startTime, 'HH:mm')}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col h-full justify-between select-none p-1.5 text-[10px]">
                                <div className="min-h-0">
                                  <div className="font-bold truncate leading-tight text-current">
                                    {activity?.name || project?.name}
                                  </div>
                                  {activity?.name && project?.name && (
                                    <div className="text-[9px] opacity-75 font-medium truncate leading-tight mt-0.5">
                                      {project?.name}
                                    </div>
                                  )}
                                </div>
                                <div className="text-[9px] font-medium opacity-85 mt-1 flex items-center gap-1 shrink-0 tabular-nums">
                                  <Clock size={10} className="shrink-0" strokeWidth={2.5} />
                                  <span className="truncate">{format(entry.startTime, 'HH:mm')} - {entry.endTime && format(entry.endTime, 'HH:mm')}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hoveredEntry && (() => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let leftPos = hoveredEntry.x + 15;
        let topPos = hoveredEntry.y + 15;
        
        // tooltip width is approx 270px, height is approx 180px
        if (leftPos + 270 > viewportWidth) {
          leftPos = hoveredEntry.x - 285;
        }
        if (topPos + 180 > viewportHeight) {
          topPos = hoveredEntry.y - 195;
        }
        if (leftPos < 0) leftPos = 10;
        if (topPos < 0) topPos = 10;
        
        const projectColor = projects.find(p => p.id === hoveredEntry.entry.projectId)?.color || '#38bdf8';

        return (
          <div 
            className={cn(
              "fixed z-50 pointer-events-none p-4 rounded-xl shadow-xl border text-xs w-[270px] space-y-2 transition-all duration-75",
              settings.theme === 'light' 
                ? "bg-white border-slate-200 text-slate-800 shadow-slate-200/40" 
                : "bg-slate-950 border-slate-800/80 text-slate-200 shadow-black/70"
            )}
            style={{ 
              left: `${leftPos}px`, 
              top: `${topPos}px`
            }}
          >
            <div className="font-extrabold text-[13px] flex items-center gap-2 leading-tight">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: projectColor }} />
              <span className="truncate">{hoveredEntry.activityName || t.activity}</span>
            </div>
            
            <div className="space-y-1 text-[11px] opacity-95">
              <div className="flex items-center justify-between gap-4">
                <span className="opacity-70 font-medium">{t.project}:</span>
                <span className="font-semibold truncate max-w-[160px]">{hoveredEntry.projectName}</span>
              </div>

              {hoveredEntry.subProjectName && (
                <div className="flex items-center justify-between gap-4">
                  <span className="opacity-70 font-medium">{t.subproject || 'Subproject'}:</span>
                  <span className="font-semibold truncate max-w-[160px]">{hoveredEntry.subProjectName}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-4">
                <span className="opacity-70 font-medium">{t.time || 'Time'}:</span>
                <span className="font-mono font-bold tracking-tight">
                  {format(hoveredEntry.entry.startTime, 'HH:mm')} - {hoveredEntry.entry.endTime ? format(hoveredEntry.entry.endTime, 'HH:mm') : ''}
                </span>
              </div>

              <div className={cn(
                "flex items-center justify-between gap-4 border-b pb-2 mb-2 border-dashed",
                settings.theme === 'light' ? "border-slate-200" : "border-slate-800"
              )}>
                <span className="opacity-70 font-medium">{t.duration || 'Duration'}:</span>
                <span className="font-semibold tabular-nums">{hoveredEntry.entry.durationInMinutes} min</span>
              </div>
            </div>

            {hoveredEntry.entry.notes && (
              <div className="pt-1">
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.notes}</div>
                <p className="italic text-[11.5px] leading-relaxed whitespace-pre-wrap font-medium">
                  "{hoveredEntry.entry.notes}"
                </p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default Calendar;
