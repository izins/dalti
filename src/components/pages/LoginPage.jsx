import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import Button from '../ui/Button';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!email) e.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Format invalide';
    if (!password) e.password = 'Le mot de passe est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const user = await login(email, password);
      if (user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setApiError(err.error || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-amber-300 relative overflow-hidden items-center justify-center p-16 border-r-8 border-surface-900">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-rose-300 border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mix-blend-multiply animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-[4rem] bg-sky-300 border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mix-blend-multiply transform rotate-12" />
        <div className="relative z-10 max-w-md bg-white p-12 rounded-[2rem] border-4 border-surface-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-300 border-4 border-surface-900 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-6">
              <span className="text-surface-900 font-black text-3xl">D</span>
            </div>
            <span className="text-surface-900 font-black text-4xl tracking-tighter uppercase">DALTI</span>
          </div>
          <h2 className="text-4xl font-black text-surface-900 leading-[1.1] mb-6 uppercase tracking-tight">
            Gérez vos files d'attente intelligemment.
          </h2>
          <p className="text-surface-700 font-bold text-lg leading-relaxed">
            Prenez votre ticket virtuel, suivez votre position en temps réel, et arrivez exactement quand c'est votre tour.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-[#FDFBF7]">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2rem] border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-300 rounded-full border-4 border-surface-900 -z-10" />
          
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-3">
              <span className="text-surface-900 font-black text-xl">D</span>
            </div>
            <span className="font-black text-2xl text-surface-900 tracking-tight uppercase">DALTI</span>
          </div>

          <h1 className="text-3xl font-black text-surface-900 tracking-tight mb-2 uppercase">Connexion</h1>
          <p className="text-surface-600 font-bold mb-8">Accédez à votre espace pour gérer vos tickets.</p>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900 text-sm font-black uppercase">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Adresse email"
              type="email"
              icon={Mail}
              placeholder="nom@exemple.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
              error={errors.email}
            />

            <div>
              <Input
                label="Mot de passe"
                type={showPw ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                error={errors.password}
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="text-xs text-surface-400 hover:text-surface-600 flex items-center gap-1 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPw ? 'Masquer' : 'Afficher'}
                </button>
                <span className="text-[10px] uppercase tracking-widest text-surface-900 font-black cursor-pointer hover:underline underline-offset-2">
                  Mot de passe oublié ?
                </span>
              </div>
            </div>

            <Button type="submit" loading={loading} icon={LogIn} className="w-full mt-8" size="lg">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm font-bold text-surface-600 mt-8 uppercase">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-surface-900 font-black hover:text-sky-500 transition-colors uppercase border-b-2 border-surface-900 hover:border-sky-500">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
