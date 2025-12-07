
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserRole, Member } from '../types';
import { Plus, Search, Edit2, Shield, UserCheck, History } from 'lucide-react';

export default function Members() {
  const { members, currentUser, contributions, translations, addMember, updateMember } = useData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  // Secretary can add, but only Admin can edit roles/status
  const canAdd = isAdmin || currentUser?.role === UserRole.SECRETARY;

  const [newMember, setNewMember] = useState({
    fullName: '',
    email: '',
    phone: '',
    shares: 0,
    role: UserRole.MEMBER,
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'active' as const
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember(newMember);
    setIsAddModalOpen(false);
    setNewMember({
      fullName: '',
      email: '',
      phone: '',
      shares: 0,
      role: UserRole.MEMBER,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMember(editingMember.id, {
        fullName: editingMember.fullName,
        email: editingMember.email,
        phone: editingMember.phone,
        role: editingMember.role,
        status: editingMember.status,
        historicalContribution: editingMember.historicalContribution,
        historicalProfit: editingMember.historicalProfit,
      });
      setEditingMember(null);
    }
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberTotalContrib = (member: Member) => {
    const historical = member.historicalContribution || 0;
    const current = contributions.filter(c => c.memberId === member.id).reduce((sum, c) => sum + c.amount, 0);
    return historical + current;
  };

  const getMemberCalculatedShares = (member: Member) => {
    const totalContrib = getMemberTotalContrib(member);
    const profit = member.historicalProfit || 0;
    const totalFund = totalContrib + profit;
    // Share = Total Fund / 100,000
    return Math.floor(totalFund / 100000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{translations.members}</h2>
        {canAdd && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{translations.addMember}</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
           <div className="relative max-w-sm">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text"
               placeholder="Search members..."
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Calc. Shares</th>
                <th className="px-6 py-4 text-right">Total Contrib.</th>
                <th className="px-6 py-4 text-right">Hist. Profit</th>
                <th className="px-6 py-4">Status</th>
                {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800 block">{member.fullName}</span>
                        {(member.historicalContribution || 0) > 0 && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-1">
                            <History size={8} /> Has History
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div>{member.email}</div>
                    <div className="text-xs text-slate-400">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      member.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                      member.role === UserRole.MEMBER ? 'bg-slate-100 text-slate-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">
                    <div className="flex flex-col items-end">
                      <span>{getMemberCalculatedShares(member)}</span>
                      <span className="text-[10px] text-slate-400">Automatic</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-indigo-700">
                    {getMemberTotalContrib(member).toLocaleString()}
                  </td>
                   <td className="px-6 py-4 text-right font-medium text-emerald-600">
                    {(member.historicalProfit || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1.5 text-xs px-2 py-1 rounded-full ${
                      member.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        member.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}></span>
                      <span className="capitalize">{member.status}</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setEditingMember(member)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Edit Role & Details"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4">
            <h3 className="text-xl font-bold mb-4">Add New Member</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required className="w-full border p-2 rounded" value={newMember.fullName} onChange={e => setNewMember({...newMember, fullName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input required type="email" className="w-full border p-2 rounded" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input required className="w-full border p-2 rounded" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select className="w-full border p-2 rounded" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value as UserRole})}>
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                 </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserCheck size={24} className="text-blue-600" />
                Edit Member & Roles
              </h3>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center space-x-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold">
                    {editingMember.fullName.charAt(0)}
                 </div>
                 <div>
                    <p className="font-bold text-slate-800">{editingMember.fullName}</p>
                    <p className="text-xs text-slate-500">Member ID: {editingMember.id}</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required className="w-full border border-slate-300 p-2 rounded-lg" value={editingMember.fullName} onChange={e => setEditingMember({...editingMember, fullName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role Assignment</label>
                    <select 
                      className="w-full border border-slate-300 p-2 rounded-lg bg-slate-50 focus:bg-white transition-colors" 
                      value={editingMember.role} 
                      onChange={e => setEditingMember({...editingMember, role: e.target.value as UserRole})}
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
                    <select 
                      className="w-full border border-slate-300 p-2 rounded-lg" 
                      value={editingMember.status} 
                      onChange={e => setEditingMember({...editingMember, status: e.target.value as 'active' | 'inactive'})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input required type="email" className="w-full border border-slate-300 p-2 rounded-lg" value={editingMember.email} onChange={e => setEditingMember({...editingMember, email: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input required className="w-full border border-slate-300 p-2 rounded-lg" value={editingMember.phone} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} />
                 </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                  <History size={16} className="mr-2 text-slate-500" />
                  Historical Data (Past Years)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Past Contributions (RWF)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full border border-slate-300 p-2 rounded-lg bg-slate-50 focus:bg-white" 
                        value={editingMember.historicalContribution || 0} 
                        onChange={e => setEditingMember({...editingMember, historicalContribution: parseFloat(e.target.value)})} 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Past Profits Earned (RWF)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full border border-slate-300 p-2 rounded-lg bg-slate-50 focus:bg-white" 
                        value={editingMember.historicalProfit || 0} 
                        onChange={e => setEditingMember({...editingMember, historicalProfit: parseFloat(e.target.value)})} 
                      />
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Shares are now automatically calculated: (Total Contrib + Profit) / 100,000.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setEditingMember(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
