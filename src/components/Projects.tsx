import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  Plus, 
  Settings2, 
  Trash2, 
  Edit3,
  ChevronDown, 
  ChevronRight,
  PlusCircle,
  Briefcase,
  Target,
  Users,
  DollarSign,
  AlertTriangle,
  Archive,
  ArrowRight,
  Play,
  ChevronsUpDown,
  ChevronsDownUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Classification, Project, ProjectActivity } from '../types';

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'project' | 'activity';
  projectName: string;
  activityName?: string;
  onConfirm: (action: 'delete' | 'archive', reassignToId?: string) => void;
  otherOptions: { id: string; name: string }[];
  affectedEntriesCount: number;
}> = ({ isOpen, onClose, type, projectName, activityName, onConfirm, otherOptions, affectedEntriesCount }) => {
  const { settings } = useApp();
  const t = translations[settings.language];
  const [action, setAction] = useState<'delete' | 'archive'>('delete');
  const [reassignToId, setReassignToId] = useState<string>('');

  if (!isOpen) return null;

  const deleteMsg = settings.language === 'nl' 
    ? `Je staat op het punt om ${type === 'project' ? `project "${projectName}"` : `activiteit "${activityName}"`} te verwijderen.`
    : `You are about to delete ${type === 'project' ? `project "${projectName}"` : `activity "${activityName || ''}"`}.`;

  const warningMsg = affectedEntriesCount > 0
    ? (settings.language === 'nl'
      ? `LET OP: Er zijn ${affectedEntriesCount} urenregels die hiermee verbonden zijn.`
      : `WARNING: There are ${affectedEntriesCount} time entries connected to this.`)
    : (settings.language === 'nl'
      ? `Er zijn geen urenregels verbonden aan dit item.`
      : `There are no time entries connected to this item.`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass glass rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl max-w-md w-full relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-6">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-2">{t.confirmDeletion}</h3>
          <p className="text-sm text-slate-400 mb-8 font-medium">
            {deleteMsg}
            <span className={cn("block mt-2 font-black", affectedEntriesCount > 0 ? "text-red-400" : "text-emerald-500")}>
              {warningMsg}
            </span>
          </p>

          <div className="w-full space-y-4 mb-10">
            <button 
              onClick={() => setAction('delete')}
              className={cn(
                "w-full p-4 rounded-2xl border flex items-center justify-between transition-all group",
                action === 'delete' ? "bg-red-500/10 border-red-500 text-red-500" : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
              )}
            >
              <div className="flex items-center gap-3">
                <Trash2 size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.hardDelete}</span>
              </div>
              <div className={cn("w-4 h-4 rounded-full border-2", action === 'delete' ? "bg-red-500 border-white/20" : "border-slate-700")} />
            </button>

            <button 
              onClick={() => setAction('archive')}
              className={cn(
                "w-full p-4 rounded-2xl border flex items-center justify-between transition-all group",
                action === 'archive' ? "bg-sky-500/10 border-sky-500 text-sky-400" : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
              )}
            >
              <div className="flex items-center gap-3">
                <Archive size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.archive}</span>
              </div>
              <div className={cn("w-4 h-4 rounded-full border-2", action === 'archive' ? "bg-sky-500 border-white/20" : "border-slate-700")} />
            </button>

            {action === 'delete' && otherOptions.length > 0 && (
              <div className="pt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left ml-4">{t.reassignTo}</p>
                <div className="relative group">
                  <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400" size={16} />
                  <select 
                    value={reassignToId}
                    onChange={(e) => setReassignToId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-[10px] font-black uppercase tracking-widest text-white appearance-none"
                  >
                    <option value="" className="bg-slate-900">{t.doNotReassign}</option>
                    {otherOptions.map(opt => (
                      <option key={opt.id} value={opt.id} className="bg-slate-900">{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex w-full gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={() => onConfirm(action, reassignToId || undefined)}
              className={cn(
                "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95",
                action === 'delete' ? "bg-red-500 text-white shadow-red-500/20" : "bg-sky-500 text-slate-950 shadow-sky-500/20"
              )}
            >
              {t.definitief}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Projects: React.FC = () => {
  const { 
    projects, clients, entries, coreTasks, settings, 
    addProject, updateProject, deleteProject, archiveProject,
    addActivity, updateActivity, deleteActivity, archiveActivity,
    addSubProject, updateSubProject, deleteSubProject,
    startTimer
  } = useApp();
  const t = translations[settings.language];
  
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'project' | 'activity';
    projectId: string;
    activityId?: string;
    projectName: string;
    activityName?: string;
  } | null>(null);

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    clientId: '',
    budget: '' as string | number,
    rate: '' as string | number,
    color: '#38bdf8'
  });

  const [newActivity, setNewActivity] = useState<{
    id?: string;
    projectId: string;
    name: string;
    classification: Classification;
    coreSubTaskId: string;
  } | null>(null);

  const [newSubProject, setNewSubProject] = useState<{
    id?: string;
    projectId: string;
    name: string;
  } | null>(null);

  const filteredProjects = projects
    .filter(p => !p.archived)
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (expandedProjects.length === filteredProjects.length) {
      setExpandedProjects([]);
    } else {
      setExpandedProjects(filteredProjects.map(p => p.id));
    }
  };

  const handleAddProject = () => {
    if (!newProject.name) return;
    
    if (editingProject) {
      updateProject(editingProject.id, {
        ...newProject,
        budget: Number(newProject.budget) || 0,
        rate: Number(newProject.rate) || 0
      });
    } else {
      addProject({
        ...newProject,
        budget: Number(newProject.budget) || 0,
        rate: Number(newProject.rate) || 0
      });
    }
    
    setNewProject({ name: '', client: '', clientId: '', budget: '', rate: '', color: '#38bdf8' });
    setIsAddProjectOpen(false);
    setEditingProject(null);
  };

  const handleAddActivity = () => {
    if (!newActivity || !newActivity.name) return;
    
    if (newActivity.id) {
      updateActivity(newActivity.projectId, newActivity.id, {
        name: newActivity.name,
        classification: newActivity.classification,
        coreSubTaskId: newActivity.coreSubTaskId || ''
      });
    } else {
      addActivity(newActivity.projectId, {
        name: newActivity.name,
        classification: newActivity.classification,
        coreSubTaskId: newActivity.coreSubTaskId || ''
      });
    }
    
    setNewActivity(null);
  };

  const handleAddSubProject = () => {
    if (!newSubProject || !newSubProject.name) return;
    
    if (newSubProject.id) {
      updateSubProject(newSubProject.projectId, newSubProject.id, newSubProject.name);
    } else {
      addSubProject(newSubProject.projectId, newSubProject.name);
    }
    
    setNewSubProject(null);
  };

  const executeDeleteAction = (action: 'delete' | 'archive', reassignToId?: string) => {
    if (!deleteDialog) return;

    if (deleteDialog.type === 'project') {
      if (action === 'archive') {
        archiveProject(deleteDialog.projectId);
      } else {
        deleteProject(deleteDialog.projectId, reassignToId);
      }
    } else {
      if (action === 'archive') {
        archiveActivity(deleteDialog.projectId, deleteDialog.activityId!);
      } else {
        deleteActivity(deleteDialog.projectId, deleteDialog.activityId!, reassignToId);
      }
    }
    setDeleteDialog(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <DeleteConfirmationModal 
        isOpen={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        type={deleteDialog?.type || 'project'}
        projectName={deleteDialog?.projectName || ''}
        activityName={deleteDialog?.activityName}
        onConfirm={executeDeleteAction}
        affectedEntriesCount={
          deleteDialog?.type === 'project'
            ? entries.filter(e => e.projectId === deleteDialog.projectId).length
            : entries.filter(e => e.projectId === deleteDialog?.projectId && e.activityId === deleteDialog.activityId).length
        }
        otherOptions={
          deleteDialog?.type === 'project' 
            ? projects.filter(p => p.id !== deleteDialog.projectId && !p.archived).slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => ({ id: p.id, name: p.name }))
            : projects.find(p => p.id === deleteDialog?.projectId)?.activities.filter(a => a.id !== deleteDialog.activityId && !a.archived).slice().sort((a, b) => a.name.localeCompare(b.name)).map(a => ({ id: a.id, name: a.name })) || []
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl shadow-xl border",
            settings.theme === 'light' ? "bg-white border-sky-100 text-sky-500 shadow-sky-100/50" : "bg-slate-900 border-slate-800 text-sky-400"
          )}>
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className={cn("text-2xl font-black tracking-tight italic uppercase", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.projects}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{t.managePortfolio}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleAll}
            className={cn(
              "flex items-center gap-2 px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border",
              settings.theme === 'light' 
                ? "bg-white border-slate-200 text-slate-500 hover:text-sky-500" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-sky-400"
            )}
            title={expandedProjects.length === filteredProjects.length ? t.collapseAll : t.expandAll}
          >
            {expandedProjects.length === filteredProjects.length ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
            <span className="hidden sm:inline">{expandedProjects.length === filteredProjects.length ? t.collapseAll : t.expandAll}</span>
          </button>
          <button 
            onClick={() => {
              setEditingProject(null);
              setNewProject({ name: '', client: '', clientId: '', budget: '', rate: '', color: '#38bdf8' });
              setIsAddProjectOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-4 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-sky-500/20"
          >
            <Plus size={20} strokeWidth={3} />
            {t.addProject}
          </button>
        </div>
      </div>

      {/* Add Project Modal/Form */}
      {isAddProjectOpen && (
        <div className={cn(
          "glass rounded-[2.5rem] p-10 shadow-2xl border animate-in zoom-in-95 duration-500 relative overflow-hidden",
          settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
        )}>
           <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none" />
           
           <div className="relative z-10">
              <h3 className={cn("text-xl font-black uppercase tracking-widest italic mb-8 underline underline-offset-8 decoration-sky-500/30", settings.theme === 'light' ? "text-slate-950" : "text-white")}>{t.addProject}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.projectName}</label>
                  <input 
                    type="text" 
                    placeholder="Bijv. Project X"
                    className={cn(
                      "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-400",
                      settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                    )}
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.client}</label>
                  <select 
                    className={cn(
                      "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all appearance-none",
                      settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                    )}
                    value={newProject.clientId}
                    onChange={(e) => {
                      const selectedClient = clients.find(c => c.id === e.target.value);
                      setNewProject({
                        ...newProject, 
                        clientId: e.target.value,
                        client: selectedClient ? selectedClient.name : ''
                      });
                    }}
                  >
                    <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>Selecteer opdrachtgever</option>
                    {clients.filter(c => !c.archived).map(client => (
                      <option key={client.id} value={client.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.budget} (uur)</label>
                  <input 
                    type="number" 
                    className={cn(
                      "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all",
                      settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                    )}
                    value={newProject.budget}
                    onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.rate} (€/uur)</label>
                  <input 
                    type="number" 
                    className={cn(
                      "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all",
                      settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                    )}
                    value={newProject.rate}
                    onChange={(e) => setNewProject({...newProject, rate: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.color}</label>
                      <div className={cn(
                    "flex border rounded-2xl p-4 gap-4 items-center",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100" : "bg-slate-950/50 border-slate-800"
                  )}>
                    {['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#fbbf24', '#34d399'].map(color => (
                        <button
                          key={color}
                          onClick={() => setNewProject({...newProject, color})}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all hover:scale-125 hover:shadow-lg hover:shadow-current",
                            newProject.color === color ? "ring-2 ring-white ring-offset-4 ring-offset-slate-950 scale-110 shadow-xl shadow-white/10" : ""
                          )}
                          style={{ backgroundColor: color }}
                        />
                    ))}
                    <div className="flex-1" />
                    <input 
                      type="color" 
                      className="h-10 w-10 bg-transparent border-none cursor-pointer rounded-full overflow-hidden" 
                      value={newProject.color}
                      onChange={(e) => setNewProject({...newProject, color: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-10 gap-4">
                <button 
                  onClick={() => {
                    setIsAddProjectOpen(false);
                    setEditingProject(null);
                  }}
                  className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleAddProject}
                  className="px-10 py-4 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                >
                  {editingProject ? 'Bijwerken' : t.save}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Projects List */}
      <div className="grid gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className={cn(
            "glass rounded-[2.5rem] border overflow-hidden shadow-xl transition-all group",
            settings.theme === 'light' ? "bg-white border-slate-200 hover:border-sky-200" : "bg-slate-900/40 border-slate-800 hover:border-slate-600"
          )}>
            <div 
              className="p-8 flex items-center justify-between cursor-pointer"
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center gap-6">
                <div className="w-2 h-12 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ backgroundColor: project.color }} />
                <div>
                  <h3 className={cn("font-black text-xl italic tracking-tight uppercase", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{project.name}</h3>
                  <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <span className="flex items-center gap-2"><Users size={14} className={settings.theme === 'light' ? "text-slate-400" : "text-slate-600"}/> {project.client || 'Geen Klant'}</span>
                    <span className="flex items-center gap-2"><Target size={14} className={settings.theme === 'light' ? "text-slate-400" : "text-slate-600"}/> {project.budget} Uur Budget</span>
                    <span className="flex items-center gap-2"><DollarSign size={14} className={settings.theme === 'light' ? "text-slate-400" : "text-slate-600"}/> €{project.rate}/Uur</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(project);
                    setNewProject({
                      name: project.name,
                      client: project.client || '',
                      clientId: project.clientId || '',
                      budget: project.budget,
                      rate: project.rate,
                      color: project.color
                    });
                    setIsAddProjectOpen(true);
                  }}
                  className="p-3 bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-slate-950 rounded-xl border border-sky-500/20 transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setDeleteDialog({
                      type: 'project',
                      projectId: project.id,
                      projectName: project.name
                    });
                  }}
                  className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all"
                >
                  <Trash2 size={18} />
                </button>
            <div className={cn(
                  "p-3 rounded-full border transition-transform duration-500",
                  settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-sky-500 shadow-sm" : "bg-slate-900 border-slate-800 text-slate-400",
                  expandedProjects.includes(project.id) ? "rotate-180 text-sky-400" : ""
                )}>
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

          {expandedProjects.includes(project.id) && (
            <div className="px-10 pb-10 pt-0 animate-in slide-in-from-top-4 duration-500">
              <div className={cn("h-px w-full mb-10", settings.theme === 'light' ? "bg-slate-100" : "bg-slate-800/50")} />
              
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Activiteiten</h4>
                <button 
                  onClick={() => {
                    if (newActivity) setNewActivity(null);
                    else setNewActivity({ projectId: project.id, name: '', classification: 'core', coreSubTaskId: '' });
                  }}
                  className={cn(
                    "text-[10px] font-black flex items-center gap-3 px-5 py-2 border rounded-xl uppercase tracking-widest transition-all shadow-lg",
                    settings.theme === 'light' ? "bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-slate-200" : "bg-slate-900 border-slate-800 text-white hover:bg-slate-800"
                  )}
                >
                  <PlusCircle size={16} className="text-sky-400" />
                  {t.addActivity}
                </button>
              </div>

              {newActivity?.projectId === project.id && (
                <div className={cn(
                  "mb-8 p-8 rounded-[2rem] border space-y-6 animate-in fade-in zoom-in-95 duration-300",
                  settings.theme === 'light' ? "bg-sky-50 border-sky-100" : "bg-slate-950/80 border-slate-800"
                )}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{t.activityName}</label>
                      <input 
                        type="text" 
                        placeholder="Bijv. Webdesign"
                        className={cn(
                          "w-full border rounded-2xl p-4 text-sm outline-none focus:ring-1 focus:ring-sky-400 transition-all",
                          settings.theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/50 border-slate-800 text-white"
                        )}
                        value={newActivity.name}
                        onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                      />
                    </div>
                    {settings.useCoreTasks && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{t.classification}</label>
                          <select 
                            className={cn(
                              "w-full border rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none appearance-none",
                              settings.theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/50 border-slate-800 text-white"
                            )}
                            value={newActivity.classification}
                            onChange={(e) => setNewActivity({...newActivity, classification: e.target.value as Classification})}
                          >
                            <option value="core" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.core}</option>
                            <option value="additional" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>{t.additional}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{t.linkedToCore}</label>
                          <select 
                            className={cn(
                              "w-full border rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none appearance-none",
                              settings.theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/50 border-slate-800 text-white"
                            )}
                            value={newActivity.coreSubTaskId}
                            onChange={(e) => setNewActivity({...newActivity, coreSubTaskId: e.target.value})}
                          >
                            <option value="" className={settings.theme === 'light' ? "bg-white" : "bg-slate-900"}>Geen Link</option>
                            {coreTasks.map(task => (
                              <optgroup key={task.id} label={task.name} className={settings.theme === 'light' ? "bg-slate-100" : "bg-slate-900 font-bold text-slate-400"}>
                                {task.subTasks.map(sub => (
                                  <option key={sub.id} value={sub.id} className={settings.theme === 'light' ? "bg-white" : "bg-slate-900 text-white font-normal"}>{sub.name}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-end gap-4">
                     <button onClick={() => setNewActivity(null)} className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-sky-500 transition-colors">{t.cancel}</button>
                     <button onClick={handleAddActivity} className="px-8 py-3 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20">{t.save}</button>
                  </div>
                </div>
              )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(project.activities || [])
                    .filter(a => !a.archived)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(activity => (
                    <div key={activity.id} className={cn(
                      "p-5 rounded-2xl border group/item shadow-sm transition-all flex flex-col gap-3",
                      settings.theme === 'light' ? "bg-sky-50/30 border-sky-100 hover:border-sky-300" : "bg-slate-950/40 border-slate-800/50 hover:border-slate-600"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className={cn("font-black text-xs uppercase tracking-tight italic", settings.theme === 'light' ? "text-slate-800" : "text-slate-200")}>{activity.name}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startTimer(project.id, activity.id);
                            }}
                            className={cn(
                              "p-2 transition-all rounded-lg border shadow-sm",
                              settings.theme === 'light' ? "bg-white text-emerald-500 hover:bg-emerald-500 hover:text-white border-emerald-100" : "bg-slate-900 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 border-slate-800"
                            )}
                            title="Start Timer"
                          >
                            <Play size={14} fill="currentColor" />
                          </button>
                          <button 
                            onClick={() => {
                              setNewActivity({
                                id: activity.id,
                                projectId: project.id,
                                name: activity.name,
                                classification: activity.classification,
                                coreSubTaskId: activity.coreSubTaskId || ''
                              });
                            }}
                            className={cn(
                              "p-2 transition-all rounded-lg border shadow-sm",
                              settings.theme === 'light' ? "bg-white text-slate-400 hover:text-sky-500 border-slate-200" : "bg-slate-900 text-slate-700 hover:text-sky-400 border-slate-800"
                            )}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => { 
                              setDeleteDialog({
                                type: 'activity',
                                projectId: project.id,
                                activityId: activity.id,
                                projectName: project.name,
                                activityName: activity.name
                              });
                            }}
                            className={cn(
                              "p-2 transition-all rounded-lg border shadow-sm",
                              settings.theme === 'light' ? "bg-white text-slate-400 hover:text-red-500 border border-slate-200" : "bg-slate-900 text-slate-700 hover:text-red-500 border-slate-800"
                            )}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {settings.useCoreTasks && (
                          <>
                            <span className={cn(
                              "px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-[0.1em]",
                              activity.classification === 'core' 
                                ? "bg-sky-500/20 text-sky-400" 
                                : settings.theme === 'light' ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-500"
                            )}>
                              {activity.classification === 'core' ? t.core : t.additional}
                            </span>
                            {activity.coreSubTaskId && (
                              <span className={cn(
                                "text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter border",
                                settings.theme === 'light' ? "text-slate-400 bg-white border-slate-200" : "text-slate-500 bg-slate-900 border-slate-800"
                              )}>
                                 {coreTasks.flatMap(t => t.subTasks).find(s => s.id === activity.coreSubTaskId)?.name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {(project.activities || []).filter(a => !a.archived).length === 0 && (!newActivity || newActivity.projectId !== project.id) && (
                    <div className="col-span-full py-10 text-center text-xs text-slate-500 italic font-bold tracking-widest uppercase opacity-40">Geen activiteiten gedefinieerd.</div>
                  )}
                </div>

                {/* Subprojects Section */}
                <div className={cn("h-px w-full my-10", settings.theme === 'light' ? "bg-slate-100" : "bg-slate-800/50")} />
                
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{t.subprojects}</h4>
                  <button 
                    onClick={() => {
                      if (newSubProject) setNewSubProject(null);
                      else setNewSubProject({ projectId: project.id, name: '' });
                    }}
                    className={cn(
                      "text-[10px] font-black flex items-center gap-3 px-5 py-2 border rounded-xl uppercase tracking-widest transition-all shadow-lg",
                      settings.theme === 'light' ? "bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-slate-200" : "bg-slate-900 border-slate-800 text-white hover:bg-slate-800"
                    )}
                  >
                    <PlusCircle size={16} className="text-sky-400" />
                    {t.addSubProject}
                  </button>
                </div>

                {newSubProject?.projectId === project.id && (
                  <div className={cn(
                    "mb-8 p-8 rounded-[2rem] border space-y-6 animate-in fade-in zoom-in-95 duration-300",
                    settings.theme === 'light' ? "bg-sky-50 border-sky-100" : "bg-slate-950/80 border-slate-800"
                  )}>
                    <div className="space-y-2 max-w-md">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{t.subProjectName}</label>
                      <input 
                        type="text" 
                        placeholder={t.subprojectNamePlaceholder}
                        className={cn(
                          "w-full border rounded-2xl p-4 text-sm outline-none focus:ring-1 focus:ring-sky-400 transition-all",
                          settings.theme === 'light' ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900/50 border-slate-800 text-white"
                        )}
                        value={newSubProject.name}
                        onChange={(e) => setNewSubProject({...newSubProject, name: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                       <button onClick={() => setNewSubProject(null)} className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-sky-500 transition-colors">{t.cancel}</button>
                       <button onClick={handleAddSubProject} className="px-8 py-3 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-sky-500/20">{t.save}</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(project.subProjects || [])
                    .filter(sp => !sp.archived)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(subproj => (
                    <div key={subproj.id} className={cn(
                      "p-5 rounded-2xl border group/item shadow-sm transition-all flex flex-col gap-3",
                      settings.theme === 'light' ? "bg-sky-50/30 border-sky-100 hover:border-sky-300" : "bg-slate-950/40 border-slate-800/50 hover:border-slate-600"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className={cn("font-black text-xs uppercase tracking-tight italic", settings.theme === 'light' ? "text-slate-800" : "text-slate-200")}>{subproj.name}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setNewSubProject({
                                id: subproj.id,
                                projectId: project.id,
                                name: subproj.name
                              });
                            }}
                            className={cn(
                              "p-2 transition-all rounded-lg border shadow-sm",
                              settings.theme === 'light' ? "bg-white text-slate-400 hover:text-sky-500 border-slate-200" : "bg-slate-900 text-slate-700 hover:text-sky-400 border-slate-800"
                            )}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(settings.language === 'nl' ? 'Subproject verwijderen?' : 'Delete subproject?')) {
                                deleteSubProject(project.id, subproj.id);
                              }
                            }}
                            className={cn(
                              "p-2 transition-all rounded-lg border shadow-sm",
                              settings.theme === 'light' ? "bg-white text-slate-400 hover:text-red-500 border border-slate-200" : "bg-slate-900 text-slate-700 hover:text-red-500 border-slate-800"
                            )}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(project.subProjects || []).filter(sp => !sp.archived).length === 0 && (!newSubProject || newSubProject.projectId !== project.id) && (
                    <div className="col-span-full py-10 text-center text-xs text-slate-500 italic font-bold tracking-widest uppercase opacity-40">{t.noSubProjectsDefined}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <div className={cn(
            "py-32 glass rounded-[3rem] border text-center flex flex-col items-center gap-8 shadow-inner",
            settings.theme === 'light' ? "bg-white border-slate-100 shadow-slate-200/50" : "bg-slate-900/40 border-slate-800 shadow-black/50"
          )}>
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center border opacity-20 shadow-2xl",
              settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
            )}>
               <Briefcase size={40} className={settings.theme === 'light' ? "text-slate-900" : "text-white"} />
            </div>
            <p className="text-slate-500 text-sm italic font-black uppercase tracking-[0.4em]">{t.noProjectsFound}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
