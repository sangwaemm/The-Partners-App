import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { generateFinancialInsight } from '../services/geminiService';
import { FileText, Download, Sparkles, Calendar } from 'lucide-react';

declare const html2pdf: any;

interface QuarterlyReport {
  quarter: string;
  startDate: string;
  endDate: string;
  
  // Loans
  unpaidLoans: number;
  loansGivenInPeriod: number;
  loansPaidInPeriod: number;
  totalLoansEndOfPeriod: number;
  
  // Profits
  profitFromLoans: number;
  profitFromInvestments: number;
  totalProfitsInPeriod: number;
  
  // Expenses
  activitiesExpenses: number;
  investmentExpenses: number;
  totalExpensesInPeriod: number;
  
  // Investments
  investmentsDoneInPeriod: number;
  
  // Contributions
  contributionsPaidInPeriod: number;
  
  // Account Balance
  previousAccountBalance: number;
  currentAccountBalance: number;
  
  // Total Assets
  totalAssociation: number;
}

export default function Reports() {
  const { loans, contributions, activities, investments, members, translations } = useData();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<QuarterlyReport | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Helper: get quarters available
  const getAvailableQuarters = () => {
    const quarters: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const currentDate = new Date(now);
      currentDate.setMonth(currentDate.getMonth() - (i * 3));
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      const year = currentDate.getFullYear();
      
      const startMonth = (quarter - 1) * 3;
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, startMonth + 3, 0);
      
      quarters.push({
        label: `Q${quarter} ${year}` as string,
        start: startDate,
        end: endDate
      });
    }
    
    return quarters;
  };

  // Helper: check if date is in period
  const isInPeriod = (dateStr: string, start: Date, end: Date): boolean => {
    const date = new Date(dateStr);
    return date >= start && date <= end;
  };

  // Helper: calculate quarterly report
  const calculateQuarterlyReport = (start: Date, end: Date, quarterLabel: string): QuarterlyReport => {
    const loansInPeriod = loans.filter(l => isInPeriod(l.dateIssued, start, end));
    const loansPaid = loans.filter(l => (l.monthsPaidHistory || []).some(h => isInPeriod(h.date, start, end)));
    const contributionsInPeriod = contributions.filter(c => isInPeriod(c.datePaid, start, end));
    const activitiesInPeriod = activities.filter(a => isInPeriod(a.date, start, end));
    const investmentsInPeriod = investments.filter(i => isInPeriod(i.dateCreated, start, end));
    
    const unpaidLoans = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
    const loansGivenInPeriod = loansInPeriod.reduce((sum, l) => sum + l.principal, 0);
    
    const loansPaidInPeriod = loansPaid.reduce((sum, l) => {
      const paidInPeriod = (l.monthsPaidHistory || [])
        .filter(h => isInPeriod(h.date, start, end))
        .reduce((s, h) => s + (h.months * l.principal * l.interestRate), 0);
      return sum + paidInPeriod;
    }, 0);
    
    const totalLoansEndOfPeriod = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
    
    const profitFromLoans = loansPaid.reduce((sum, l) => {
      const paidInPeriod = (l.monthsPaidHistory || [])
        .filter(h => isInPeriod(h.date, start, end))
        .reduce((s, h) => s + (h.months * l.principal * l.interestRate), 0);
      return sum + paidInPeriod;
    }, 0);
    
    const profitFromInvestments = investments.reduce((sum, inv) => {
      const profitsInPeriod = (inv.profitHistory || [])
        .filter(p => isInPeriod(p.date, start, end))
        .reduce((s, p) => s + p.amount, 0);
      return sum + profitsInPeriod;
    }, 0);
    
    const totalProfitsInPeriod = profitFromLoans + profitFromInvestments;
    
    const activitiesExpenses = activitiesInPeriod.reduce((sum, a) => sum + a.amountSpent, 0);
    const investmentExpenses = investments.reduce((sum, inv) => {
      const expensesInPeriod = (inv.expenseHistory || [])
        .filter(e => isInPeriod(e.date, start, end))
        .reduce((s, e) => s + e.amount, 0);
      return sum + expensesInPeriod;
    }, 0);
    
    const totalExpensesInPeriod = activitiesExpenses + investmentExpenses;
    const investmentsDoneInPeriod = investmentsInPeriod.reduce((sum, inv) => sum + inv.totalCapital, 0);
    const contributionsPaidInPeriod = contributionsInPeriod.reduce((sum, c) => sum + c.amount, 0);
    
    const previousStart = new Date(start);
    previousStart.setMonth(previousStart.getMonth() - 3);
    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);
    
    const previousContributions = contributions.filter(c => isInPeriod(c.datePaid, previousStart, previousEnd));
    const previousAccountBalance = previousContributions.reduce((sum, c) => sum + c.amount, 0);
    
    const currentAccountBalance = previousAccountBalance + 
                                  contributionsPaidInPeriod + 
                                  totalProfitsInPeriod + 
                                  loansPaidInPeriod - 
                                  totalExpensesInPeriod - 
                                  investmentsDoneInPeriod;
    
    const totalInvestmentValue = investments.reduce((sum, inv) => sum + (inv.totalCapital - inv.totalExpenses + inv.totalProfits), 0);
    const totalAssociation = currentAccountBalance + totalInvestmentValue + unpaidLoans;
    
    return {
      quarter: quarterLabel,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      unpaidLoans,
      loansGivenInPeriod,
      loansPaidInPeriod,
      totalLoansEndOfPeriod,
      profitFromLoans,
      profitFromInvestments,
      totalProfitsInPeriod,
      activitiesExpenses,
      investmentExpenses,
      totalExpensesInPeriod,
      investmentsDoneInPeriod,
      contributionsPaidInPeriod,
      previousAccountBalance,
      currentAccountBalance,
      totalAssociation
    };
  };

  const quarters = useMemo(() => getAvailableQuarters(), []);

  const handleGenerateQuarterlyReport = (quarterLabel: string) => {
    const quarter = quarters.find(q => q.label === quarterLabel);
    if (quarter) {
      const report = calculateQuarterlyReport(quarter.start, quarter.end, quarterLabel);
      setGeneratedReport(report);
      setSelectedQuarter(quarterLabel);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfRef.current || !generatedReport) return;

    const opt = {
      margin: 10,
      filename: `quarterly_report_${generatedReport.quarter.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(pdfRef.current).save();
  };

  const handleGenerateAIReport = async () => {
    setIsLoading(true);
    const report = await generateFinancialInsight(loans, contributions, activities, members);
    setAiReport(report);
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    const headers = "Type,Amount,Date,Status\n";
    const contributionRows = contributions.map(c => `Contribution,${c.amount},${c.datePaid},${c.status}`).join("\n");
    const loanRows = loans.map(l => `Loan Issued,${l.principal},${l.dateIssued},${l.status}`).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + contributionRows + "\n" + loanRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "coop_financial_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{translations.reports}</h2>
        <button 
          onClick={handleExportCSV}
          className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 border border-slate-300 px-4 py-2 rounded-lg hover:border-blue-400 transition-all"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Quarterly Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar size={24} className="text-blue-600" />
          <h3 className="text-xl font-bold text-slate-800">Quarterly Reports</h3>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Quarter</label>
          <select
            value={selectedQuarter || ''}
            onChange={(e) => {
              const quarter = e.target.value;
              if (quarter) handleGenerateQuarterlyReport(quarter);
            }}
            className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">-- Choose a Quarter --</option>
            {quarters.map(q => (
              <option key={q.label} value={q.label}>{q.label}</option>
            ))}
          </select>
        </div>

        {generatedReport && (
          <>
            {/* PDF Content */}
            <div ref={pdfRef} style={{ padding: '40px', backgroundColor: '#ffffff' }} className="mb-8">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid #3b82f6', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 10px 0' }}>
                  COOPERATIVE FINANCIAL REPORT
                </h1>
                <p style={{ fontSize: '18px', color: '#64748b', margin: '0' }}>
                  Quarterly Report: {generatedReport.quarter}
                </p>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '5px 0 0 0' }}>
                  Period: {generatedReport.startDate} to {generatedReport.endDate}
                </p>
              </div>

              {/* Summary Cards */}
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
                  Financial Summary
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div style={{ backgroundColor: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '15px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0369a1', fontWeight: '500' }}>Unpaid Loans</p>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>
                      {generatedReport.unpaidLoans.toLocaleString()} RWF
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', padding: '15px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#059669', fontWeight: '500' }}>Total Profits</p>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#065f46' }}>
                      {generatedReport.totalProfitsInPeriod.toLocaleString()} RWF
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '8px', padding: '15px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#991b1b', fontWeight: '500' }}>Total Expenses</p>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#7f1d1d' }}>
                      {generatedReport.totalExpensesInPeriod.toLocaleString()} RWF
                    </p>
                  </div>
                </div>
              </div>

              {/* Loans Section */}
              <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
                  1. Loans Summary
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155' }}>Loans Given in Period</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600', color: '#3b82f6' }}>
                        {generatedReport.loansGivenInPeriod.toLocaleString()} RWF
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Loans Paid in Period</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                        {generatedReport.loansPaidInPeriod.toLocaleString()} RWF
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#334155' }}>Total Outstanding Loans</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>
                        {generatedReport.totalLoansEndOfPeriod.toLocaleString()} RWF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Profits Section */}
              <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', borderLeft: '4px solid #10b981', paddingLeft: '10px' }}>
                  2. Profits Breakdown
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#f0fdf4' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dcfce7', fontWeight: '600', color: '#166534' }}>Interest from Loans</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dcfce7', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                        {generatedReport.profitFromLoans.toLocaleString()} RWF
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Profit from Investments</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#059669', fontWeight: '600' }}>
                        {generatedReport.profitFromInvestments.toLocaleString()} RWF
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f0fdf4' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dcfce7', fontWeight: '600', color: '#166534' }}>Total Profits</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dcfce7', textAlign: 'right', fontWeight: '700', color: '#065f46', fontSize: '16px' }}>
                        {generatedReport.totalProfitsInPeriod.toLocaleString()} RWF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expenses Section */}
              <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', borderLeft: '4px solid #ef4444', paddingLeft: '10px' }}>
                  3. Expenses Breakdown
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#fef2f2' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #fee2e2', fontWeight: '600', color: '#7c2d12' }}>Activities Expenses</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #fee2e2', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>
                        {generatedReport.activitiesExpenses.toLocaleString()} RWF
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>Investment Expenses</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>
                        {generatedReport.investmentExpenses.toLocaleString()} RWF
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#fef2f2' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #fee2e2', fontWeight: '600', color: '#7c2d12' }}>Total Expenses</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #fee2e2', textAlign: 'right', fontWeight: '700', color: '#991b1b', fontSize: '16px' }}>
                        {generatedReport.totalExpensesInPeriod.toLocaleString()} RWF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Account Balance Section */}
              <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', borderLeft: '4px solid #8b5cf6', paddingLeft: '10px' }}>
                  4. Account Balance Calculation
                </h2>
                <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px 0', color: '#475569', fontSize: '14px' }}>Previous Balance</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', color: '#1f2937', fontWeight: '600' }}>
                          {generatedReport.previousAccountBalance.toLocaleString()} RWF
                        </td>
                      </tr>
                      <tr style={{ color: '#059669' }}>
                        <td style={{ padding: '8px 0', fontSize: '14px' }}>+ Contributions Paid</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                          +{generatedReport.contributionsPaidInPeriod.toLocaleString()} RWF
                        </td>
                      </tr>
                      <tr style={{ color: '#059669' }}>
                        <td style={{ padding: '8px 0', fontSize: '14px' }}>+ Total Profits</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                          +{generatedReport.totalProfitsInPeriod.toLocaleString()} RWF
                        </td>
                      </tr>
                      <tr style={{ color: '#3b82f6' }}>
                        <td style={{ padding: '8px 0', fontSize: '14px' }}>+ Loans Paid</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                          +{generatedReport.loansPaidInPeriod.toLocaleString()} RWF
                        </td>
                      </tr>
                      <tr style={{ color: '#dc2626' }}>
                        <td style={{ padding: '8px 0', fontSize: '14px' }}>- Total Expenses</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                          -{generatedReport.totalExpensesInPeriod.toLocaleString()} RWF
                        </td>
                      </tr>
                      <tr style={{ color: '#dc2626' }}>
                        <td style={{ padding: '8px 0', fontSize: '14px' }}>- Investments Done</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>
                          -{generatedReport.investmentsDoneInPeriod.toLocaleString()} RWF
                        </td>
                      </tr>
                      <tr style={{ borderTop: '2px solid #4b5563', backgroundColor: '#e0e7ff' }}>
                        <td style={{ padding: '12px 0', fontWeight: 'bold', color: '#3730a3', fontSize: '15px' }}>= Current Balance</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#3730a3', fontSize: '15px' }}>
                          {generatedReport.currentAccountBalance.toLocaleString()} RWF
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Assets Section */}
              <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <div style={{
                  backgroundColor: '#1e293b',
                  color: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#cbd5e1' }}>TOTAL ASSOCIATION ASSETS</p>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: 'bold' }}>
                    {generatedReport.totalAssociation.toLocaleString()} RWF
                  </h3>
                  <p style={{ margin: '0', fontSize: '12px', color: '#94a3b8' }}>
                    Account Balance + Total Investments + Unpaid Loans
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                <p style={{ margin: '0' }}>Report Generated: {new Date().toLocaleString()}</p>
                <p style={{ margin: '5px 0 0 0' }}>CoopPartners Financial Management System</p>
              </div>
            </div>

            {/* Display Version */}
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Unpaid Loans</div>
                  <div className="text-2xl font-bold text-blue-900 mt-2">
                    {generatedReport.unpaidLoans.toLocaleString()} RWF
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                  <div className="text-sm text-emerald-600 font-medium">Total Profits</div>
                  <div className="text-2xl font-bold text-emerald-900 mt-2">
                    {generatedReport.totalProfitsInPeriod.toLocaleString()} RWF
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-100 rounded-lg p-4">
                  <div className="text-sm text-rose-600 font-medium">Total Expenses</div>
                  <div className="text-2xl font-bold text-rose-900 mt-2">
                    {generatedReport.totalExpensesInPeriod.toLocaleString()} RWF
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Contributions Paid</div>
                  <div className="text-2xl font-bold text-purple-900 mt-2">
                    {generatedReport.contributionsPaidInPeriod.toLocaleString()} RWF
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <div className="text-sm text-amber-600 font-medium">Investments Done</div>
                  <div className="text-2xl font-bold text-amber-900 mt-2">
                    {generatedReport.investmentsDoneInPeriod.toLocaleString()} RWF
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 font-medium">Account Balance</div>
                  <div className="text-2xl font-bold text-indigo-900 mt-2">
                    {generatedReport.currentAccountBalance.toLocaleString()} RWF
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                <Download size={20} />
                Download Report as PDF
              </button>
            </div>
          </>
        )}
      </div>

      {/* Gemini AI Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-8">
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center space-x-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
               <Sparkles className="text-white" size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-indigo-900">AI Financial Advisor</h3>
               <p className="text-indigo-600 text-sm">Powered by Google Gemini 2.5 Flash</p>
             </div>
           </div>
           <button 
             onClick={handleGenerateAIReport}
             disabled={isLoading}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
           >
             {isLoading ? 'Analyzing...' : translations.aiReport}
           </button>
         </div>

         {aiReport ? (
           <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-indigo-100 text-slate-700 prose prose-sm max-w-none">
             <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{aiReport}</pre>
           </div>
         ) : (
           <div className="text-center py-8 text-indigo-400">
             Click the button above to generate an instant health check of the cooperative's finances.
           </div>
         )}
      </div>

      {/* Summary Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center">
             <FileText size={18} className="mr-2 text-slate-500" />
             Contribution Summary
           </h3>
           <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                 <span className="text-slate-600">Total Collected</span>
                 <span className="font-bold">{contributions.reduce((a, b) => a + b.amount, 0).toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                 <span className="text-slate-600">Active Contributors</span>
                 <span className="font-bold">{new Set(contributions.map(c => c.memberId)).size}</span>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center">
             <FileText size={18} className="mr-2 text-slate-500" />
             Loan Portfolio
           </h3>
           <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                 <span className="text-slate-600">Principal Issued</span>
                 <span className="font-bold">{loans.reduce((a, b) => a + b.principal, 0).toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded">
                 <span className="text-slate-600">Interest Expected</span>
                 <span className="font-bold text-blue-600">{loans.reduce((a, b) => a + b.totalInterest, 0).toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 rounded border border-red-100">
                 <span className="text-red-700">At Risk (Unpaid)</span>
                 <span className="font-bold text-red-700">{loans.reduce((a, b) => a + b.remainingAmount, 0).toLocaleString()} RWF</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
