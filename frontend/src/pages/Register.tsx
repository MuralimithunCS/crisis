import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { ShieldCheck, Mail, Lock, User, Phone, Briefcase, ArrowRight, Loader2 } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'citizen' | 'responder' | 'admin'>('citizen');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authApi.register({
        email,
        password,
        name,
        phone: phone || undefined,
        role
      });

      login(data.user as any, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 blur-3xl rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/10 blur-3xl rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-md z-10 mt-8 bg-transparent animate-fade-in">
        <div className="text-center mb-6">
           <div className="inline-flex bg-gradient-to-br from-indigo-900 to-slate-900 p-3 rounded-2xl shadow-xl shadow-slate-900/20 mb-3 ring-1 ring-white/20">
              <ShieldCheck className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">CrisisIQ Connect</h1>
           <p className="text-slate-500 font-medium mt-1 tracking-wide">Register for intelligence access</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white p-6 sm:p-8 hover:shadow-2xl transition-shadow">
          <form onSubmit={onSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full pl-10 px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm"
                  placeholder="operative@crisisiq.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Phone</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm"
                      placeholder="Optional"
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Clearance</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
                      <Briefcase className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pl-8 px-2 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm cursor-pointer"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="responder">Responder</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full pl-10 px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-800 text-sm"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 mt-2 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-pulse">
                 <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />
                 <p className="text-sm font-semibold text-red-600 leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-slate-800 to-indigo-900 text-white font-bold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-indigo-900/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Provisioning...</>
              ) : (
                <>Request Clearance <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-5 border-t border-slate-100">
            <span className="text-slate-500 text-xs font-medium">Already have access? </span>
            <Link className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition-colors text-xs" to="/login">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
