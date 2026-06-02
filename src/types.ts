export type Classification = 'core' | 'additional';

export interface CoreSubTask {
  id: string;
  name: string;
}

export interface CoreTask {
  id: string;
  name: string;
  subTasks: CoreSubTask[];
}

export interface ProjectActivity {
  id: string;
  name: string;
  classification: Classification;
  coreSubTaskId?: string; // Link to a sub-core task
  archived?: boolean;
}

export interface SubProject {
  id: string;
  name: string;
  archived?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  client: string;
  clientId?: string;
  budget: number; // in hours
  rate: number; // hourly rate
  activities: ProjectActivity[];
  subProjects?: SubProject[];
  archived?: boolean;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  activityId: string;
  subProjectId?: string;
  notes: string;
  startTime: Date;
  endTime?: Date;
  classification: Classification;
  durationInMinutes: number;
}

export type Language = 'nl' | 'en';
export type Theme = 'light' | 'dark';

export interface Settings {
  coreNorm: number; // percentage, default 80
  language: Language;
  theme: Theme;
  useCoreTasks: boolean;
}

export interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Client {
  id: string;
  name: string;
  postcode: string;
  street: string;
  houseNumber: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  kvk: string;
  contactPersons: ContactPerson[];
  archived?: boolean;
}

export type TabType = 'dashboard' | 'register' | 'projects' | 'clients' | 'core-tasks' | 'calendar' | 'reports' | 'settings';
