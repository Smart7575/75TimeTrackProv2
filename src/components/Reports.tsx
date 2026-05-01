import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isWithinInterval,
  subMonths,
  addMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

const Reports: React.FC = () => {
  const { entries, projects, clients, coreTasks, settings } = useApp();
  const t = translations[settings.language];
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthRange = useMemo(() => ({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  }), [currentDate]);

  const monthEntries = useMemo(() => {
    return entries.filter(e => e.startTime && isWithinInterval(e.startTime, monthRange));
  }, [entries, monthRange]);

  // Total stats
  const totalMinutes = monthEntries.reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0);
  const coreMinutes = monthEntries.filter(e => e.classification === 'core').reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0);
  const additionalMinutes = monthEntries.filter(e => e.classification === 'additional').reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0);
  
  const corePercentage = totalMinutes > 0 ? (coreMinutes / totalMinutes) * 100 : 0;
  const additionalPercentage = totalMinutes > 0 ? (additionalMinutes / totalMinutes) * 100 : 0;

  // Chart data: Stacked bar chart per day
  const daysInMonth = eachDayOfInterval(monthRange);
  const dailyData = daysInMonth.map(day => {
    const dayFormat = format(day, 'yyyy-MM-dd');
    const dayEntries = monthEntries.filter(e => e.startTime && format(e.startTime, 'yyyy-MM-dd') === dayFormat);
    return {
      name: format(day, 'dd'),
      core: parseFloat((dayEntries.filter(e => e.classification === 'core').reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0) / 60).toFixed(1)),
      additional: parseFloat((dayEntries.filter(e => e.classification === 'additional').reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0) / 60).toFixed(1))
    };
  }).filter(d => d.core > 0 || d.additional > 0);

  // Chart data: Hours per project
  const projectData = projects.map(project => {
    const hours = monthEntries
      .filter(e => e.projectId === project.id)
      .reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0) / 60;
    return { name: project.name, value: parseFloat(hours.toFixed(1)), color: project.color };
  }).filter(p => p.value > 0).sort((a, b) => b.value - a.value);

  // Chart data: Hours per client
  const clientData = useMemo(() => {
    const clientMap: Record<string, { minutes: number; color: string }> = {};
    
    monthEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      if (project) {
        // Prefer clientId, fallback to project.client (name)
        const key = project.clientId || project.client || 'Onbekend';
        const client = clients.find(c => c.id === project.clientId);
        const name = client ? client.name : (project.client || 'Onbekend');
        
        if (!clientMap[name]) {
          clientMap[name] = { minutes: 0, color: project.color || '#38bdf8' };
        }
        clientMap[name].minutes += (Number(entry.durationInMinutes) || 0);
      }
    });

    return Object.entries(clientMap).map(([name, data]) => ({
      name,
      value: parseFloat((data.minutes / 60).toFixed(1)),
      color: data.color
    })).sort((a, b) => b.value - a.value);
  }, [monthEntries, projects, clients]);

  // Chart data: Hours per core task
  const coreTaskData = coreTasks.map(task => {
    const subTaskIds = (task.subTasks || []).map(st => st.id);
    const activityIds = projects.flatMap(p => p.activities || [])
      .filter(a => a.coreSubTaskId && subTaskIds.includes(a.coreSubTaskId))
      .map(a => a.id);
    
    const hours = monthEntries
      .filter(e => activityIds.includes(e.activityId))
      .reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0) / 60;
    
    return { name: task.name, value: parseFloat(hours.toFixed(1)) };
  }).filter(t => t.value > 0).sort((a, b) => b.value - a.value);

  // Chart data: Hours per sub-core task
  const subCoreTaskData = coreTasks.flatMap(task => 
    (task.subTasks || []).map(sub => {
      const activityIds = projects.flatMap(p => p.activities || [])
        .filter(a => a.coreSubTaskId === sub.id)
        .map(a => a.id);
      
      const hours = monthEntries
        .filter(e => activityIds.includes(e.activityId))
        .reduce((acc, curr) => acc + (Number(curr.durationInMinutes) || 0), 0) / 60;
      
      return { name: sub.name, value: parseFloat(hours.toFixed(1)) };
    })
  ).filter(t => t.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8 pb-10">
      
      {/* Month Selector & Main Stats */}
      <div className={cn(
        "glass rounded-3xl p-8 border shadow-2xl relative overflow-hidden",
        settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <h2 className={cn("text-2xl font-black flex items-center gap-3 tracking-tight", settings.theme === 'light' ? "text-slate-900" : "text-white")}>
            <BarChart3 className="text-sky-400" size={28} />
            {t.reports}
          </h2>
          <div className={cn(
            "flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur-md",
            settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800/50"
          )}>
            <button 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))} 
              className={cn(
                "p-2 rounded-xl transition-all",
                settings.theme === 'light' ? "hover:bg-white text-slate-400 hover:text-sky-500" : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <ChevronLeft size={20} />
            </button>
            <div className={cn(
              "px-6 py-2 font-black min-w-[180px] text-center uppercase tracking-[0.2em] text-xs",
              settings.theme === 'light' ? "text-slate-900" : "text-white"
            )}>
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button 
              onClick={() => setCurrentDate(addMonths(currentDate, 1))} 
              className={cn(
                "p-2 rounded-xl transition-all",
                settings.theme === 'light' ? "hover:bg-white text-slate-400 hover:text-sky-500" : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 gap-8 relative z-10", settings.useCoreTasks ? "sm:grid-cols-3" : "sm:grid-cols-1")}>
          <div className={cn(
            "p-6 rounded-3xl border transition-colors group",
            settings.theme === 'light' ? "bg-slate-50 border-slate-100 hover:border-sky-500/30" : "bg-slate-950/40 border-slate-800/50 hover:border-sky-500/30"
          )}>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{t.totalHours}</div>
            <div className={cn("text-5xl font-black tracking-tighter", settings.theme === 'light' ? "text-slate-900" : "text-white")}>
              {(totalMinutes / 60).toFixed(1)}<span className="text-xl text-slate-400 ml-1">h</span>
            </div>
          </div>
          {settings.useCoreTasks && (
            <>
              <div className={cn(
                "p-6 rounded-3xl border transition-colors group",
                settings.theme === 'light' ? "bg-slate-50 border-slate-100 hover:border-sky-500/30" : "bg-slate-950/40 border-slate-800/50 hover:border-sky-500/30"
              )}>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">% {t.core}</div>
                <div className="text-5xl font-black text-sky-500 tracking-tighter">{Math.round(corePercentage)}<span className="text-xl opacity-40 ml-1">%</span></div>
                <div className={cn("mt-4 h-2 w-full rounded-full overflow-hidden border", settings.theme === 'light' ? "bg-slate-200 border-slate-300/50" : "bg-slate-900 border-slate-800/50")}>
                   <div className="h-full bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ width: `${corePercentage}%` }} />
                </div>
              </div>
              <div className={cn(
                "p-6 rounded-3xl border transition-colors group",
                settings.theme === 'light' ? "bg-slate-50 border-slate-100 hover:border-sky-500/30" : "bg-slate-950/40 border-slate-800/50 hover:border-sky-500/30"
              )}>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">% {t.additional}</div>
                <div className={cn("text-5xl font-black tracking-tighter", settings.theme === 'light' ? "text-slate-700" : "text-slate-400")}>
                  {Math.round(additionalPercentage)}<span className="text-xl opacity-40 ml-1">%</span>
                </div>
                 <div className={cn("mt-4 h-2 w-full rounded-full overflow-hidden border", settings.theme === 'light' ? "bg-slate-200 border-slate-300/50" : "bg-slate-900 border-slate-800/50")}>
                   <div className="h-full bg-slate-500" style={{ width: `${additionalPercentage}%` }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Ratio Chart */}
        <div className={cn(
          "glass rounded-3xl p-8 border shadow-xl overflow-hidden group",
          settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}>
          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.3em]">{settings.useCoreTasks ? 'Dagelijkse verhouding' : 'Dagelijkse uren'}</h3>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{ fill: settings.theme === 'light' ? 'rgba(56,189,248,0.05)' : 'rgba(56,189,248,0.1)' }} 
                  contentStyle={{ 
                    backgroundColor: settings.theme === 'light' ? '#ffffff' : '#0f172a', 
                    border: settings.theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                    borderRadius: '16px', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', 
                    fontSize: '12px',
                    color: settings.theme === 'light' ? '#0f172a' : '#ffffff'
                  }} 
                />
                {settings.useCoreTasks && (
                  <Legend 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }}
                  />
                )}
                <Bar dataKey="core" name={settings.useCoreTasks ? t.core : 'Uren'} stackId="a" fill="#38bdf8" radius={settings.useCoreTasks ? [0, 0, 0, 0] : [4, 4, 0, 0]} />
                {settings.useCoreTasks && (
                  <Bar dataKey="additional" name={t.additional} stackId="a" fill={settings.theme === 'light' ? '#cbd5e1' : '#334155'} radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Chart */}
        <div className={cn(
          "glass rounded-3xl p-8 border shadow-xl group",
          settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}>
          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.3em]">{t.hoursPerProject}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={projectData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={settings.theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={80} tick={{fill: '#94a3b8', fontWeight: '600'}} />
                <Tooltip 
                  cursor={{ fill: 'rgba(56,189,248,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: settings.theme === 'light' ? '#ffffff' : '#0f172a', 
                    border: settings.theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                    borderRadius: '16px', 
                    fontSize: '12px' 
                  }} 
                 />
                <Bar dataKey="value" name="Uren" radius={[0, 4, 4, 0]} barSize={20}>
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Chart */}
        <div className={cn(
          "glass rounded-3xl p-8 border shadow-xl group",
          settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}>
          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.3em]">{t.hoursPerClient}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={clientData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={settings.theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={80} tick={{fill: '#94a3b8', fontWeight: '600'}} />
                <Tooltip 
                  cursor={{ fill: 'rgba(56,189,248,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: settings.theme === 'light' ? '#ffffff' : '#0f172a', 
                    border: settings.theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                    borderRadius: '16px', 
                    fontSize: '12px' 
                  }} 
                 />
                <Bar dataKey="value" name="Uren" radius={[0, 4, 4, 0]} barSize={20}>
                  {clientData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Core Task Related Sections */}
        {settings.useCoreTasks && (
          <>
            {/* Core Task Chart */}
            <div className={cn(
              "glass rounded-3xl p-8 border shadow-xl group",
              settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
            )}>
              <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.3em]">{t.hoursPerCoreTask}</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={coreTaskData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={settings.theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                    <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={80} tick={{fill: '#94a3b8', fontWeight: '600'}} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: settings.theme === 'light' ? '#ffffff' : '#0f172a', 
                        border: settings.theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                        borderRadius: '16px', 
                        fontSize: '12px' 
                      }} 
                    />
                    <Bar dataKey="value" name="Uren" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sub-Core Task Chart */}
            <div className={cn(
              "glass rounded-3xl p-8 border shadow-xl group",
              settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
            )}>
              <h3 className="text-[10px] font-black uppercase text-slate-500 mb-8 tracking-[0.3em]">{t.hoursPerSubTask}</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={subCoreTaskData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={settings.theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                    <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={80} tick={{fill: '#94a3b8', fontWeight: '600'}} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: settings.theme === 'light' ? '#ffffff' : '#0f172a', 
                        border: settings.theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b', 
                        borderRadius: '16px', 
                        fontSize: '12px' 
                      }} 
                    />
                    <Bar dataKey="value" name="Uren" fill="#c084fc" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Productivity Norm */}
            <div className={cn(
              "rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden",
              settings.theme === 'light' ? "bg-sky-500/5 shadow-sky-500/10 border border-sky-100" : "accent-gradient shadow-sky-500/20 border border-sky-500/20"
            )}>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
               <div className={cn(
                 "w-16 h-16 rounded-2xl flex items-center justify-center rotate-3 relative z-10 shadow-xl",
                 settings.theme === 'light' ? "bg-white text-sky-500" : "bg-slate-950 text-sky-400"
               )}>
                  <TrendingUp size={32} />
               </div>
               <div className="relative z-10">
                 <h3 className={cn("text-2xl font-black uppercase tracking-tighter italic", settings.theme === 'light' ? "text-slate-900" : "text-slate-950")}>Productiviteits-norm</h3>
                 <p className={cn("font-bold text-sm max-w-[280px] mt-2", settings.theme === 'light' ? "text-slate-600" : "text-slate-900 opacity-80")}>
                   Je hebt deze maand {Math.round(corePercentage)}% aan kerntaken gewerkt. {corePercentage >= settings.coreNorm ? 'Goed bezig!' : 'Focus op je doelen.'}
                 </p>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
