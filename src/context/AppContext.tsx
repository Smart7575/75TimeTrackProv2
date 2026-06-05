import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, TimeEntry, CoreTask, Settings, TabType, 
  Language, Theme, Classification, Client, ContactPerson,
  ProjectActivity, SubProject
} from '../types';
import { auth, db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const generateId = () => Math.random().toString(36).substr(2, 9);

interface AppState {
  projects: Project[];
  clients: Client[];
  entries: TimeEntry[];
  coreTasks: CoreTask[];
  settings: Settings;
  activeTab: TabType;
  activeTimer: {
    startTime: Date;
    projectId: string;
    activityId: string;
    subProjectId?: string;
    notes: string;
  } | null;
  isInitialLoading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  setProjects: (projects: Project[]) => void;
  addProject: (project: Omit<Project, 'id' | 'activities'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string, reassignToId?: string) => void;
  archiveProject: (id: string) => void;
  
  addClient: (client: Omit<Client, 'id' | 'contactPersons'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  archiveClient: (id: string) => void;
  addContactPerson: (clientId: string, person: Omit<ContactPerson, 'id'>) => void;
  deleteContactPerson: (clientId: string, personId: string) => void;
  
  addActivity: (projectId: string, activity: Omit<import('../types').ProjectActivity, 'id'>) => void;
  updateActivity: (projectId: string, activityId: string, activity: Partial<import('../types').ProjectActivity>) => void;
  deleteActivity: (projectId: string, activityId: string, reassignToId?: string) => void;
  archiveActivity: (projectId: string, activityId: string) => void;

  addSubProject: (projectId: string, name: string) => void;
  updateSubProject: (projectId: string, subProjectId: string, name: string) => void;
  deleteSubProject: (projectId: string, subProjectId: string) => void;

  addEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateEntry: (id: string, entry: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;

  setCoreTasks: (tasks: CoreTask[]) => void;
  addCoreTask: (name: string) => void;
  addSubCoreTask: (parentId: string, name: string) => void;
  updateCoreTask: (id: string, name: string) => void;
  updateSubCoreTask: (parentId: string, id: string, name: string) => void;
  deleteCoreTask: (id: string) => void;
  deleteSubCoreTask: (parentId: string, id: string) => void;

  setSettings: (settings: Partial<Settings>) => void;
  setActiveTab: (tab: TabType) => void;
  
  startTimer: (projectId: string, activityId: string, notes: string, subProjectId?: string) => void;
  stopTimer: () => void;
  cancelTimer: () => void;
}

const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj.toDate === 'function') return obj; // Typically Firestore Timestamp
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  const sanitized: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      sanitized[key] = sanitizeForFirestore(obj[key]);
    }
  });
  return sanitized;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  coreNorm: 80,
  language: 'nl',
  theme: 'light',
  useCoreTasks: true,
  currency: 'EUR',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>({
    projects: [],
    clients: [],
    entries: [],
    coreTasks: [],
    settings: DEFAULT_SETTINGS,
    activeTab: 'dashboard',
    activeTimer: null,
    isInitialLoading: true,
    error: null,
  });

  useEffect(() => {
    const savedTimer = localStorage.getItem('active_timer');
    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        const startTime = new Date(parsed.startTime);
        if (!isNaN(startTime.getTime())) {
          setState(s => ({
            ...s,
            activeTimer: {
              ...parsed,
              startTime
            }
          }));
        } else {
          localStorage.removeItem('active_timer');
        }
      } catch (e) {
        localStorage.removeItem('active_timer');
      }
    }
  }, []);

  useEffect(() => {
    if (state.activeTimer) {
      localStorage.setItem('active_timer', JSON.stringify(state.activeTimer));
    } else {
      localStorage.removeItem('active_timer');
    }
  }, [state.activeTimer]);

  useEffect(() => {
    if (!user) {
      setState(s => ({ ...s, projects: [], clients: [], entries: [], coreTasks: [], isInitialLoading: false }));
      return;
    }

    const userId = user.uid;
    const projectsPath = `users/${userId}/projects`;
    const clientsPath = `users/${userId}/clients`;
    const entriesPath = `users/${userId}/entries`;
    const tasksPath = `users/${userId}/coreTasks`;
    const settingsPath = `users/${userId}/settings/general`;

    const unsubProjects = onSnapshot(collection(db, projectsPath), (snap) => {
      const projects = snap.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          activities: data.activities || [],
          subProjects: data.subProjects || [],
          archived: data.archived || false
        } as Project;
      });
      setState(s => ({ ...s, projects }));
    }, (err) => {
      setState(s => ({ ...s, error: 'Kon projecten niet laden. Controleer je rechten.' }));
      handleFirestoreError(err, OperationType.LIST, projectsPath);
    });

    const unsubClients = onSnapshot(collection(db, clientsPath), (snap) => {
      const clients = snap.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          contactPersons: data.contactPersons || [],
          archived: data.archived || false
        } as Client;
      });
      setState(s => ({ ...s, clients }));
    }, (err) => {
      setState(s => ({ ...s, error: 'Kon klanten niet laden.' }));
      handleFirestoreError(err, OperationType.LIST, clientsPath);
    });

    const unsubEntries = onSnapshot(query(collection(db, entriesPath), orderBy('startTime', 'desc')), (snap) => {
      const entries = snap.docs.map(doc => {
        const data = doc.data();
        const convertDate = (val: any) => {
          if (!val) return undefined;
          let date;
          if (typeof val.toDate === 'function') {
            date = val.toDate();
          } else if (val instanceof Date) {
            date = val;
          } else {
            date = new Date(val);
          }
          return (date instanceof Date && !isNaN(date.getTime())) ? date : undefined;
        };
        return {
          ...data,
          id: doc.id,
          startTime: convertDate(data.startTime),
          endTime: convertDate(data.endTime),
        } as TimeEntry;
      });
      setState(s => ({ ...s, entries }));
    }, (err) => {
      setState(s => ({ ...s, error: 'Kon urenregistraties niet laden.' }));
      handleFirestoreError(err, OperationType.LIST, entriesPath);
    });

    const unsubTasks = onSnapshot(collection(db, tasksPath), (snap) => {
      const coreTasks = snap.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id, subTasks: data.subTasks || [] } as CoreTask;
      });
      setState(s => ({ ...s, coreTasks }));
    }, (err) => {
      setState(s => ({ ...s, error: 'Kon kerntaken niet laden.' }));
      handleFirestoreError(err, OperationType.LIST, tasksPath);
    });

    const unsubSettings = onSnapshot(doc(db, settingsPath), (snap) => {
      if (snap.exists()) {
        setState(s => ({ ...s, settings: { ...DEFAULT_SETTINGS, ...snap.data() } as Settings }));
      } else {
        setDoc(doc(db, settingsPath), DEFAULT_SETTINGS);
      }
      setState(s => ({ ...s, isInitialLoading: false }));
    }, (err) => {
      setState(s => ({ ...s, isInitialLoading: false, error: 'Fout bij het laden van instellingen. Controleer je verbinding.' }));
      handleFirestoreError(err, OperationType.GET, settingsPath);
    });

    const activeTimerPath = `users/${userId}/settings/activeTimer`;
    const unsubActiveTimer = onSnapshot(doc(db, activeTimerPath), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        let startTime: Date | undefined;
        if (data.startTime) {
          if (typeof data.startTime.toDate === 'function') {
            startTime = data.startTime.toDate();
          } else {
            startTime = new Date(data.startTime);
          }
        }
        if (startTime && !isNaN(startTime.getTime())) {
          setState(s => ({
            ...s,
            activeTimer: {
              startTime,
              projectId: data.projectId || '',
              activityId: data.activityId || '',
              subProjectId: data.subProjectId || undefined,
              notes: data.notes || '',
            }
          }));
        } else {
          setState(s => ({ ...s, activeTimer: null }));
        }
      } else {
        setState(s => ({ ...s, activeTimer: null }));
      }
    }, (err) => {
      console.error("Error loading active timer:", err);
    });

    return () => {
      unsubProjects();
      unsubClients();
      unsubEntries();
      unsubTasks();
      unsubSettings();
      unsubActiveTimer();
    };
  }, [user]);

  useEffect(() => {
    if (state.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings.theme]);

  const setProjects = () => {};

  const addProject = async (projectData: Omit<Project, 'id' | 'activities'>) => {
    if (!user) return;
    const path = `users/${user.uid}/projects`;
    try {
      await addDoc(collection(db, path), sanitizeForFirestore({
        ...projectData,
        activities: [],
        subProjects: [],
        archived: false
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    if (!user) return;
    const path = `users/${user.uid}/projects/${id}`;
    try {
      await updateDoc(doc(db, path), sanitizeForFirestore(projectData));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const archiveProject = async (id: string) => {
    await updateProject(id, { archived: true });
  };

  const deleteProject = async (id: string, reassignToId?: string) => {
    if (!user) return;
    const projectPath = `users/${user.uid}/projects/${id}`;
    const entriesPath = `users/${user.uid}/entries`;

    try {
      const affectedEntries = state.entries.filter(e => e.projectId === id);
      for (const entry of affectedEntries) {
        if (reassignToId) {
          await updateDoc(doc(db, `${entriesPath}/${entry.id}`), { projectId: reassignToId });
        } else {
          await deleteDoc(doc(db, `${entriesPath}/${entry.id}`));
        }
      }
      await deleteDoc(doc(db, projectPath));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, projectPath);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'contactPersons'>) => {
    if (!user) return;
    const path = `users/${user.uid}/clients`;
    try {
      await addDoc(collection(db, path), sanitizeForFirestore({
        ...clientData,
        contactPersons: [],
        archived: false
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    if (!user) return;
    const path = `users/${user.uid}/clients/${id}`;
    try {
      await updateDoc(doc(db, path), sanitizeForFirestore(clientData));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const archiveClient = async (id: string) => {
    await updateClient(id, { archived: true });
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/clients/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const addContactPerson = async (clientId: string, personData: Omit<ContactPerson, 'id'>) => {
    if (!user) return;
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    const path = `users/${user.uid}/clients/${clientId}`;
    try {
      await updateDoc(doc(db, path), {
        contactPersons: [...client.contactPersons, sanitizeForFirestore({ ...personData, id: generateId() })]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteContactPerson = async (clientId: string, personId: string) => {
    if (!user) return;
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    const path = `users/${user.uid}/clients/${clientId}`;
    try {
      await updateDoc(doc(db, path), {
        contactPersons: client.contactPersons.filter(p => p.id !== personId).map(p => sanitizeForFirestore(p))
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const addActivity = async (projectId: string, activityData: Omit<ProjectActivity, 'id'>) => {
    if (!user) return;
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    const path = `users/${user.uid}/projects/${projectId}`;
    try {
      const newActivity = sanitizeForFirestore({ ...activityData, id: generateId(), archived: false });
      await updateDoc(doc(db, path), {
        activities: [...(project.activities || []), newActivity]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateActivity = async (projectId: string, activityId: string, activityData: Partial<ProjectActivity>) => {
    if (!user) return;
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    const path = `users/${user.uid}/projects/${projectId}`;
    try {
      const sanitizedData = sanitizeForFirestore(activityData);
      await updateDoc(doc(db, path), {
        activities: (project.activities || []).map(a => a.id === activityId ? sanitizeForFirestore({ ...a, ...sanitizedData }) : a)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteActivity = async (projectId: string, activityId: string, reassignToId?: string) => {
    if (!user) return;
    const projectPath = `users/${user.uid}/projects/${projectId}`;
    const entriesPath = `users/${user.uid}/entries`;
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      const affectedEntries = state.entries.filter(e => e.projectId === projectId && e.activityId === activityId);
      for (const entry of affectedEntries) {
        if (reassignToId) {
          await updateDoc(doc(db, `${entriesPath}/${entry.id}`), { activityId: reassignToId });
        } else {
          await deleteDoc(doc(db, `${entriesPath}/${entry.id}`));
        }
      }
      await updateDoc(doc(db, projectPath), {
        activities: (project.activities || []).filter(a => a.id !== activityId).map(a => sanitizeForFirestore(a))
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, projectPath);
    }
  };

  const archiveActivity = async (projectId: string, activityId: string) => {
    await updateActivity(projectId, activityId, { archived: true });
  };

  const addSubProject = async (projectId: string, name: string) => {
    if (!user) return;
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    const path = `users/${user.uid}/projects/${projectId}`;
    try {
      const newSubProject = sanitizeForFirestore({ id: generateId(), name, archived: false });
      await updateDoc(doc(db, path), {
        subProjects: [...(project.subProjects || []), newSubProject]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateSubProject = async (projectId: string, subProjectId: string, name: string) => {
    if (!user) return;
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    const path = `users/${user.uid}/projects/${projectId}`;
    try {
      await updateDoc(doc(db, path), {
        subProjects: (project.subProjects || []).map(sp => sp.id === subProjectId ? sanitizeForFirestore({ ...sp, name }) : sp)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteSubProject = async (projectId: string, subProjectId: string) => {
    if (!user) return;
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    const path = `users/${user.uid}/projects/${projectId}`;
    const entriesPath = `users/${user.uid}/entries`;
    try {
      const affectedEntries = state.entries.filter(e => e.projectId === projectId && e.subProjectId === subProjectId);
      for (const entry of affectedEntries) {
        await updateDoc(doc(db, `${entriesPath}/${entry.id}`), { subProjectId: "" });
      }
      await updateDoc(doc(db, path), {
        subProjects: (project.subProjects || []).filter(sp => sp.id !== subProjectId).map(sp => sanitizeForFirestore(sp))
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const addEntry = async (entryData: Omit<TimeEntry, 'id'>) => {
    if (!user) return;
    const path = `users/${user.uid}/entries`;
    try {
      await addDoc(collection(db, path), sanitizeForFirestore(entryData));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateEntry = async (id: string, entryData: Partial<TimeEntry>) => {
    if (!user) return;
    const path = `users/${user.uid}/entries/${id}`;
    try {
      await updateDoc(doc(db, path), sanitizeForFirestore(entryData));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/entries/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const setCoreTasks = () => {};

  const addCoreTask = async (name: string) => {
    if (!user) return;
    const path = `users/${user.uid}/coreTasks`;
    try {
      await addDoc(collection(db, path), sanitizeForFirestore({ name, subTasks: [] }));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const addSubCoreTask = async (parentId: string, name: string) => {
    if (!user) return;
    const task = state.coreTasks.find(t => t.id === parentId);
    if (!task) return;
    const path = `users/${user.uid}/coreTasks/${parentId}`;
    try {
      await updateDoc(doc(db, path), {
        subTasks: [...task.subTasks, sanitizeForFirestore({ id: generateId(), name })]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateCoreTask = async (id: string, name: string) => {
    if (!user) return;
    const path = `users/${user.uid}/coreTasks/${id}`;
    try {
      await updateDoc(doc(db, path), sanitizeForFirestore({ name }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateSubCoreTask = async (parentId: string, id: string, name: string) => {
    if (!user) return;
    const task = state.coreTasks.find(t => t.id === parentId);
    if (!task) return;
    const path = `users/${user.uid}/coreTasks/${parentId}`;
    try {
      await updateDoc(doc(db, path), {
        subTasks: task.subTasks.map(st => st.id === id ? sanitizeForFirestore({ ...st, name }) : st)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteCoreTask = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/coreTasks/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const deleteSubCoreTask = async (parentId: string, id: string) => {
    if (!user) return;
    const task = state.coreTasks.find(t => t.id === parentId);
    if (!task) return;
    const path = `users/${user.uid}/coreTasks/${parentId}`;
    try {
      await updateDoc(doc(db, path), {
        subTasks: task.subTasks.filter(st => st.id !== id).map(st => sanitizeForFirestore(st))
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const setSettings = async (settings: Partial<Settings>) => {
    if (!user) return;
    const path = `users/${user.uid}/settings/general`;
    try {
      await setDoc(doc(db, path), sanitizeForFirestore({ ...state.settings, ...settings }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const setActiveTab = (activeTab: TabType) => setState(s => ({ ...s, activeTab }));

  const startTimer = async (projectId: string, activityId: string, notes: string, subProjectId?: string) => {
    if (!user) return;
    const path = `users/${user.uid}/settings/activeTimer`;
    try {
      const activeTimerData = {
        startTime: new Date(),
        projectId,
        activityId,
        subProjectId: subProjectId || null,
        notes: notes || ""
      };
      await setDoc(doc(db, path), sanitizeForFirestore(activeTimerData));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const stopTimer = async () => {
    if (!state.activeTimer || !user) return;
    const endTime = new Date();
    const durationInMinutes = Math.round((endTime.getTime() - state.activeTimer.startTime.getTime()) / 60000);
    const project = state.projects.find(p => p.id === state.activeTimer?.projectId);
    const activity = project?.activities.find(a => a.id === state.activeTimer?.activityId);
    
    await addEntry({
      projectId: state.activeTimer.projectId,
      activityId: state.activeTimer.activityId,
      subProjectId: state.activeTimer.subProjectId || undefined,
      notes: state.activeTimer.notes,
      startTime: state.activeTimer.startTime,
      endTime,
      classification: activity?.classification || 'core',
      durationInMinutes
    });

    const path = `users/${user.uid}/settings/activeTimer`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const cancelTimer = async () => {
    if (!user) return;
    const path = `users/${user.uid}/settings/activeTimer`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  if (state.error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full glass p-8 rounded-3xl border border-red-500/30 text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 italic uppercase tracking-tight">Er is iets misgegaan</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-bold uppercase tracking-widest text-[10px]">{state.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (state.isInitialLoading && user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Data laden...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      ...state,
      setProjects,
      addProject,
      updateProject,
      deleteProject,
      archiveProject,
      addClient,
      updateClient,
      deleteClient,
      archiveClient,
      addContactPerson,
      deleteContactPerson,
      addActivity,
      updateActivity,
      deleteActivity,
      archiveActivity,
      addSubProject,
      updateSubProject,
      deleteSubProject,
      addEntry,
      updateEntry,
      deleteEntry,
      setCoreTasks,
      addCoreTask,
      addSubCoreTask,
      updateCoreTask,
      updateSubCoreTask,
      deleteCoreTask,
      deleteSubCoreTask,
      setSettings,
      setActiveTab,
      startTimer,
      stopTimer,
      cancelTimer,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
