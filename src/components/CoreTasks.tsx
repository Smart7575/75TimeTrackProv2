import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Subtitles, 
  Layers,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  MoreVertical,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';

const CoreTasks: React.FC = () => {
  const { 
    coreTasks, settings,
    addCoreTask, addSubCoreTask, deleteCoreTask, deleteSubCoreTask,
    updateCoreTask, updateSubCoreTask
  } = useApp();
  const t = translations[settings.language];
  
  const [newCoreTaskName, setNewCoreTaskName] = useState('');
  const [showAddSubFor, setShowAddSubFor] = useState<string | null>(null);
  const [newSubTaskName, setNewSubTaskName] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingSubTaskId, setEditingSubTaskId] = useState<{parentId: string, id: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const toggleTask = (id: string) => {
    setExpandedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAddCoreTask = () => {
    if (newCoreTaskName) {
      addCoreTask(newCoreTaskName);
      setNewCoreTaskName('');
    }
  };

  const handleAddSubTask = (parentId: string) => {
    if (newSubTaskName) {
      addSubCoreTask(parentId, newSubTaskName);
      setNewSubTaskName('');
      setShowAddSubFor(null);
    }
  };

  const startEditTask = (task: import('../types').CoreTask) => {
    setEditingTaskId(task.id);
    setEditValue(task.name);
  };

  const saveEditTask = (id: string) => {
    if (editValue.trim()) {
      updateCoreTask(id, editValue.trim());
    }
    setEditingTaskId(null);
  };

  const startEditSubTask = (parentId: string, sub: {id: string, name: string}) => {
    setEditingSubTaskId({ parentId, id: sub.id });
    setEditValue(sub.name);
  };

  const saveEditSubTask = (parentId: string, id: string) => {
    if (editValue.trim()) {
      updateSubCoreTask(parentId, id, editValue.trim());
    }
    setEditingSubTaskId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl shadow-xl border",
            settings.theme === 'light' ? "bg-white border-sky-100 text-sky-500 shadow-sky-100/50" : "bg-slate-900 border-slate-800 text-sky-400"
          )}>
            <Layers size={24} />
          </div>
          <div>
            <h2 className={cn("text-2xl font-black tracking-tight italic uppercase", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.coreTasks}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Definieer je waardevolle werk</p>
          </div>
        </div>
      </div>

      <div className={cn(
        "glass rounded-3xl p-8 border shadow-2xl relative overflow-hidden group",
        settings.theme === 'light' ? "bg-white border-sky-100" : "bg-slate-900/40 border-slate-800"
      )}>
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Target size={120} strokeWidth={1} />
        </div>
        <div className="relative z-10 flex gap-4">
          <input 
            type="text" 
            placeholder="Nieuwe kerntaak toevoegen..."
            className={cn(
              "flex-1 border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-400 font-medium",
              settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
            )}
            value={newCoreTaskName}
            onChange={(e) => setNewCoreTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCoreTask()}
          />
          <button 
            onClick={handleAddCoreTask}
            className={cn(
              "p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
              newCoreTaskName 
                ? "accent-gradient text-white shadow-lg shadow-sky-500/20 active:scale-95" 
                : settings.theme === 'light'
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed"
            )}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {coreTasks.map(task => (
          <div key={task.id} className={cn(
            "glass rounded-[2.5rem] border shadow-xl overflow-hidden group transition-all",
            settings.theme === 'light' ? "bg-white border-slate-200 hover:border-sky-200" : "bg-slate-900/40 border-slate-800 hover:border-slate-600"
          )}>
            <div className="p-8 flex items-center justify-between">
                <div 
                  className="flex items-center gap-6 flex-1 cursor-pointer"
                  onClick={() => !editingTaskId && toggleTask(task.id)}
                >
                  <div className={cn(
                    "w-12 h-12 border rounded-2xl flex items-center justify-center group-hover:text-sky-400 transition-colors shadow-lg",
                    settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-slate-900 border-slate-800 text-slate-400"
                  )}>
                    <Layers size={20} />
                  </div>
                  <div className="flex-1">
                    {editingTaskId === task.id ? (
                      <input 
                        className={cn(
                          "w-full border rounded-xl px-4 py-2 text-lg font-black uppercase italic tracking-tight outline-none",
                          settings.theme === 'light' ? "bg-white border-sky-300 text-slate-900" : "bg-slate-950 border-sky-500 text-white"
                        )}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        onBlur={() => saveEditTask(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditTask(task.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <h3 className={cn("font-black text-lg uppercase italic tracking-tight", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{task.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-0.5 rounded-full border",
                            settings.theme === 'light' ? "text-slate-400 bg-slate-50 border-slate-100" : "text-slate-500 bg-slate-950 border-slate-800/50"
                          )}>
                            {task.subTasks.length} SUB-TAKEN
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startEditTask(task)}
                    className={cn(
                      "p-3 rounded-xl border transition-all hover:scale-110",
                      settings.theme === 'light' ? "bg-slate-50 text-slate-400 hover:text-sky-500 border-slate-200 shadow-sm" : "bg-slate-900 text-slate-500 hover:text-sky-400 border-slate-800"
                    )}
                    title={t.edit}
                  >
                    <Edit2 size={18} />
                  </button>
                 <button 
                  onClick={() => setShowAddSubFor(task.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all hover:scale-110",
                    settings.theme === 'light' ? "bg-slate-50 text-slate-400 hover:text-sky-500 border-slate-200 shadow-sm" : "bg-slate-900 text-slate-500 hover:text-sky-400 border-slate-800"
                  )}
                  title={t.addSubTask}
                >
                  <PlusCircle size={20} />
                </button>
                <button 
                  onClick={() => { if(confirm('Kerntaak verwijderen?')) deleteCoreTask(task.id); }}
                  className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all"
                  title={t.delete}
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "p-3 transition-colors ml-2",
                    settings.theme === 'light' ? "text-slate-300 hover:text-slate-900" : "text-slate-700 hover:text-slate-300"
                  )}
                >
                  {expandedTasks.includes(task.id) ? <ChevronDown size={24} className="text-sky-400" /> : <ChevronRight size={24} />}
                </button>
              </div>
            </div>

            {expandedTasks.includes(task.id) && (
              <div className="px-10 pb-10 pt-4 animate-in slide-in-from-top-4 duration-500">
                <div className={cn("h-px w-full mb-8", settings.theme === 'light' ? "bg-slate-100" : "bg-slate-800/50")} />
                
                {showAddSubFor === task.id && (
            <div className={cn(
              "mb-8 flex gap-3 animate-in fade-in zoom-in-95 duration-300",
              settings.theme === 'light' ? "bg-sky-50 border-sky-100 p-2 rounded-3xl shadow-sm" : ""
            )}>
              <input 
                type="text" 
                placeholder="Naam van de subtaak..."
                className={cn(
                  "flex-1 border rounded-2xl p-4 text-sm outline-none focus:ring-1 focus:ring-sky-400 transition-all",
                  settings.theme === 'light' ? "bg-white border-sky-100 text-slate-950" : "bg-slate-950/50 border-slate-800 text-white"
                )}
                      value={newSubTaskName}
                      autoFocus
                      onChange={(e) => setNewSubTaskName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask(task.id)}
                    />
                    <button 
                      onClick={() => handleAddSubTask(task.id)}
                      className="px-6 py-4 bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                    >
                      OK
                    </button>
                    <button 
                      onClick={() => setShowAddSubFor(null)} 
                      className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-red-500 transition-colors"
                    >
                      X
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {task.subTasks.map(sub => (
                    <div key={sub.id} className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border group/item transition-all",
                      settings.theme === 'light' ? "bg-slate-50/50 border-slate-100 hover:border-sky-100" : "bg-slate-950/40 border-slate-800/50 hover:border-slate-600"
                    )}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500/50 blur-[1px]" />
                        {editingSubTaskId?.id === sub.id ? (
                          <input 
                            className={cn(
                              "flex-1 border rounded-lg px-3 py-1 text-sm font-bold outline-none",
                              settings.theme === 'light' ? "bg-white border-sky-300 text-slate-900" : "bg-slate-950 border-sky-500 text-white"
                            )}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            onBlur={() => saveEditSubTask(task.id, sub.id)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditSubTask(task.id, sub.id)}
                          />
                        ) : (
                          <span className={cn("text-sm font-bold", settings.theme === 'light' ? "text-slate-600" : "text-slate-300")}>{sub.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => startEditSubTask(task.id, sub)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            settings.theme === 'light' ? "bg-white text-slate-400 hover:text-sky-500 border border-slate-200" : "bg-slate-900 text-slate-700 hover:text-sky-400"
                          )}
                          title={t.edit}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Subtaak verwijderen?')) deleteSubCoreTask(task.id, sub.id); }}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            settings.theme === 'light' ? "bg-white text-slate-400 hover:text-red-500 border border-slate-200" : "bg-slate-900 text-slate-700 hover:text-red-500"
                          )}
                          title={t.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {task.subTasks.length === 0 && !showAddSubFor && (
                    <div className="col-span-full py-10 text-center text-xs text-slate-500 italic font-bold tracking-widest uppercase opacity-40">Geen sub-taken gevonden.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {coreTasks.length === 0 && (
          <div className={cn(
            "py-32 glass rounded-[3rem] border text-center flex flex-col items-center gap-8 shadow-inner",
            settings.theme === 'light' ? "bg-white border-slate-100 shadow-slate-200/50" : "bg-slate-900/40 border-slate-800 shadow-black/50"
          )}>
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center border opacity-20 shadow-2xl",
              settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
            )}>
               <Layers size={40} className={settings.theme === 'light' ? "text-slate-950" : "text-white"} />
            </div>
            <p className="text-slate-500 text-sm italic font-black uppercase tracking-[0.4em]">Geen kerntaken gedefinieerd</p>
          </div>
        )}
      </div>
   </div>
  );
};

export default CoreTasks;
