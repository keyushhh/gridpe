/**
 * Standardizes currency formatting for Indian Rupee (INR)
 */
export const formatINR = (amount: number, options: { 
  minimumFractionDigits?: number, 
  maximumFractionDigits?: number,
  showSymbol?: boolean 
} = {}) => {
  const { 
    minimumFractionDigits = 2, 
    maximumFractionDigits = 2,
    showSymbol = true 
  } = options;

  const minDigits = Math.max(0, Math.min(20, minimumFractionDigits));
  const maxDigits = Math.max(minDigits, Math.min(20, maximumFractionDigits));

  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits
  });

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Standardizes date formatting across the app
 */
export const formatDate = (date: string | Date, options: {
  type?: 'short' | 'long' | 'medium' | 'time' | 'full',
  showTodayYesterday?: boolean
} = {}) => {
  const { type = 'medium', showTodayYesterday = false } = options;
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid Date';

  if (showTodayYesterday) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  }

  switch (type) {
    case 'short':
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    case 'medium':
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    case 'time':
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    case 'full':
       return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} | ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    default:
      return d.toLocaleDateString('en-GB');
  }
};
