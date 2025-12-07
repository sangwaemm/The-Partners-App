import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserRole } from '../types';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

export default function Investment() {
  const { investments, addInvestment, updateInvestment, deleteInvestment, addInvestmentExpense, addInvestmentProfit, currentUser, translations } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState<string | null>(null);
  const [showProfitForm, setShowProfitForm] = useState<string | null>(null);

  const [newInvestment, setNewInvestment] = useState({
    name: '',
    description: '',
    totalCapital: 0,
    totalExpenses: 0,
    totalProfits: 0,
    dateCreated: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0]
  });

  const [expenseForm, setExpenseForm] = useState({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  const [profitForm, setProfitForm] = useState({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });

  const canManage = currentUser?.role !== UserRole.MEMBER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    addInvestment({
      ...newInvestment,
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
    setNewInvestment({ name: '', description: '', totalCapital: 0, totalExpenses: 0, totalProfits: 0, dateCreated: new Date().toISOString().split('T')[0], lastUpdated: new Date().toISOString().split('T')[0] });
  };

  const handleAddExpense = (e: React.FormEvent, investmentId: string) => {
    e.preventDefault();
    if (expenseForm.amount > 0) {
      addInvestmentExpense(investmentId, expenseForm.amount, expenseForm.description, expenseForm.date);
      setShowExpenseForm(null);
      setExpenseForm({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  const handleAddProfit = (e: React.FormEvent, investmentId: string) => {
    e.preventDefault();
    if (profitForm.amount > 0) {
      addInvestmentProfit(investmentId, profitForm.amount, profitForm.description, profitForm.date);
      setShowProfitForm(null);
      setProfitForm({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  const handleDeleteInvestment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment record?')) {
      deleteInvestment(id);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const netProfit = (inv: any) => inv.totalProfits - inv.totalExpenses;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{translations.investments || 'Investments'}</h2>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>New Investment</span>
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {investments.map(inv => (
          <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg">{inv.name}</h3>
                  {inv.description && <p className="text-sm text-slate-500 mt-1">{inv.description}</p>}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteInvestment(inv.id)}
                    className="text-slate-300 hover:text-red-500 p-1 ml-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Key Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Capital</span>
                  <span className="font-semibold text-slate-800">{inv.totalCapital.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Expenses</span>
                  <span className="font-semibold text-rose-600">{inv.totalExpenses.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Profits</span>
                  <span className="font-semibold text-emerald-600">{inv.totalProfits.toLocaleString()} RWF</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Net Result</span>
                  <span className={`font-bold text-lg ${netProfit(inv) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netProfit(inv).toLocaleString()} RWF
                  </span>
                </div>
              </div>

              {/* Expand button */}
              <button
                onClick={() => toggleExpanded(inv.id)}
                className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {expandedId === inv.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {expandedId === inv.id ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {/* Expanded Details */}
            {expandedId === inv.id && (
              <div className="p-6 space-y-6 border-t border-slate-100">
                {/* Expense History */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <TrendingDown size={18} className="text-rose-600" />
                      Expenses
                    </h4>
                    {canManage && (
                      <button
                        onClick={() => setShowExpenseForm(showExpenseForm === inv.id ? null : inv.id)}
                        className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition-colors"
                      >
                        + Add Expense
                      </button>
                    )}
                  </div>

                  {showExpenseForm === inv.id && (
                    <form onSubmit={e => handleAddExpense(e, inv.id)} className="mb-3 p-3 bg-rose-50 rounded space-y-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount (RWF)"
                        className="w-full border p-2 rounded text-sm"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        className="w-full border p-2 rounded text-sm"
                        value={expenseForm.description}
                        onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      />
                      <input
                        type="date"
                        className="w-full border p-2 rounded text-sm"
                        value={expenseForm.date}
                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 px-2 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExpenseForm(null)}
                          className="flex-1 px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(inv.expenseHistory || []).map((exp, idx) => (
                      <div key={idx} className="p-2 bg-rose-50 rounded text-sm border border-rose-100">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-700">{exp.description}</span>
                          <span className="text-rose-600">{exp.amount.toLocaleString()} RWF</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{exp.date}</div>
                      </div>
                    ))}
                    {(inv.expenseHistory || []).length === 0 && <p className="text-sm text-slate-400">No expenses recorded.</p>}
                  </div>
                </div>

                {/* Profit History */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-600" />
                      Profits
                    </h4>
                    {canManage && (
                      <button
                        onClick={() => setShowProfitForm(showProfitForm === inv.id ? null : inv.id)}
                        className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                      >
                        + Add Profit
                      </button>
                    )}
                  </div>

                  {showProfitForm === inv.id && (
                    <form onSubmit={e => handleAddProfit(e, inv.id)} className="mb-3 p-3 bg-emerald-50 rounded space-y-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount (RWF)"
                        className="w-full border p-2 rounded text-sm"
                        value={profitForm.amount}
                        onChange={e => setProfitForm({ ...profitForm, amount: parseFloat(e.target.value) })}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        className="w-full border p-2 rounded text-sm"
                        value={profitForm.description}
                        onChange={e => setProfitForm({ ...profitForm, description: e.target.value })}
                      />
                      <input
                        type="date"
                        className="w-full border p-2 rounded text-sm"
                        value={profitForm.date}
                        onChange={e => setProfitForm({ ...profitForm, date: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 px-2 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowProfitForm(null)}
                          className="flex-1 px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(inv.profitHistory || []).map((profit, idx) => (
                      <div key={idx} className="p-2 bg-emerald-50 rounded text-sm border border-emerald-100">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-700">{profit.description}</span>
                          <span className="text-emerald-600">{profit.amount.toLocaleString()} RWF</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{profit.date}</div>
                      </div>
                    ))}
                    {(inv.profitHistory || []).length === 0 && <p className="text-sm text-slate-400">No profits recorded.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {investments.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            No investments recorded yet.
          </div>
        )}
      </div>

      {/* New Investment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4">Create New Investment</h3>
            <form onSubmit={handleCreateInvestment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Investment Name</label>
                <input
                  required
                  type="text"
                  className="w-full border p-2 rounded"
                  value={newInvestment.name}
                  onChange={e => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  placeholder="e.g., Real Estate, Business"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full border p-2 rounded"
                  value={newInvestment.description}
                  onChange={e => setNewInvestment({ ...newInvestment, description: e.target.value })}
                  placeholder="Brief description of the investment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Capital (RWF)</label>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full border p-2 rounded"
                  value={newInvestment.totalCapital}
                  onChange={e => setNewInvestment({ ...newInvestment, totalCapital: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Investment Start Date</label>
                <input
                  required
                  type="date"
                  className="w-full border p-2 rounded"
                  value={newInvestment.dateCreated}
                  onChange={e => setNewInvestment({ ...newInvestment, dateCreated: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Updated</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={newInvestment.lastUpdated}
                  onChange={e => setNewInvestment({ ...newInvestment, lastUpdated: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Create Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
