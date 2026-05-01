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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="text-neutral-400" />
            {t.calendar}
          </h2>
          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <button 
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'day' ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"
                )}
              >
                {t.day}
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'week' ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"
                )}
              >
                {t.week}
              </button>
            </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-2 font-semibold min-w-[200px] text-center">
            {viewMode === 'week' 
              ? `${format(weekDays[0], 'dd MMM')} - ${format(weekDays[6], 'dd MMM yyyy')}` 
              : format(currentWeekStart, 'EEEE dd MMMM yyyy')
            }
          </div>
          <button onClick={handleNext} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Calendar Grid Header */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-neutral-100 dark:border-neutral-800">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50" />
              {(viewMode === 'week' ? weekDays : [currentWeekStart]).map(day => (
                <div key={day.toString()} className={cn(
                  "p-4 text-center border-l border-neutral-100 dark:border-neutral-800",
                  isSameDay(day, new Date()) ? "bg-neutral-50 dark:bg-neutral-800/30" : ""
                )}>
                  <div className="text-xs font-bold uppercase text-neutral-400">{format(day, 'EEE')}</div>
                  <div className={cn(
                    "text-lg font-bold mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full",
                    isSameDay(day, new Date()) ? "bg-black text-white dark:bg-white dark:text-black" : ""
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Time Grid */}
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] h-20 border-b border-neutral-50 dark:border-neutral-800/30">
                  <div className="p-2 text-right pr-4 text-xs font-medium text-neutral-400 tabular-nums">
                    {hour}:00
                  </div>
                  {(viewMode === 'week' ? weekDays : [currentWeekStart]).map(day => (
                    <div key={day.toString()} className="border-l border-neutral-50 dark:border-neutral-800/30 relative">
                      {/* Here we would render entries for this hour block */}
                      {getDayEntries(day).filter(e => e.startTime.getHours() === hour).map(entry => {
                        const project = projects.find(p => p.id === entry.projectId);
                        return (
                          <div 
                            key={entry.id}
                            className="absolute top-0 left-0 right-0 m-1 p-2 rounded-lg text-[10px] overflow-hidden shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
                            style={{ 
                              backgroundColor: `${project?.color}20`,
                              borderLeft: `3px solid ${project?.color}`,
                              color: project?.color,
                              height: `${(entry.durationInMinutes / 60) * 80 - 4}px`
                            }}
                          >
                            <div className="font-bold truncate">{project?.name}</div>
                            <div className="whitespace-nowrap opacity-80">{format(entry.startTime, 'HH:mm')} - {entry.endTime && format(entry.endTime, 'HH:mm')}</div>
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
    </div>
  );
};

export default Calendar;
