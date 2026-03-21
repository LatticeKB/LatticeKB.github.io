const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function formatAbsoluteDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : dateFormatter.format(date);
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return relativeFormatter.format(diffMinutes, 'minute');
    }

    return relativeFormatter.format(diffHours, 'hour');
  }

  return relativeFormatter.format(diffDays, 'day');
}
