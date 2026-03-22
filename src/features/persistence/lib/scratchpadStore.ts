const SCRATCHPAD_KEY = 'latticekb:scratchpad';

type ScratchpadRecord = {
  blocks: Record<string, unknown>[];
  updatedAt: string;
};

function isRecord(value: unknown): value is ScratchpadRecord {
  return typeof value === 'object' && value !== null && Array.isArray((value as ScratchpadRecord).blocks);
}

export function readScratchpad(): ScratchpadRecord {
  try {
    const raw = localStorage.getItem(SCRATCHPAD_KEY);
    if (!raw) {
      return { blocks: [], updatedAt: '' };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return { blocks: [], updatedAt: '' };
    }

    return {
      blocks: parsed.blocks,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return { blocks: [], updatedAt: '' };
  }
}

export function saveScratchpad(blocks: Record<string, unknown>[]) {
  const payload: ScratchpadRecord = {
    blocks,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(SCRATCHPAD_KEY, JSON.stringify(payload));
  return payload.updatedAt;
}

export function clearScratchpad() {
  localStorage.removeItem(SCRATCHPAD_KEY);
}
