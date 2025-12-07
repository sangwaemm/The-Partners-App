
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';
import { Plus, Search, Download, CheckCircle, Calendar, CreditCard, Trash2 } from 'lucide-react';

export default function Contributions() {
  const { contributions, members, currentUser, addContribution, deleteContribution, translations } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Default to current user if they are adding for themselves, otherwise empty
  const [newContrib, setNewContrib] = useState({
    memberId: currentUser?.id || '',
    amount: 8000,
    periodStart: new Date().toISOString().split('T')[0],
    datePaid: new Date().toISOString().split('T')[0]
  });

  const canManage = currentUser?.role !== UserRole.MEMBER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-calculate period end (28 days)
    const startDate = new Date(newContrib.periodStart);
    const endDate = new Date(startDate.getTime() + (28 * 24 * 60 * 60 * 1000));
    const periodEnd = endDate.toISOString().split('T')[0];

    addContribution({
      memberId: newContrib.memberId,
      amount: Number(newContrib.amount),
      periodStart: newContrib.periodStart,
      periodEnd: periodEnd,
      datePaid: newContrib.datePaid,
      status: 'paid'
    });
    setIsModalOpen(false);
    // Reset form but keep date
    setNewContrib(prev => ({ ...prev, memberId: currentUser?.id || '', amount: 8000 }));
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';
  const getMemberRole = (id: string) => members.find(m => m.id === id)?.role || '';

  const filteredContributions = contributions.filter(c => {
    // Members only see their own
    if (currentUser?.role === UserRole.MEMBER && c.memberId !== currentUser.id) return false;
    
    // Search filter
    const memberName = getMemberName(c.memberId).toLowerCase();
    return memberName.includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{translations.contributions}</h2>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative max-w-sm w-full">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text"
               placeholder="Search by member name..."
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           <div className="flex items-center space-x-4 text-sm text-slate-500">
             <div className="flex items-center">
               <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
               Paid
             </div>
             <div className="flex items-center">
               <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
               Pending
             </div>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Date Paid</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContributions.map((contrib) => {
                const memberRole = getMemberRole(contrib.memberId);
                return (
                  <tr key={contrib.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{getMemberName(contrib.memberId)}</div>
                      <div className="text-xs text-slate-400 font-medium">{memberRole}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{contrib.periodStart}</span>
                      </div>
                      <span className="text-xs text-slate-400 ml-5">to {contrib.periodEnd}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contrib.datePaid}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      {contrib.amount.toLocaleString()} RWF
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <CheckCircle size={12} />
                        <span className="capitalize">{contrib.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center space-x-2">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Download Receipt">
                        <Download size={18} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to delete this contribution?')) {
                              deleteContribution(contrib.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Contribution"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredContributions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No contributions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CreditCard size={24} className="text-blue-600" />
                Record Contribution
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Member</label>
                <select 
                  required 
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newContrib.memberId} 
                  onChange={e => setNewContrib({...newContrib, memberId: e.target.value})}
                >
                  <option value="" disabled>Choose a member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Admin, President, and Secretary are also eligible members.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (RWF)</label>
                <input 
                  required 
                  type="number" 
                  min="0"
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newContrib.amount} 
                  onChange={e => setNewContrib({...newContrib, amount: Number(e.target.value)})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Period Start Date</label>
                    <input 
                      required 
                      type="date" 
                      className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newContrib.periodStart} 
                      onChange={e => setNewContrib({...newContrib, periodStart: e.target.value})} 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                    <input 
                      required 
                      type="date" 
                      className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newContrib.datePaid} 
                      onChange={e => setNewContrib({...newContrib, datePaid: e.target.value})} 
                    />
                 </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <p>The contribution period will automatically be set to <strong>28 days</strong> from the start date.</p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/30"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
