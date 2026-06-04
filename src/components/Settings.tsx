import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  Settings as SettingsIcon, 
  Languages, 
  Sun, 
  Moon, 
  Target,
  Monitor,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Language, Theme } from '../types';

const Settings: React.FC = () => {
  const { settings, setSettings } = useApp();
  const t = translations[settings.language];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "p-3 rounded-2xl shadow-xl border",
          settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        )}>
          <SettingsIcon size={24} className="text-sky-400" />
        </div>
        <div>
          <h2 className={cn("text-2xl font-black tracking-tight italic uppercase", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.settings}</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Configureer je ervaring</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Core Tasks Activation */}
        <section className={cn(
          "glass rounded-[2.5rem] p-10 border shadow-2xl relative overflow-hidden group",
          settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
        )}>
          <div className="flex items-center gap-4 mb-8">
            <div className={cn(
              "w-12 h-12 rounded-2xl border flex items-center justify-center text-sky-400",
              settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
            )}>
              <SettingsIcon size={24} />
            </div>
            <div>
              <h3 className={cn("font-black uppercase tracking-widest italic", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.useCoreTasks}</h3>
              <p className="text-xs text-slate-500 font-bold italic opacity-80">{t.useCoreTasksDesc}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setSettings({ useCoreTasks: true })}
              className={cn(
                "flex-1 p-5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest",
                settings.useCoreTasks 
                  ? "bg-sky-500 border-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 active:scale-95"
                  : settings.theme === 'light'
                    ? "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-700"
              )}
            >
              {settings.language === 'nl' ? 'Ingeschakeld' : 'Enabled'}
            </button>
            <button
              onClick={() => setSettings({ useCoreTasks: false })}
              className={cn(
                "flex-1 p-5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest",
                !settings.useCoreTasks 
                  ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20 active:scale-95"
                  : settings.theme === 'light'
                    ? "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-700"
              )}
            >
              {settings.language === 'nl' ? 'Uitgeschakeld' : 'Disabled'}
            </button>
          </div>
        </section>

        {/* Productivity Norm */}
        {settings.useCoreTasks && (
          <section className={cn(
            "glass rounded-[2.5rem] p-10 border shadow-2xl relative overflow-hidden group",
            settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Target size={160} strokeWidth={1} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className={cn(
                  "w-12 h-12 rounded-2xl border flex items-center justify-center text-sky-400",
                  settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
                )}>
                  <Target size={24} />
                </div>
                <div>
                  <h3 className={cn("font-black text-lg uppercase tracking-widest italic", settings.theme === 'light' ? "text-slate-900" : "text-white")}>Productivity Norm</h3>
                  <p className="text-xs text-slate-500 font-bold italic opacity-80">Definieer het percentage kerntaken dat je per dag wilt behalen.</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className={cn("text-6xl font-black tracking-tighter tabular-nums flex items-end", settings.theme === 'light' ? "text-slate-900" : "text-white")}>
                    {settings.coreNorm}<span className="text-2xl text-slate-500 ml-1 mb-2">%</span>
                  </div>
                  <div className={cn(
                    "text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-3 py-1 rounded-full border",
                    settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
                  )}>Target</div>
                </div>
                
                <div className="relative pt-2 pb-6">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={settings.coreNorm}
                    onChange={(e) => setSettings({ coreNorm: Number(e.target.value) })}
                    className={cn(
                      "w-full h-2 rounded-full appearance-none cursor-pointer accent-sky-500 border",
                      settings.theme === 'light' ? "bg-slate-200 border-slate-300" : "bg-slate-800 border-slate-700/50"
                    )}
                  />
                  <div className="absolute top-8 left-0 right-0 flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Language & Theme Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Language */}
          <section className={cn(
            "glass rounded-[2.5rem] p-10 border shadow-2xl",
            settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <div className="flex items-center gap-4 mb-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-400",
                settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
              )}>
                <Globe size={24} />
              </div>
              <h3 className={cn("font-black uppercase tracking-widest italic", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.language}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {(['nl', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSettings({ language: lang })}
                  className={cn(
                    "p-5 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest",
                    settings.language === lang 
                      ? "bg-sky-500 border-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 active:scale-95"
                      : settings.theme === 'light'
                        ? "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                        : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  )}
                >
                  {lang === 'nl' ? 'Nederlands' : 'English'}
                </button>
              ))}
            </div>
          </section>

          {/* Theme */}
          <section className={cn(
            "glass rounded-[2.5rem] p-10 border shadow-2xl",
            settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900/40 border-slate-800"
          )}>
            <div className="flex items-center gap-4 mb-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center text-slate-400",
                settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"
              )}>
                <Monitor size={24} />
              </div>
              <h3 className={cn("font-black uppercase tracking-widest italic", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{t.theme}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({ theme: 'light' })}
                className={cn(
                  "p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 font-black text-[10px] uppercase tracking-widest",
                  settings.theme === 'light' 
                    ? "bg-sky-500 border-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 active:scale-95"
                    : settings.theme === 'light'
                      ? "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                      : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                )}
              >
                <Sun size={20} />
                {t.light}
              </button>
              <button
                onClick={() => setSettings({ theme: 'dark' })}
                className={cn(
                  "p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 font-black text-[10px] uppercase tracking-widest",
                  settings.theme === 'dark' 
                    ? "bg-sky-500 border-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 active:scale-95"
                    : settings.theme === 'light'
                      ? "border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                      : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                )}
              >
                <Moon size={20} />
                {t.dark}
              </button>
            </div>
          </section>
        </div>

        {/* Info Card */}
        <div className="accent-gradient rounded-[2.5rem] p-10 flex items-center justify-between overflow-hidden relative shadow-2xl shadow-sky-500/20">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           <div className="relative z-10">
              <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter mb-2 underline decoration-slate-950/20 underline-offset-8">75TimeTrackPro v1.0</h3>
              <p className="text-slate-900 font-bold text-sm max-w-sm opacity-80 leading-relaxed italic">{t.localDataStorageInfo}</p>
           </div>
           <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none" />
           <div className="absolute right-12 top-4 w-28 h-28 bg-white opacity-10 rounded-[2rem] rotate-12 pointer-events-none border border-white/20" />
        </div>
      </div>
    </div>
  );
};

export default Settings;
