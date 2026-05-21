import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back, Agent!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Authentication sequence failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="w-full max-w-[450px] relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/5 backdrop-blur-2xl px-6 md:px-10 py-10 md:py-16 rounded-3xl md:rounded-[40px] border border-white/10 shadow-2xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic mb-2">
              Manpreet
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] opacity-60">Terminal Authentication</p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
               <div className="group">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">Access Terminal</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all font-bold text-sm"
                    placeholder="agent@manpreet.crm"
                  />
               </div>

               <div className="group">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-blue-400 transition-colors">Encrypted Key</label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
               </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden rounded-2xl bg-white p-4 text-sm font-black uppercase tracking-widest text-slate-900 shadow-xl transition-all hover:shadow-white/10 active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <span className="relative z-10">{isLoading ? 'Validating...' : 'Authorize Access'}</span>
              </button>
            </div>
          </form>
          
          <div className="mt-12 text-center">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Authorized Personnel Only</p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-40">System Version 4.2.0 • Build ID #8921</p>
      </div>
    </div>
  );
}
