import type { CorpusEntry } from '../../corpus/model/types';
import { canonicalTags } from './canonicalTags';
import { normalizeTags } from './normalizeTags';

const tokenPattern = /[a-z0-9][a-z0-9-]+/g;
const synonyms: Record<string, string[]> = {
  vpn: ['globalprotect', 'anyconnect', 'tunnel'],
  authentication: ['sso', 'mfa', 'signin', 'login'],
  password: ['credential', 'credentials', 'password'],
  outlook: ['outlook', 'exchange'],
  mailbox: ['mailbox', 'shared mailbox'],
  search: ['search', 'index', 'indexed'],
  macos: ['macos', 'screen recording', 'finder'],
  windows: ['windows', 'registry', 'event viewer'],
  screensharing: ['screen recording', 'screenshare', 'screen share', 'remote support'],
  access: ['access', 'permission', 'entitlement'],
  security: ['security', 'policy', 'conditional access'],
  network: ['network', 'dns', 'dhcp', 'proxy'],
};

function collectText(entry: Pick<CorpusEntry, 'title' | 'summary' | 'product' | 'category' | 'body'>) {
  return [entry.title, entry.summary, entry.product, entry.category, JSON.stringify(entry.body.blocks)]
    .join(' ')
    .toLowerCase();
}

export function suggestTags(entry: Pick<CorpusEntry, 'title' | 'summary' | 'product' | 'category' | 'body' | 'tags'>) {
  const source = collectText(entry);
  const tokens = new Set(source.match(tokenPattern) ?? []);
  const suggestions = new Set<string>();

  canonicalTags.forEach((tag) => {
    if (tokens.has(tag) || source.includes(tag.replace('-', ' '))) {
      suggestions.add(tag);
      return;
    }

    const related = synonyms[tag];
    if (related?.some((needle) => source.includes(needle))) {
      suggestions.add(tag);
    }
  });

  return normalizeTags([...suggestions]).filter((tag) => !entry.tags.includes(tag));
}
