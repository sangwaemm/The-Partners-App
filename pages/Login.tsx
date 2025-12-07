import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';
import { ShieldCheck, User, Users } from 'lucide-react';

export default function Login() {
  const { login } = useData();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [email, setEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate Login
    const loginEmail = email || (selectedRole === UserRole.ADMIN ? 'admin@coop.rw' : 'user@coop.rw');
    login(loginEmail, selectedRole);
    navigate('/');
  };

  const RoleButton = ({ role, icon: Icon }: { role: UserRole, icon: any }) => (
    <button
      type="button"
      onClick={() => setSelectedRole(role)}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
        selectedRole === role 
          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-600'
      }`}
    >
      <Icon size={24} className="mb-2" />
      <span className="text-xs font-semibold">{role}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">CoopPartners</h1>
          <p className="text-blue-200 text-sm">Cooperative Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">Select Login Role (Demo)</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <RoleButton role={UserRole.ADMIN} icon={ShieldCheck} />
            <RoleButton role={UserRole.PRESIDENT} icon={User} />
            <RoleButton role={UserRole.SECRETARY} icon={User} />
            <RoleButton role={UserRole.MEMBER} icon={Users} />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              placeholder={selectedRole === UserRole.ADMIN ? 'admin@coop.rw' : 'member@coop.rw'}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/30"
          >
            Sign In
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            For demo purposes, password is not required.
          </p>
        </form>
      </div>
    </div>
  );
}