import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../api/client';
import { useQueue } from '../../context/QueueContext';
import PageHeader from '../ui/PageHeader';
import { Input, Select } from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Card from '../ui/Card';
import { Save, User, Bell, Shield, LogOut } from 'lucide-react';

const WILAYAS = ['Adrar','Béjaïa','Alger','Oran','Constantine']; // shortened for brevity

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useQueue();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    wilaya: user?.wilaya || '',
    commune: user?.commune || '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('infos');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await usersAPI.updateProfile(form);
      updateUser(res.user);
      addToast('Profil mis à jour avec succès', 'success');
    } catch (err) {
      addToast(err.error || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'infos', label: 'Informations', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="pt-24 pb-32 max-w-5xl mx-auto px-6 lg:px-8 bg-[#FDFBF7] min-h-screen">
      <PageHeader title="Mon Profil" subtitle="Gérez vos informations personnelles et vos préférences." />

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <Card className="text-center bg-emerald-300">
            <div className="inline-block p-1 bg-white rounded-full border-4 border-surface-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
              <Avatar name={`${user?.first_name} ${user?.last_name}`} size="lg" />
            </div>
            <h3 className="text-2xl font-black text-surface-900 uppercase tracking-tight leading-none mb-1">{user?.first_name} {user?.last_name}</h3>
            <p className="text-sm font-bold text-surface-700">{user?.email}</p>
            {user?.is_admin && <div className="mt-4 inline-block px-4 py-1.5 bg-white border-2 border-surface-900 text-surface-900 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg">Admin</div>}
          </Card>

          <nav className="flex flex-col gap-3">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-transform border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 ${
                  activeTab === t.id ? 'bg-amber-300 text-surface-900' : 'bg-white text-surface-900 hover:bg-surface-50'
                }`}
              >
                <t.icon size={20} className={activeTab === t.id ? "text-surface-900" : "text-surface-500"} /> {t.label}
              </button>
            ))}
            <div className="h-1 bg-surface-900 my-2 rounded-full" />
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-rose-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-surface-900 hover:-translate-y-0.5 transition-transform"
            >
              <LogOut size={20} /> Déconnexion
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card className="bg-white">
            {activeTab === 'infos' && (
              <form onSubmit={handleSave} className="space-y-8">
                <h3 className="text-2xl font-black text-surface-900 border-b-4 border-surface-900 pb-4 mb-8 uppercase tracking-tight">Informations personnelles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Prénom" value={form.first_name} onChange={set('first_name')} className="font-bold" />
                  <Input label="Nom" value={form.last_name} onChange={set('last_name')} className="font-bold" />
                </div>
                <Input label="Adresse email" type="email" value={form.email} disabled className="opacity-70 cursor-not-allowed font-bold" helper="L'email ne peut pas être modifié." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Select label="Wilaya" value={form.wilaya} onChange={set('wilaya')} className="font-bold">
                    <option value="">Sélectionner...</option>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </Select>
                  <Input label="Commune" value={form.commune} onChange={set('commune')} className="font-bold" />
                </div>
                <div className="pt-6 flex justify-end">
                  <Button type="submit" loading={loading} icon={Save} size="lg">Enregistrer les modifications</Button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-surface-900 border-b-4 border-surface-900 pb-4 mb-8 uppercase tracking-tight">Sécurité</h3>
                <Input label="Mot de passe actuel" type="password" className="font-bold" />
                <Input label="Nouveau mot de passe" type="password" className="font-bold" />
                <Input label="Confirmer le nouveau mot de passe" type="password" className="font-bold" />
                <div className="pt-6 flex justify-end">
                  <Button variant="primary" size="lg">Mettre à jour le mot de passe</Button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-surface-900 border-b-4 border-surface-900 pb-4 mb-8 uppercase tracking-tight">Préférences de notification</h3>
                <div className="space-y-6">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input type="checkbox" className="w-6 h-6 rounded border-2 border-surface-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-2 transition-colors cursor-pointer" defaultChecked />
                    <span className="text-base font-black text-surface-900 uppercase">Notifications par email pour les nouveaux tickets</span>
                  </label>
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input type="checkbox" className="w-6 h-6 rounded border-2 border-surface-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-2 transition-colors cursor-pointer" defaultChecked />
                    <span className="text-base font-black text-surface-900 uppercase">Alerte quand mon tour approche (3 personnes avant)</span>
                  </label>
                </div>
                <div className="pt-6 flex justify-end">
                  <Button variant="secondary" size="lg">Sauvegarder les préférences</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
