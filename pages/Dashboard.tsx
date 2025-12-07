
import React from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line } from 'recharts';
import { Wallet, TrendingUp, AlertCircle, Coins, TrendingDown } from 'lucide-react';
import { UserRole } from '../types';

export default function Dashboard() {
  const { members, loans, contributions, activities, translations, currentUser, settings, investments } = useData();

  // NOTE: Shares are now calculated for display, so totalShares logic might need update if we want exact sum of calculated shares.
  // For now, let's keep the general approximation or sum the calculated shares of all members.
  const calculateShareCount = (m: any) => {
    const totalFunds = (m.historicalContribution || 0) + (m.historicalProfit || 0) + contributions.filter((c: any) => c.memberId === m.id).reduce((s: number, c: any) => s + c.amount, 0);
    return Math.floor(totalFunds / 100000);
  };
  const totalSharesValue = members.reduce((sum, m) => sum + (calculateShareCount(m) * settings.sharePrice), 0);
  
  // 1. Contributions (Collected) = Current Records + Historical Data
  const currentContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const historicalContributions = members.reduce((sum, m) => sum + (m.historicalContribution || 0), 0);
  const totalContributions = currentContributions + historicalContributions;
  
  // 2. Loans Issued (Total Principal)
  const totalLoanIssued = loans.reduce((sum, l) => sum + l.principal, 0);

  // 3. Loans Paid (Principal Repaid)
  const totalPrincipalPaid = loans.reduce((sum, l) => sum + (l.amountPaid - (l.interestPaid || 0)), 0);

  // 4. Loans Unpaid (Outstanding Remaining)
  const totalLoanUnpaid = loans.reduce((sum, l) => sum + l.remainingAmount, 0);

  // 5. Profit Paid (Interest Paid + Activity Earnings ONLY)
  // NOTE: We exclude historical member profits/dividends here as those are distributions, not Coop income.
  const totalInterestPaid = loans.reduce((sum, l) => sum + (l.interestPaid || 0), 0);
  const totalActivityEarnings = activities.reduce((sum, a) => sum + a.amountEarned, 0);
  const totalProfitPaid = totalInterestPaid + totalActivityEarnings;

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value.toLocaleString()} <span className="text-xs font-normal text-slate-400">{translations.currency}</span></h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const loanStatusData = [
    { name: 'Paid', value: loans.filter(l => l.remainingAmount === 0).length },
    { name: 'Active', value: loans.filter(l => l.remainingAmount > 0).length },
  ];

  const financialData = [
    { name: 'Contribs', amount: totalContributions, fill: '#3b82f6', label: 'Collected' },
    { name: 'Issued', amount: totalLoanIssued, fill: '#8b5cf6', label: 'Loan Principal' },
    { name: 'Paid', amount: totalPrincipalPaid, fill: '#10b981', label: 'Principal Paid' },
    { name: 'Unpaid', amount: totalLoanUnpaid, fill: '#f43f5e', label: 'Outstanding' },
    { name: 'Profit', amount: totalProfitPaid, fill: '#f59e0b', label: 'Coop Profit' },
  ];

  // Investment Performance Metrics
  const totalInvestmentCapital = investments.reduce((sum, inv) => sum + inv.totalCapital, 0);
  const totalInvestmentExpenses = investments.reduce((sum, inv) => sum + inv.totalExpenses, 0);
  const totalInvestmentProfits = investments.reduce((sum, inv) => sum + inv.totalProfits, 0);
  const netInvestmentProfit = totalInvestmentProfits - totalInvestmentExpenses;
  const investmentROI = totalInvestmentCapital > 0 ? ((netInvestmentProfit / totalInvestmentCapital) * 100).toFixed(2) : 0;

  const investmentPerformanceData = [
    { name: 'Capital', amount: totalInvestmentCapital, fill: '#3b82f6', label: 'Total Capital' },
    { name: 'Expenses', amount: totalInvestmentExpenses, fill: '#ef4444', label: 'Expenses' },
    { name: 'Profits', amount: totalInvestmentProfits, fill: '#10b981', label: 'Profits' },
    { name: 'Net', amount: netInvestmentProfit, fill: '#8b5cf6', label: 'Net Profit' },
  ];

  const investmentStatusData = [
    { name: 'Profitable', value: investments.filter(inv => (inv.totalProfits - inv.totalExpenses) > 0).length },
    { name: 'Breaking Even', value: investments.filter(inv => (inv.totalProfits - inv.totalExpenses) === 0).length },
    { name: 'Loss', value: investments.filter(inv => (inv.totalProfits - inv.totalExpenses) < 0).length },
  ].filter(item => item.value > 0);

  const renderMemberPortfolio = () => {
    if (!currentUser) return null;
    
    // 1. Current contributions from system records
    const myCurrentContrib = contributions
      .filter(c => c.memberId === currentUser.id)
      .reduce((sum, c) => sum + c.amount, 0);
      
    // 2. Historical contributions manually entered by admin
    const myHistoricalContrib = currentUser.historicalContribution || 0;
    
    // Total Contributions
    const myTotalContrib = myHistoricalContrib + myCurrentContrib;
    
    // 3. Historical Profits (Dividends) manually entered by admin
    const myProfit = currentUser.historicalProfit || 0;
    
    // 4. Total Funds (Contrib + Profit)
    const myTotalFunds = myTotalContrib + myProfit;

    // 5. Calculated Shares: Sum of Funds / 100,000
    // "for share you have to take the sum of the contribution he paid and profit he corrected the divide by 100000"
    const myCalculatedShares = Math.floor(myTotalFunds / 100000);
    const mySharesValue = myCalculatedShares * settings.sharePrice; // Should equal myCalculatedShares * 100000

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Wallet className="mr-2 text-blue-600" size={24} />
                My Financial Presentation
            </h3>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                {currentUser.role} View
            </span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-600 mb-1 font-medium">Total Contribution</p>
                <p className="text-2xl font-bold text-indigo-900">{myTotalContrib.toLocaleString()} RWF</p>
                <p className="text-xs text-indigo-500 mt-1">Paid: {myCurrentContrib.toLocaleString()} | Hist: {myHistoricalContrib.toLocaleString()}</p>
             </div>

             <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-600 mb-1 font-medium">Total Profit Collected</p>
                <p className="text-2xl font-bold text-emerald-900">{myProfit.toLocaleString()} RWF</p>
                <p className="text-xs text-emerald-500 mt-1">Accumulated Dividends</p>
             </div>

             <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-md">
                <p className="text-sm text-slate-300 mb-1 font-medium">My Total Funds</p>
                <p className="text-2xl font-bold text-white">{myTotalFunds.toLocaleString()} RWF</p>
                <p className="text-xs text-slate-400 mt-1">Contrib + Profit</p>
             </div>

             <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 mb-1 font-medium">Calculated Shares</p>
                <p className="text-2xl font-bold text-blue-900">{myCalculatedShares}</p>
                <p className="text-xs text-blue-500 mt-1">
                   1 Share = 100,000 RWF (Total Funds ÷ 100k)
                </p>
             </div>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Member Specific View */}
      {renderMemberPortfolio()}

      {/* General Stats (Visible to everyone, but Member view focuses on personal above) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={translations.totalShares} value={totalSharesValue} icon={TrendingUp} color="bg-blue-500" />
        <StatCard title={translations.collected} value={totalContributions} icon={Wallet} color="bg-indigo-500" />
        <StatCard title="Coop Profit" value={totalProfitPaid} icon={Coins} color="bg-emerald-500" />
        <StatCard title={translations.outstanding} value={totalLoanUnpaid} icon={AlertCircle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Overview (Cooperative)</h3>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} RWF`, '']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={50} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Loan Portfolios</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loanStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {loanStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {loanStatusData.map((entry, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {entry.name}: {entry.value}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Principal Paid</span>
                <span className="font-bold text-emerald-600">{totalPrincipalPaid.toLocaleString()} RWF</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Profit Collected</span>
                <span className="font-bold text-amber-500">{totalProfitPaid.toLocaleString()} RWF</span>
             </div>
          </div>
        </div>
      </div>

      {/* Investment Performance Overview */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <TrendingUp className="mr-2 text-emerald-600" size={24} />
          Investment Performance Overview
        </h2>

        {/* Investment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border border-blue-200">
            <p className="text-sm text-blue-700 mb-1 font-medium">Total Investment Capital</p>
            <p className="text-2xl font-bold text-blue-900">{totalInvestmentCapital.toLocaleString()} RWF</p>
            <p className="text-xs text-blue-600 mt-2">{investments.length} active investments</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl shadow-sm border border-red-200">
            <p className="text-sm text-red-700 mb-1 font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-red-900">{totalInvestmentExpenses.toLocaleString()} RWF</p>
            <p className="text-xs text-red-600 mt-2">Operational costs</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl shadow-sm border border-emerald-200">
            <p className="text-sm text-emerald-700 mb-1 font-medium">Total Profits</p>
            <p className="text-2xl font-bold text-emerald-900">{totalInvestmentProfits.toLocaleString()} RWF</p>
            <p className="text-xs text-emerald-600 mt-2">Generated returns</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-sm border border-purple-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-purple-700 mb-1 font-medium">Net Profit</p>
                <p className="text-2xl font-bold text-purple-900">{netInvestmentProfit.toLocaleString()} RWF</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-600 font-medium">ROI</p>
                <p className="text-xl font-bold text-purple-900">{investmentROI}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Investment Performance (Capital, Expenses, Profits)</h3>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investmentPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} RWF`, '']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={60} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Investment Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Investment Health</h3>
          {investmentStatusData.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {investmentStatusData.map((entry, index) => {
                        const colors = ['#10b981', '#f59e0b', '#ef4444'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col space-y-2 mt-4">
                  {investmentStatusData.map((entry, index) => {
                    const colors = ['#10b981', '#f59e0b', '#ef4444'];
                    const labels = ['Profitable', 'Breaking Even', 'Loss'];
                    return (
                      <div key={index} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }}></span>
                        {labels[index] || entry.name}: {entry.value}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <p className="text-center">No investments yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
