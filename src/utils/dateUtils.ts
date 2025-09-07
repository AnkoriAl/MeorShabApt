export const NY_TIMEZONE = 'America/New_York';

export function getCurrentMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}

export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export function getPaymentDate(year: number, month: number): Date {
  // Payment date is first day of month + 2 months
  let paymentYear = year;
  let paymentMonth = month + 2;
  
  if (paymentMonth > 12) {
    paymentYear += Math.floor((paymentMonth - 1) / 12);
    paymentMonth = ((paymentMonth - 1) % 12) + 1;
  }
  
  return new Date(paymentYear, paymentMonth - 1, 1);
}

export function isUWSRSVPWindowOpen(): boolean {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: NY_TIMEZONE }));
  const dayOfWeek = nyTime.getDay(); // 0 = Sunday, 3 = Wednesday
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  
  // Must be before Wednesday 23:59 NY time
  if (dayOfWeek > 3) return false; // Thursday or later
  if (dayOfWeek === 3 && (hour > 23 || (hour === 23 && minute >= 59))) return false;
  
  return true;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

export function getUpcomingSaturday(): Date {
  const now = new Date();
  const saturday = new Date(now);
  const daysUntilSaturday = (6 - now.getDay()) % 7;
  saturday.setDate(now.getDate() + daysUntilSaturday);
  return saturday;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}