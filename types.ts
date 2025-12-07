
export enum UserRole {
  ADMIN = 'ADMIN',
  PRESIDENT = 'PRESIDENT',
  SECRETARY = 'SECRETARY',
  MEMBER = 'MEMBER',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  shares: number; // 1 share = 100,000 RWF
  joinedDate: string;
  status: 'active' | 'inactive';
  historicalContribution?: number; // Amount contributed before system start
  historicalProfit?: number; // Profit earned before system start
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number; // 8,000 RWF
  periodStart: string;
  periodEnd: string;
  datePaid: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Loan {
  id: string;
  memberId?: string; // Optional now, for members
  borrowerType: 'MEMBER' | 'EXTERNAL';
  borrowerName: string;
  borrowerPhone?: string; // For external
  principal: number;
  interestRate: number; // Default 10%
  totalInterest: number;
  totalDue: number;
  amountPaid: number; // Total paid (Principal + Interest)
  interestPaid: number; // Track specifically how much interest/profit was paid
  remainingAmount: number;
  dateIssued: string;
  dueDate: string;
  status: LoanStatus;
  monthsPaidHistory?: { months: number; date: string }[];
}

export interface Investment {
  id: string;
  name: string; // e.g., "Real Estate", "Business", "Equipment"
  description?: string;
  totalCapital: number; // Initial capital invested
  totalExpenses: number; // Sum of all expenses
  totalProfits: number; // Sum of all profits
  dateCreated: string;
  lastUpdated: string;
  expenseHistory?: { amount: number; description: string; date: string }[];
  profitHistory?: { amount: number; description: string; date: string }[];
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  amountSpent: number;
  amountEarned: number;
  date: string;
  category: string;
  actorName?: string; // person who performed the activity
  actorId?: string; // member ID for stronger linking
  activityType?: 'CONTRIBUTION' | 'GIVEN_LOAN' | 'PAYING_LOAN' | 'PAYING_PROFIT' | 'EXPENSE' | 'INVESTMENT' | 'GENERAL';
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  read: boolean;
  targetRole?: UserRole;
}

export interface AppSettings {
  loanInterestRate: number; // Percentage, e.g., 10 for 10%
  sharePrice: number; // e.g., 100,000
}

export interface AppState {
  currentUser: Member | null;
  members: Member[];
  contributions: Contribution[];
  loans: Loan[];
  activities: Activity[];
  investments: Investment[];
  notifications: Notification[];
  language: 'en' | 'rw';
  settings: AppSettings;
}

export const DEFAULT_SHARE_PRICE = 100000;
export const CONTRIBUTION_AMOUNT = 8000;
export const CONTRIBUTION_PERIOD_DAYS = 28;
export const DEFAULT_LOAN_INTEREST = 10; // 10%

export interface DataContextType extends AppState {
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  setLanguage: (lang: 'en' | 'rw') => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  addLoan: (loan: Omit<Loan, 'id'>) => void;
  deleteLoan: (id: string) => void;
  payLoan: (loanId: string, principalAmount: number, interestAmount: number, monthsPaid?: number) => void;
  addContribution: (contribution: Omit<Contribution, 'id'>) => void;
  deleteContribution: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  deleteActivity: (id: string) => void;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addInvestmentExpense: (investmentId: string, amount: number, description: string, date: string) => void;
  addInvestmentProfit: (investmentId: string, amount: number, description: string, date: string) => void;
  updateSettings: (newSettings: AppSettings) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  translations: Record<string, string>;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}