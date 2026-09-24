/**
 * Utility functions for date & duration formatting in Indonesia Locale (WIB - UTC+7)
 */

export function toJakartaTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + (7 * 60 * 60 * 1000));
}

export function formatDateIndo(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTimeIndo(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(startDate: Date | string, endDate?: Date | string | null): string {
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();

  if (isNaN(start) || isNaN(end)) return '-';

  const diffMs = Math.abs(end - start);
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} Hari ${remainingHours} Jam`;
  }
  if (totalHours > 0) {
    return `${totalHours} Jam ${remainingMinutes} Menit`;
  }
  return `${totalMinutes} Menit`;
}
