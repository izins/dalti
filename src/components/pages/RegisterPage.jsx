import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input, Select } from '../ui/Input';
import Button from '../ui/Button';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Calendar, MapPin } from 'lucide-react';

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt',
  'El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma',
  'Aïn Témouchent','Ghardaïa','Relizane',
];

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}

const strengthLabels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-accent-400', 'bg-green-500'];

export default function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm: '',
    birth_date: '', wilaya: '', commune: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const set = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Requis';
    if (!form.email) e.email = 'Requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Format invalide';
    if (!form.password) e.password = 'Requis';
    else if (form.password.length < 6) e.password = 'Minimum 6 caractères';
    if (form.password !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await register(form);
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setApiError(err.error || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-sky-300 relative overflow-hidden items-center justify-center p-16 border-r-8 border-surface-900">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-violet-300 border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mix-blend-multiply animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-[4rem] bg-emerald-300 border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mix-blend-multiply transform -rotate-12" />
        <div className="relative z-10 max-w-md bg-white p-12 rounded-[2rem] border-4 border-surface-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform rotate-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-300 border-4 border-surface-900 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-6">
              <span className="text-surface-900 font-black text-3xl">D</span>
            </div>
            <span className="text-surface-900 font-black text-4xl tracking-tighter uppercase">DALTI</span>
          </div>
          <h2 className="text-4xl font-black text-surface-900 leading-[1.1] mb-6 uppercase tracking-tight">
            Rejoignez la communauté DALTI.
          </h2>
          <p className="text-surface-700 font-bold text-lg leading-relaxed">
            Créez votre compte en quelques secondes et commencez à gérer vos files d'attente intelligemment.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#FDFBF7] overflow-y-auto">
        <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-[2rem] border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative mt-8 lg:mt-0">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-300 rounded-full border-4 border-surface-900 -z-10" />

          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-amber-300 border-2 border-surface-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-3">
              <span className="text-surface-900 font-black text-xl">D</span>
            </div>
            <span className="font-black text-2xl text-surface-900 tracking-tight uppercase">DALTI</span>
          </div>

          <h1 className="text-3xl font-black text-surface-900 tracking-tight mb-2 uppercase">Créer un compte</h1>
          <p className="text-surface-600 font-bold mb-8">Remplissez le formulaire ci-dessous pour vous inscrire.</p>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900 text-sm font-black uppercase">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" icon={User} placeholder="Ahmed" value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
              <Input label="Nom" placeholder="Benali" value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
            </div>

            <Input label="Adresse email" type="email" icon={Mail} placeholder="ahmed@exemple.com" value={form.email} onChange={set('email')} error={errors.email} />

            <div>
              <div className="relative">
                <Input
                  label="Mot de passe"
                  type={showPw ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="Min. 6 caractères"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                />
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= pwStrength ? strengthColors[pwStrength] : 'bg-surface-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-surface-400">{strengthLabels[pwStrength]}</span>
                </div>
              )}
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs text-surface-400 hover:text-surface-600 flex items-center gap-1 mt-1.5 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPw ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            <Input label="Confirmer le mot de passe" type="password" icon={Lock} placeholder="••••••••" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />

            <Input label="Date de naissance" type="date" icon={Calendar} value={form.birth_date} onChange={set('birth_date')} />

            <div className="grid grid-cols-2 gap-4">
              <Select label="Wilaya" value={form.wilaya} onChange={set('wilaya')}>
                <option value="">Sélectionner...</option>
                {WILAYAS.map((w, i) => <option key={i} value={w}>{w}</option>)}
              </Select>
              <Input label="Commune" icon={MapPin} placeholder="Ex: Béjaïa" value={form.commune} onChange={set('commune')} />
            </div>

            <Button type="submit" loading={loading} icon={UserPlus} className="w-full mt-8" size="lg">
              Créer mon compte
            </Button>
          </form>

          <p className="text-center text-sm font-bold text-surface-600 mt-8 uppercase">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-surface-900 font-black hover:text-sky-500 transition-colors uppercase border-b-2 border-surface-900 hover:border-sky-500">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
