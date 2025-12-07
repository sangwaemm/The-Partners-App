
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
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  amountSpent: number;
  amountEarned: number;
  date: string;
  category: string;
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
  notifications: Notification[];
  language: 'en' | 'rw';
  settings: AppSettings;
}

export const DEFAULT_SHARE_PRICE = 100000;
export const CONTRIBUTION_AMOUNT = 8000;
export const CONTRIBUTION_PERIOD_DAYS = 28;
export const DEFAULT_LOAN_INTEREST = 10; // 10%