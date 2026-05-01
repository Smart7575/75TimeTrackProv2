import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, UserPlus, Key, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Ongeldige e-mail of wachtwoord.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Dit e-mailadres is al in gebruik.');
      } else if (err.code === 'auth/weak-password') {
        setError('Het wachtwoord is te zwak.');
      } else {
        setError('Er is een fout opgetreden. Probeer het opnieuw.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        // Do nothing if user closed the popup
      } else {
        setError('Google login is mislukt. Probeer het opnieuw.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Vul eerst je e-mailadres in.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError(null);
    } catch (err: any) {
      setError('Kon herstel e-mail niet verzenden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2 underline decoration-sky-500/30 underline-offset-8">
            75TimeTrackPro
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Professional Time Tracking</p>
        </div>

        <div className="glass glass rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                isLogin ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <LogIn size={14} strokeWidth={3} />
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                !isLogin ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <UserPlus size={14} strokeWidth={3} />
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
              {resetSent && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-500 text-xs font-bold"
                >
                  <Mail size={16} />
                  Herstel e-mail is verzonden!
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mailadres</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="naam@voorbeeld.nl"
                  className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm placeholder:text-slate-700 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Wachtwoord</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm placeholder:text-slate-700 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isLogin && (
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] font-black text-slate-500 hover:text-sky-400 uppercase tracking-widest transition-colors mt-1 pr-1"
                  >
                    Wachtwoord vergeten?
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} strokeWidth={3} /> : <UserPlus size={18} strokeWidth={3} />}
                  {isLogin ? 'Inloggen' : 'Account Aanmaken'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">of</span>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>

          {/* Google Login */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white border border-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Inloggen met Google
          </button>

          {/* Footer Info */}
          <div className="mt-10 border-t border-slate-800 pt-6 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] leading-relaxed">
              Doorgaan betekent akkoord met de <br />
              <span className="text-slate-400 hover:text-sky-400 cursor-pointer transition-colors">Gebruiksvoorwaarden</span> en <span className="text-slate-400 hover:text-sky-400 cursor-pointer transition-colors">Privacybeleid</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
