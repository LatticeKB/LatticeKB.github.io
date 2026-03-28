type LogLevel = 'action' | 'info' | 'warning' | 'error';

type LogMetadata = Record<string, unknown> | undefined;

const MAX_STRING_LENGTH = 160;
const MAX_ARRAY_LENGTH = 20;
const REDACTED_DATA_URL = '[data-url]';

function truncateString(value: string) {
  if (value.startsWith('data:')) {
    return REDACTED_DATA_URL;
  }

  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}…`;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map(sanitizeValue);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
    );
  }

  return String(value);
}

function formatPrefix(level: LogLevel, action: string) {
  return `${level}-${new Date().toISOString()}-${action}`;
}

function emit(level: LogLevel, action: string, metadata?: LogMetadata) {
  const prefix = formatPrefix(level, action);
  const payload = metadata ? sanitizeValue(metadata) : undefined;

  if (level === 'warning') {
    console.warn(prefix, payload);
    return;
  }

  if (level === 'error') {
    console.error(prefix, payload);
    return;
  }

  if (level === 'info') {
    console.info(prefix, payload);
    return;
  }

  console.log(prefix, payload);
}

export function logAction(action: string, metadata?: LogMetadata) {
  emit('action', action, metadata);
}

export function logInfo(action: string, metadata?: LogMetadata) {
  emit('info', action, metadata);
}

export function logWarning(action: string, metadata?: LogMetadata) {
  emit('warning', action, metadata);
}

export function logError(action: string, error: unknown, metadata?: LogMetadata) {
  emit('error', action, {
    ...metadata,
    error,
  });
}
