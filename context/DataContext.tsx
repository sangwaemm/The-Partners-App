
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AppState, Member, UserRole, Loan, Contribution, Activity, Notification, Investment,
  DEFAULT_SHARE_PRICE, DEFAULT_LOAN_INTEREST, LoanStatus, AppSettings, DataContextType 
} from '../types';

// Mock Data Seeding (Only used if localStorage is empty)
const MOCK_MEMBERS: Member[] = [
  { id: '1', fullName: 'Admin User', email: 'admin@coop.rw', phone: '0780000000', role: UserRole.ADMIN, shares: 0, joinedDate: '2023-01-01', status: 'active', historicalContribution: 0, historicalProfit: 0 },
  { id: '2', fullName: 'John President', email: 'pres@coop.rw', phone: '0780000001', role: UserRole.PRESIDENT, shares: 5, joinedDate: '2023-01-02', status: 'active', historicalContribution: 500000, historicalProfit: 25000 },
  { id: '3', fullName: 'Jane Secretary', email: 'sec@coop.rw', phone: '0780000002', role: UserRole.SECRETARY, shares: 2, joinedDate: '2023-01-05', status: 'active', historicalContribution: 200000, historicalProfit: 10000 },
  { id: '4', fullName: 'Alice Member', email: 'alice@coop.rw', phone: '0780000003', role: UserRole.MEMBER, shares: 1, joinedDate: '2023-02-01', status: 'active', historicalContribution: 0, historicalProfit: 0 },
  { id: '5', fullName: 'Bob Member', email: 'bob@coop.rw', phone: '0780000004', role: UserRole.MEMBER, shares: 10, joinedDate: '2023-02-15', status: 'active', historicalContribution: 1000000, historicalProfit: 50000 },
];

const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: 'c1', memberId: '4', amount: 8000, periodStart: '2023-10-01', periodEnd: '2023-10-28', datePaid: '2023-10-05', status: 'paid' },
  { id: 'c2', memberId: '5', amount: 8000, periodStart: '2023-10-01', periodEnd: '2023-10-28', datePaid: '2023-10-02', status: 'paid' },
];

const MOCK_LOANS: Loan[] = [
  { 
    id: 'l1', memberId: '4', borrowerType: 'MEMBER', borrowerName: 'Alice Member', 
    principal: 100000, interestRate: 0.1, totalInterest: 10000, 
    totalDue: 110000, amountPaid: 50000, interestPaid: 5000, remainingAmount: 60000, 
    dateIssued: '2023-09-01', dueDate: '2023-12-01', status: LoanStatus.ACTIVE,
    monthsPaidHistory: [{ months: 1, date: '2023-10-01' }]
  }
];

const MOCK_INVESTMENTS: Investment[] = [
  {
    id: 'inv1',
    name: 'Real Estate - Kigali',
    description: 'Commercial property in Kigali CBD',
    totalCapital: 5000000,
    totalExpenses: 500000,
    totalProfits: 1200000,
    dateCreated: '2023-06-01',
    lastUpdated: '2024-12-05',
    expenseHistory: [
      { amount: 250000, description: 'Maintenance and repairs', date: '2023-09-15' },
      { amount: 250000, description: 'Staff wages and utilities', date: '2024-06-01' }
    ],
    profitHistory: [
      { amount: 600000, description: 'Q1 2024 rental income', date: '2024-03-31' },
      { amount: 600000, description: 'Q2 2024 rental income', date: '2024-06-30' }
    ]
  },
  {
    id: 'inv2',
    name: 'Microfinance Business',
    description: 'Small loans and savings cooperative',
    totalCapital: 2000000,
    totalExpenses: 200000,
    totalProfits: 450000,
    dateCreated: '2023-08-01',
    lastUpdated: '2024-12-05',
    expenseHistory: [
      { amount: 200000, description: 'Administrative costs', date: '2024-09-01' }
    ],
    profitHistory: [
      { amount: 450000, description: 'Interest and fees collected', date: '2024-11-30' }
    ]
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  loanInterestRate: DEFAULT_LOAN_INTEREST,
  sharePrice: DEFAULT_SHARE_PRICE,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Simple Dictionary
const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    members: "Members",
    loans: "Loans",
    contributions: "Contributions",
    activities: "Activities",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome back",
    totalShares: "Total Shares Value",
    activeLoans: "Active Loans",
    collected: "Collected",
    outstanding: "Outstanding",
    addMember: "Add Member",
    applyLoan: "Apply Loan",
    pay: "Pay",
    status: "Status",
    role: "Role",
    actions: "Actions",
    currency: "RWF",
    noData: "No data available",
    aiReport: "Generate AI Report",
  },
  rw: {
    dashboard: "Incamake",
    members: "Abanyamuryango",
    loans: "Inguzanyo",
    contributions: "Imisanzu",
    activities: "Ibikorwa",
    reports: "Raporo",
    settings: "Igenamiterere",
    logout: "Sohoka",
    welcome: "Murakaza neza",
    totalShares: "Agaciro k'Imigabane",
    activeLoans: "Inguzanyo zitarishyurwa",
    collected: "Ayakusanyijwe",
    outstanding: "Asigaye",
    addMember: "Ongeramo Umunyamuryango",
    applyLoan: "Saba Inguzanyo",
    pay: "Ishyura",
    status: "Imere",
    role: "Inshingano",
    actions: "Ibikorwa",
    currency: "RWF",
    noData: "Nta makuru ahari",
    aiReport: "Kora Raporo ya AI",
  }
};

// Helper to load from local storage
const loadFromStorage = <T,>(key: string, defaultVal: T): T => {
  try {
    const stored = localStorage.getItem(`coop_${key}`);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch (e) {
    console.error("Failed to load from storage", e);
    return defaultVal;
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  
  // Initialize state from LocalStorage or Fallback Mock Data
  const [members, setMembers] = useState<Member[]>(() => loadFromStorage('members', MOCK_MEMBERS));
  const [contributions, setContributions] = useState<Contribution[]>(() => loadFromStorage('contributions', MOCK_CONTRIBUTIONS));
  const [loans, setLoans] = useState<Loan[]>(() => loadFromStorage('loans', MOCK_LOANS));
  const [investments, setInvestments] = useState<Investment[]>(() => loadFromStorage('investments', MOCK_INVESTMENTS));
  const [activities, setActivities] = useState<Activity[]>(() => loadFromStorage('activities', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('notifications', []));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage('settings', DEFAULT_SETTINGS));
  const [language, setLanguage] = useState<'en' | 'rw'>('en');

  // Persistence Effect: save to localStorage and POST backup to dev server (/api/backup)
  useEffect(() => {
    localStorage.setItem('coop_members', JSON.stringify(members));
    localStorage.setItem('coop_contributions', JSON.stringify(contributions));
    localStorage.setItem('coop_loans', JSON.stringify(loans));
    localStorage.setItem('coop_investments', JSON.stringify(investments));
    localStorage.setItem('coop_activities', JSON.stringify(activities));
    localStorage.setItem('coop_notifications', JSON.stringify(notifications));
    localStorage.setItem('coop_settings', JSON.stringify(settings));

    // Debounced POST to dev server backup endpoint so the workspace keeps an on-disk copy
    const payload = JSON.stringify({ members, contributions, loans, investments, activities, settings, notifications });
    const timer = setTimeout(() => {
      try {
        fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
          .catch(err => {
            // ignore network errors in production-like environments
            console.warn('Backup failed', err);
          });
      } catch (e) {
        // ignore
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [members, contributions, loans, investments, activities, notifications, settings]);

  // On mount: if browser localStorage is empty (new session), try to restore from server backup
  useEffect(() => {
    const stored = localStorage.getItem('coop_members');
    if (!stored || stored === '[]') {
      // try fetch backup from dev server
      fetch('/api/backup').then(async res => {
        if (!res.ok) return;
        try {
          const text = await res.text();
          const data = JSON.parse(text || '{}');
          if (data) {
            if (data.members) setMembers(data.members);
            if (data.contributions) setContributions(data.contributions);
            if (data.loans) setLoans(data.loans);
            if (data.investments) setInvestments(data.investments);
            if (data.activities) setActivities(data.activities);
            if (data.notifications) setNotifications(data.notifications);
            if (data.settings) setSettings(data.settings);
          }
        } catch (e) {
          // ignore parse errors
        }
      }).catch(() => {});
    }
  }, []);

  const login = (email: string, role: UserRole) => {
    const user = members.find(m => m.email === email && m.role === role);
    if (user) {
      setCurrentUser(user);
    } else {
       // Demo fallback login if member not found in list (mostly for admin role testing)
       const demoUser = { ...MOCK_MEMBERS[0], role: role, fullName: `Demo ${role}`, email };
       setCurrentUser(demoUser);
    }
  };

  const logout = () => setCurrentUser(null);

  const addMember = (data: Omit<Member, 'id'>) => {
    const newMember: Member = { 
        ...data, 
        id: Date.now().toString(),
        historicalContribution: 0,
        historicalProfit: 0
    };
    setMembers(prev => [...prev, newMember]);
    notifyAdmin(`New member added: ${newMember.fullName}`);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    notifyAdmin(`Member updated: ${updates.fullName || 'Member ' + id}`);
  };

  const addLoan = (data: Omit<Loan, 'id'>) => {
    const principal = Number(data.principal);
    const rate = settings.loanInterestRate / 100; // Use setting
    const interest = principal * rate;
    const newLoan: Loan = {
      ...data,
      id: Date.now().toString(),
      interestRate: rate,
      totalInterest: interest,
      totalDue: principal + interest,
      amountPaid: 0,
      interestPaid: 0,
      remainingAmount: principal + interest,
      status: LoanStatus.ACTIVE,
      monthsPaidHistory: []
    };
    setLoans(prev => [...prev, newLoan]);
    notifyAdmin(`New loan issued to: ${newLoan.borrowerName}`);
  };

  const deleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    notifyAdmin('Loan record deleted');
  };

  const payLoan = (loanId: string, principalAmount: number, interestAmount: number, monthsPaid?: number) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const totalPayment = principalAmount + interestAmount;
        const newPaid = loan.amountPaid + totalPayment;
        const newInterestPaid = (loan.interestPaid || 0) + interestAmount;
        const newRemaining = loan.totalDue - newPaid;
        const newStatus = newRemaining <= 0.5 ? LoanStatus.PAID : LoanStatus.ACTIVE; // 0.5 buffer for floats

        // Append monthsPaidHistory if provided
        const newMonthsHistory = loan.monthsPaidHistory ? [...loan.monthsPaidHistory] : [];
        if (monthsPaid && monthsPaid > 0) {
          newMonthsHistory.push({ months: monthsPaid, date: new Date().toISOString() });
          const note: Notification = {
            id: Date.now().toString(),
            message: `Payment recorded for loan ${loanId}: ${monthsPaid} month(s) interest paid`,
            type: 'info',
            date: new Date().toISOString(),
            read: false,
            targetRole: UserRole.ADMIN
          };
          setNotifications(n => [note, ...n]);
        }

        return { 
          ...loan, 
          amountPaid: newPaid, 
          interestPaid: newInterestPaid,
          remainingAmount: newRemaining < 0 ? 0 : newRemaining, 
          status: newStatus,
          monthsPaidHistory: newMonthsHistory
        };
      }
      return loan;
    }));
  };

  const addContribution = (data: Omit<Contribution, 'id'>) => {
    setContributions(prev => [...prev, { ...data, id: Date.now().toString() }]);
  };

  const deleteContribution = (id: string) => {
    // Explicitly update state by filtering out the contribution
    setContributions(prev => {
        const updated = prev.filter(c => c.id !== id);
        return updated;
    });
    notifyAdmin('Contribution record deleted');
  };

  const addActivity = (data: Omit<Activity, 'id'>) => {
    setActivities(prev => [...prev, { ...data, id: Date.now().toString() }]);
    notifyAdmin(`New activity recorded: ${data.title}`);
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    notifyAdmin('Activity record deleted');
  };

  const addInvestment = (data: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = {
      ...data,
      id: Date.now().toString(),
      dateCreated: data.dateCreated || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      expenseHistory: data.expenseHistory || [],
      profitHistory: data.profitHistory || []
    };
    setInvestments(prev => [...prev, newInvestment]);
    notifyAdmin(`New investment created: ${newInvestment.name}`);
  };

  const updateInvestment = (id: string, updates: Partial<Investment>) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === id ? { ...inv, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : inv
    ));
    notifyAdmin(`Investment updated: ${updates.name || 'Investment'}`);
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    notifyAdmin('Investment record deleted');
  };

  const addInvestmentExpense = (investmentId: string, amount: number, description: string, date: string) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id === investmentId) {
        const newExpenseHistory = [...(inv.expenseHistory || []), { amount, description, date }];
        return {
          ...inv,
          totalExpenses: inv.totalExpenses + amount,
          expenseHistory: newExpenseHistory,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return inv;
    }));
  };

  const addInvestmentProfit = (investmentId: string, amount: number, description: string, date: string) => {
    setInvestments(prev => prev.map(inv => {
      if (inv.id === investmentId) {
        const newProfitHistory = [...(inv.profitHistory || []), { amount, description, date }];
        return {
          ...inv,
          totalProfits: inv.totalProfits + amount,
          profitHistory: newProfitHistory,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return inv;
    }));
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    notifyAdmin(`System settings updated`);
  };

  const notifyAdmin = (msg: string) => {
    const note: Notification = {
      id: Date.now().toString(),
      message: msg,
      type: 'info',
      date: new Date().toISOString(),
      read: false,
      targetRole: UserRole.ADMIN
    };
    setNotifications(prev => [note, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Database Management Functions
  const exportData = () => {
    const data = {
      members,
      contributions,
      loans,
      investments,
      activities,
      settings,
      notifications
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.members) setMembers(data.members);
      if (data.contributions) setContributions(data.contributions);
      if (data.loans) setLoans(data.loans);
      if (data.investments) setInvestments(data.investments);
      if (data.activities) setActivities(data.activities);
      if (data.settings) setSettings(data.settings);
      if (data.notifications) setNotifications(data.notifications);
      
      notifyAdmin('Database restored from backup file');
      return true;
    } catch (e) {
      console.error("Invalid JSON data", e);
      return false;
    }
  };

  return (
    <DataContext.Provider value={{
      currentUser, members, contributions, loans, investments, activities, notifications, language, settings,
      login, logout, setLanguage, addMember, updateMember, addLoan, deleteLoan, payLoan, 
      addContribution, deleteContribution, addActivity, deleteActivity, 
      addInvestment, updateInvestment, deleteInvestment, addInvestmentExpense, addInvestmentProfit,
      updateSettings,
      markNotificationAsRead, clearNotifications,
      translations: language === 'en' ? TRANSLATIONS.en : TRANSLATIONS.rw,
      exportData, importData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
