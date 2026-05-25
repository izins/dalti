import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ChevronDown, User, History, ArrowLeftRight, LogOut, Shield, Layers, Bell, Calendar } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { usersAPI } from '../../api/client';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const { isLoggedIn, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (isLoggedIn) {
      usersAPI.getNotifications().then(data => setNotifications(data.notifications || []));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fn = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = user?.is_admin ? [
    { label: 'Administration', to: '/admin' },
    { label: 'Assistant', to: '/chatbot' },
    { label: 'Info Structure', to: '/admin/info' },
  ] : [
    { label: 'Services', to: '/services' },
    { label: 'Carte', to: '/map' },
    { label: 'Assistant', to: '/chatbot' },
    ...(isLoggedIn ? [
      { label: 'Historique', to: '/history' },
      { label: 'Échanges', to: '/exchanges' },
    ] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding
          ? 'bg-white border-b-4 border-surface-900 shadow-[0_4px_0px_0px_rgba(0,0,0,1)]'
          : 'bg-transparent py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-[72px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-300 flex items-center justify-center border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-0.5 transition-all">
              <span className="text-surface-900 font-black text-xl uppercase">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-surface-900 tracking-tight uppercase leading-none">
                DALTI
              </span>
              <span className="text-sky-500 text-[10px] font-black tracking-widest uppercase leading-none mt-1">
                دالتي
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  isActive(link.to)
                    ? 'text-surface-900 bg-sky-300 border-2 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                    : 'text-surface-900 hover:bg-surface-200 border-2 border-transparent hover:border-surface-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-300 border-2 border-surface-900 text-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all relative"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-400 rounded-full border-2 border-surface-900" />
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-fade-in z-50">
                      <div className="px-5 py-4 border-b-4 border-surface-900 flex items-center justify-between bg-violet-300">
                        <span className="font-black text-surface-900 uppercase">Notifications</span>
                        <span className="text-[10px] font-black bg-white border-2 border-surface-900 text-surface-900 px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">
                          {notifications.length} Nouvelles
                        </span>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="p-4 border-b-2 border-surface-200 hover:bg-surface-100 transition-colors cursor-pointer group">
                              <p className="text-sm text-surface-900 font-bold leading-snug mb-1">
                                {n.message}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-surface-500 font-black uppercase">
                                <Calendar size={12} />
                                {new Date(n.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell size={24} className="text-surface-200 mx-auto mb-3" />
                            <p className="text-sm text-surface-400 font-medium">Aucune notification</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-xl border-2 border-surface-900 bg-white hover:bg-surface-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                  >
                    <Avatar name={user ? `${user.first_name} ${user.last_name}` : ''} size="sm" />
                    <span className="text-sm font-black uppercase text-surface-900 max-w-[120px] truncate">
                      {user?.first_name}
                    </span>
                    <ChevronDown size={14} className={`text-surface-900 stroke-[3px] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl border-4 border-surface-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] py-2 animate-fade-in z-50">
                      <div className="px-4 py-3 border-b-4 border-surface-900 mb-2 bg-sky-300 -mt-2">
                        <p className="text-sm font-black uppercase text-surface-900 truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs font-bold text-surface-800 truncate">{user?.email}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase text-surface-900 hover:bg-surface-100 transition-colors">
                        <User size={16} /> Mon profil
                      </Link>
                      <Link to="/history" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase text-surface-900 hover:bg-surface-100 transition-colors">
                        <History size={16} /> Historique
                      </Link>
                      <Link to="/exchanges" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase text-surface-900 hover:bg-surface-100 transition-colors">
                        <ArrowLeftRight size={16} /> Échanges
                      </Link>
                      {user?.is_admin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold uppercase text-surface-900 hover:bg-surface-100 transition-colors">
                          <Shield size={16} /> Administration
                        </Link>
                      )}
                      <div className="border-t-4 border-surface-900 mt-2 pt-2 bg-rose-300">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-black uppercase text-surface-900 hover:bg-rose-400 transition-colors w-full text-left"
                        >
                          <LogOut size={16} /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Se connecter</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">S'inscrire</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 rounded-xl border-2 border-surface-900 bg-violet-300 text-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 flex items-center justify-center transition-all"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b-4 border-surface-900 shadow-[0_8px_0px_0px_rgba(0,0,0,1)] animate-fade-in origin-top z-40">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest border-2 transition-all ${
                  isActive(link.to) ? 'text-surface-900 bg-sky-300 border-surface-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-surface-900 border-transparent hover:bg-surface-100 hover:border-surface-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <div className="pt-4 border-t-4 border-dashed border-surface-900 mt-4 space-y-2">
                <Link to="/profile" className="block px-4 py-3 rounded-xl text-sm font-black uppercase text-surface-900 hover:bg-surface-100 border-2 border-transparent hover:border-surface-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Profil</Link>
                {!user?.is_admin && (
                  <>
                    <Link to="/history" className="block px-4 py-3 rounded-xl text-sm font-black uppercase text-surface-900 hover:bg-surface-100 border-2 border-transparent hover:border-surface-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Historique</Link>
                    <Link to="/exchanges" className="block px-4 py-3 rounded-xl text-sm font-black uppercase text-surface-900 hover:bg-surface-100 border-2 border-transparent hover:border-surface-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Échanges</Link>
                  </>
                )}
                {user?.is_admin && <Link to="/admin" className="block px-4 py-3 rounded-xl text-sm font-black uppercase text-surface-900 hover:bg-surface-100 border-2 border-transparent hover:border-surface-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Admin</Link>}
                <div className="pt-4 border-t-4 border-surface-900 mt-4 bg-rose-300 -mx-6 px-6 pb-6">
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-3 rounded-xl text-sm font-black uppercase text-surface-900 hover:bg-rose-400 border-2 border-transparent hover:border-surface-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mt-4">Déconnexion</button>
                </div>
              </div>
            ) : (
              <div className="pt-6 border-t-4 border-surface-900 mt-4 flex flex-col gap-3">
                <Link to="/login"><Button variant="secondary" className="w-full">Se connecter</Button></Link>
                <Link to="/register"><Button variant="primary" className="w-full">S'inscrire</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
