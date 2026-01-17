import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, startOfWeek, endOfWeek, isWithinInterval, isToday, parseISO } from 'date-fns';
import { Visitor, WeekGroup } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy');
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function groupVisitorsByWeek(visitors: Visitor[]): WeekGroup[] {
  const weekMap = new Map<string, WeekGroup>();

  visitors.forEach((visitor) => {
    const arrivalDate = typeof visitor.arrivalDate === 'string'
      ? parseISO(visitor.arrivalDate)
      : visitor.arrivalDate;

    const weekStart = startOfWeek(arrivalDate, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(arrivalDate, { weekStartsOn: 0 });
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekStart,
        weekEnd,
        visitors: [],
      });
    }

    weekMap.get(weekKey)!.visitors.push(visitor);
  });

  // Sort weeks from newest to oldest
  return Array.from(weekMap.values()).sort(
    (a, b) => b.weekStart.getTime() - a.weekStart.getTime()
  );
}

export function getThisWeekVisitors(visitors: Visitor[]): Visitor[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  return visitors.filter((visitor) => {
    const arrivalDate = typeof visitor.arrivalDate === 'string'
      ? parseISO(visitor.arrivalDate)
      : visitor.arrivalDate;
    return isWithinInterval(arrivalDate, { start: weekStart, end: weekEnd });
  });
}

export function getTodayVisitors(visitors: Visitor[]): Visitor[] {
  return visitors.filter((visitor) => {
    const arrivalDate = typeof visitor.arrivalDate === 'string'
      ? parseISO(visitor.arrivalDate)
      : visitor.arrivalDate;
    return isToday(arrivalDate);
  });
}

export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
}

export function generateDriverLink(visitorId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/driver/${visitorId}`;
}
