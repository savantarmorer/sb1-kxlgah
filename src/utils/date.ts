export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function isDatePast(date: string | Date): boolean {
  return new Date(date) < new Date();
}

export function isDateFuture(date: string | Date): boolean {
  return new Date(date) > new Date();
}

export function getTimeRemaining(endDate: string | Date): number {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  return Math.max(0, Math.floor((end - now) / 1000));
} 