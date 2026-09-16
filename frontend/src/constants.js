export const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const today = () => new Date().toISOString().slice(0, 10);
export const monthNow = () => new Date().toISOString().slice(0, 7);
export const categories = ['Salary', 'Freelance', 'Food', 'Travel', 'Rent', 'Shopping', 'Bills', 'Health', 'Education', 'Investment', 'Other'];
