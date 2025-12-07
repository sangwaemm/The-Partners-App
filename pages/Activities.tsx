
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';
import { Plus, Trash2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export default function Activities() {
  const { activities, addActivity, deleteActivity, currentUser, translations, members } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    amountSpent: 0,
    amountEarned: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'General',
    actorName: '',
    actorId: '',
    activityType: 'GENERAL' as 'CONTRIBUTION' | 'GIVEN_LOAN' | 'PAYING_LOAN' | 'PAYING_PROFIT' | 'EXPENSE' | 'INVESTMENT' | 'GENERAL'
  });

  const canManage = currentUser?.role !== UserRole.MEMBER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addActivity(newActivity);
    setIsModalOpen(false);
    setNewActivity({
      title: '',
      description: '',
      amountSpent: 0,
      amountEarned: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'General'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{translations.activities}</h2>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Add Activity</span>
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activities.map(activity => (
          <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
             <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-100 p-2 rounded-lg">
                   {activity.amountEarned > activity.amountSpent ? (
                       <TrendingUp className="text-emerald-500" size={24} />
                   ) : (
                       <TrendingDown className="text-rose-500" size={24} />
                   )}
                </div>
               <div className="ml-3">
                 <span className="text-xs text-slate-500">{activity.activityType || 'GENERAL'}</span>
               </div>
                {isAdmin && (
                  <button 
                    onClick={() => {
                        if(window.confirm("Are you sure you want to delete this activity?")) {
                            deleteActivity(activity.id);
                        }
                    }}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
             </div>
             
             <h3 className="font-bold text-slate-800 text-lg mb-2">{activity.title}</h3>
             <p className="text-slate-500 text-sm mb-4 min-h-[40px]">{activity.description}</p>
             {activity.actorName && <div className="text-sm text-slate-600 mb-2">By: <span className="font-medium text-slate-800">{activity.actorName}</span></div>}
             
             <div className="flex items-center text-xs text-slate-400 mb-4">
                <Calendar size={14} className="mr-1" />
                {activity.date}
             </div>

             <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                <div>
                   <span className="text-xs text-slate-400 block">Spent</span>
                   <span className="font-semibold text-rose-600">{activity.amountSpent.toLocaleString()} RWF</span>
                </div>
                <div className="text-right">
                   <span className="text-xs text-slate-400 block">Earned</span>
                   <span className="font-semibold text-emerald-600">{activity.amountEarned.toLocaleString()} RWF</span>
                </div>
             </div>
          </div>
        ))}
        {activities.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                No activities or projects recorded yet.
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Add Activity / Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Activity Title</label>
                  <input required className="w-full border p-2 rounded" value={newActivity.title} onChange={e => setNewActivity({...newActivity, title: e.target.value})} />
               </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Performed By (Member)</label>
                  <select className="w-full border p-2 rounded" value={newActivity.actorId} onChange={e => {
                    const memberId = e.target.value;
                    const member = members.find(m => m.id === memberId);
                    setNewActivity({...newActivity, actorId: memberId, actorName: member?.fullName || ''});
                  }}>
                    <option value="">-- Select Member --</option>
                     {members.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Activity Type</label>
                  <select className="w-full border p-2 rounded" value={newActivity.activityType} onChange={e => setNewActivity({...newActivity, activityType: e.target.value as any})}>
                    <option value="GENERAL">General</option>
                    <option value="CONTRIBUTION">Contribution</option>
                    <option value="GIVEN_LOAN">Given Loan</option>
                    <option value="PAYING_LOAN">Paying Loan</option>
                    <option value="PAYING_PROFIT">Paying Profit</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="INVESTMENT">Investment</option>
                  </select>
                </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea required className="w-full border p-2 rounded" value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost (Spent)</label>
                    <input type="number" min="0" className="w-full border p-2 rounded" value={newActivity.amountSpent} onChange={e => setNewActivity({...newActivity, amountSpent: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Income (Earned)</label>
                    <input type="number" min="0" className="w-full border p-2 rounded" value={newActivity.amountEarned} onChange={e => setNewActivity({...newActivity, amountEarned: parseFloat(e.target.value)})} />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input required type="date" className="w-full border p-2 rounded" value={newActivity.date} onChange={e => setNewActivity({...newActivity, date: e.target.value})} />
               </div>

               <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
