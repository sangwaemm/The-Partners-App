import { GoogleGenAI } from "@google/genai";
import { Loan, Contribution, Activity, Member } from "../types";

const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateFinancialInsight = async (
  loans: Loan[],
  contributions: Contribution[],
  activities: Activity[],
  members: Member[]
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Prepare data summary for the prompt
    const totalLoans = loans.reduce((sum, l) => sum + l.principal, 0);
    const outstandingLoans = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalSpent = activities.reduce((sum, a) => sum + a.amountSpent, 0);
    const totalEarned = activities.reduce((sum, a) => sum + a.amountEarned, 0);
    const activeMembers = members.filter(m => m.status === 'active').length;

    const prompt = `
      Act as a financial advisor for a cooperative named "CoopPartners".
      Analyze the following data:
      - Active Members: ${activeMembers}
      - Total Contributions Collected: ${totalContributions} RWF
      - Total Loans Issued: ${totalLoans} RWF
      - Outstanding Loan Amount (Risk): ${outstandingLoans} RWF
      - Project Expenses: ${totalSpent} RWF
      - Project Earnings: ${totalEarned} RWF
      
      Please provide a concise financial health report (max 200 words).
      Include:
      1. Overall Health Status (Good/Caution/Critical).
      2. A specific observation about the loan-to-contribution ratio.
      3. One actionable recommendation for the President.
      
      Format with clear headings using Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI report. Please check your API key.";
  }
};