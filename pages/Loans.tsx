
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { UserRole, LoanStatus, DEFAULT_LOAN_INTEREST } from '../types';
import { Plus, DollarSign, AlertTriangle, User, Globe, Trash2 } from 'lucide-react';

export default function Loans() {
  const { loans, members, currentUser, addLoan, deleteLoan, payLoan, translations } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  
  // Separate states for Principal and Profit payment
  const [paymentPrincipal, setPaymentPrincipal] = useState<string>('');
  const [paymentProfit, setPaymentProfit] = useState<string>('');
  const [monthsToPay, setMonthsToPay] = useState<number>(1);
  const [monthsElapsed, setMonthsElapsed] = useState<number>(0);

  const [newLoan, setNewLoan] = useState({
    borrowerType: 'MEMBER' as 'MEMBER' | 'EXTERNAL',
    memberId: '',
    borrowerName: '',
    borrowerPhone: '',
    principal: 0,
    dateIssued: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  const canManage = currentUser?.role !== UserRole.MEMBER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalBorrowerName = newLoan.borrowerName;

    if (newLoan.borrowerType === 'MEMBER') {
      const member = members.find(m => m.id === newLoan.memberId);
      if (member) {
        finalBorrowerName = member.fullName;
      } else {
        return; // Validation error
      }
    }

    addLoan({
      memberId: newLoan.borrowerType === 'MEMBER' ? newLoan.memberId : undefined,
      borrowerType: newLoan.borrowerType,
      borrowerName: finalBorrowerName,
      borrowerPhone: newLoan.borrowerType === 'EXTERNAL' ? newLoan.borrowerPhone : undefined,
      principal: newLoan.principal,
      interestRate: DEFAULT_LOAN_INTEREST,
      totalInterest: newLoan.principal * DEFAULT_LOAN_INTEREST,
      totalDue: newLoan.principal * (1 + DEFAULT_LOAN_INTEREST),
      amountPaid: 0,
      interestPaid: 0,
      remainingAmount: newLoan.principal * (1 + DEFAULT_LOAN_INTEREST),
      dateIssued: newLoan.dateIssued,
      dueDate: newLoan.dueDate,
      status: LoanStatus.ACTIVE
    });
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewLoan({
        borrowerType: 'MEMBER',
        memberId: '',
        borrowerName: '',
        borrowerPhone: '',
        principal: 0,
        dateIssued: new Date().toISOString().split('T')[0],
        dueDate: ''
    });
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLoan) {
      const pPrincipal = parseFloat(paymentPrincipal) || 0;
      const pProfit = parseFloat(paymentProfit) || 0;
      if (pPrincipal + pProfit > 0) {
        payLoan(selectedLoan, pPrincipal, pProfit, monthsToPay && monthsToPay > 0 ? monthsToPay : undefined);
        setSelectedLoan(null);
        setPaymentPrincipal('');
        setPaymentProfit('');
        setMonthsToPay(1);
        setMonthsElapsed(0);
      }
    }
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Are you sure you want to delete this loan record? This action cannot be undone.")) {
          deleteLoan(id);
      }
  };

  // Filter loans based on role
  const visibleLoans = currentUser?.role === UserRole.MEMBER 
    ? loans.filter(l => l.memberId === currentUser.id)
    : loans;

  // Helper to calculate full months between two dates (start -> today by default)
  const monthsBetween = (startDate: string, endDate?: Date | string) => {
    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : new Date();
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (e.getDate() < s.getDate()) months -= 1;
    return Math.max(0, months);
  };

  // Small inner component to show interest / months info and control months-to-pay
  const InterestInfo = ({ loan }: any) => {
    const monthlyInterest = loan.principal * loan.interestRate;
    const elapsed = monthsBetween(loan.dateIssued);

    useEffect(() => {
      setMonthsElapsed(elapsed);
      if (elapsed >= 1) {
        const defaultMonths = Math.min(elapsed, monthsToPay || 1);
        setMonthsToPay(defaultMonths);
        setPaymentProfit(String(defaultMonths * monthlyInterest));
      } else {
        setMonthsToPay(0);
        setPaymentProfit('0');
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loan.id]);

    return (
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Date Issued</span>
          <span className="text-slate-700">{loan.dateIssued}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Months Elapsed</span>
          <span className="text-slate-700">{elapsed}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">Monthly Interest</span>
          <span className="text-slate-700">{monthlyInterest.toLocaleString()} RWF</span>
        </div>
        {elapsed >= 1 ? (
          <div className="mt-2">
            <label className="block text-sm text-slate-600 mb-1">Pay interest for months</label>
            <select
              value={monthsToPay}
              onChange={e => {
                const val = parseInt(e.target.value) || 1;
                setMonthsToPay(val);
                setPaymentProfit(String(val * monthlyInterest));
              }}
              className="w-full border p-2 rounded"
            >
              {Array.from({ length: elapsed }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-sm text-slate-500 mt-2">No interest due yet (loan younger than 1 month).</div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{translations.loans}</h2>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Loan</span>
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleLoans.map(loan => (
          <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden transition-all hover:shadow-md">
            
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${loan.borrowerType === 'MEMBER' ? 'bg-slate-100' : 'bg-orange-100'}`}>
                    {loan.borrowerType === 'MEMBER' ? <User className="text-slate-600" size={24} /> : <Globe className="text-orange-600" size={24} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">{loan.borrowerName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          loan.status === LoanStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                       }`}>
                          {loan.status}
                       </span>
                       {loan.borrowerType === 'EXTERNAL' && <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">External</span>}
                    </div>
                  </div>
               </div>
               
               {isAdmin && (
                   <button 
                     onClick={() => handleDelete(loan.id)}
                     className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                     title="Delete Loan Record"
                   >
                     <Trash2 size={18} />
                   </button>
               )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Date Issued</span>
                 <span className="text-slate-700">{loan.dateIssued}</span>
              </div>
              <div className="h-px bg-slate-100 my-2"></div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Principal</span>
                <span className="font-medium">{loan.principal.toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Profit (10%)</span>
                <span className="font-medium">{loan.totalInterest.toLocaleString()} RWF</span>
              </div>
              
              <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Paid Profit</span>
                 <span className="font-bold text-emerald-600">{(loan.interestPaid || 0).toLocaleString()} RWF</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Months Paid</span>
                <span className="font-medium text-slate-700">{(loan.monthsPaidHistory || []).reduce((s: number, r: any) => s + (r.months || 0), 0)} mo</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-bold text-blue-600">{loan.amountPaid.toLocaleString()} RWF</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Remaining Due</span>
                <span className="font-bold text-rose-600">{loan.remainingAmount.toLocaleString()} RWF</span>
              </div>
            </div>

            {loan.remainingAmount > 0 && canManage && (
              <button 
                onClick={() => setSelectedLoan(loan.id)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors"
              >
                Record Payment
              </button>
            )}
          </div>
        ))}
        {visibleLoans.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            No loans found.
          </div>
        )}
      </div>

      {/* New Loan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4">Issue New Loan</h3>
            <form onSubmit={handleCreateLoan} className="space-y-4">
               
               {/* Borrower Type Switch */}
               <div className="flex p-1 bg-slate-100 rounded-lg">
                 <button 
                    type="button"
                    onClick={() => setNewLoan({...newLoan, borrowerType: 'MEMBER'})}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        newLoan.borrowerType === 'MEMBER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                 >
                    Member
                 </button>
                 <button 
                    type="button"
                    onClick={() => setNewLoan({...newLoan, borrowerType: 'EXTERNAL'})}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        newLoan.borrowerType === 'EXTERNAL' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                 >
                    Non-Member
                 </button>
               </div>

               {newLoan.borrowerType === 'MEMBER' ? (
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Member</label>
                      <select 
                        required 
                        className="w-full border p-2 rounded" 
                        value={newLoan.memberId} 
                        onChange={e => setNewLoan({...newLoan, memberId: e.target.value})}
                      >
                        <option value="">-- Choose Member --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                      </select>
                   </div>
               ) : (
                   <>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input 
                            required 
                            type="text"
                            placeholder="External Borrower Name"
                            className="w-full border p-2 rounded" 
                            value={newLoan.borrowerName} 
                            onChange={e => setNewLoan({...newLoan, borrowerName: e.target.value})} 
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                          <input 
                            required 
                            type="text"
                            placeholder="07..."
                            className="w-full border p-2 rounded" 
                            value={newLoan.borrowerPhone} 
                            onChange={e => setNewLoan({...newLoan, borrowerPhone: e.target.value})} 
                          />
                       </div>
                   </>
               )}

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Principal Amount (RWF)</label>
                  <input required type="number" min="1" className="w-full border p-2 rounded" value={newLoan.principal} onChange={e => setNewLoan({...newLoan, principal: parseFloat(e.target.value)})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input required type="date" className="w-full border p-2 rounded" value={newLoan.dueDate} onChange={e => setNewLoan({...newLoan, dueDate: e.target.value})} />
               </div>
               
               <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 flex items-start space-x-2">
                 <AlertTriangle size={16} className="mt-0.5" />
                 <span>Interest (Profit) is automatically calculated at 10% ({newLoan.principal * 0.1} RWF).</span>
               </div>

               <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Issue Loan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 m-4">
            <h3 className="text-xl font-bold mb-4">Record Repayment</h3>
            <form onSubmit={handlePayment} className="space-y-4">
              {/* compute months elapsed and monthly interest */}
              {(() => {
                const loan = loans.find(l => l.id === selectedLoan);
                return loan ? (
                  <div className="mb-3 p-3 bg-slate-50 rounded text-sm text-slate-700">
                    <InterestInfo loan={loan} />
                  </div>
                ) : null;
              })()}
              <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-4">
                  Please split the payment between the Principal amount and the Profit (Interest) amount.
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Principal Payment (RWF)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={paymentPrincipal} 
                    onChange={e => setPaymentPrincipal(e.target.value)} 
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Profit/Interest Payment (RWF)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={paymentProfit} 
                    onChange={e => setPaymentProfit(e.target.value)} 
                  />
              </div>


              <div className="flex justify-between items-center bg-slate-100 p-2 rounded font-bold text-slate-700">
                  <span>Total Paying:</span>
                  <span>{((parseFloat(paymentPrincipal)||0) + (parseFloat(paymentProfit)||0)).toLocaleString()} RWF</span>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setSelectedLoan(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
