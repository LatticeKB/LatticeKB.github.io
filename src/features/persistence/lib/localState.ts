const LAST_CORPUS_KEY = 'latticekb:last-corpus-name';

export function setLastCorpusName(name: string) {
  localStorage.setItem(LAST_CORPUS_KEY, name);
}

export function getLastCorpusName() {
  return localStorage.getItem(LAST_CORPUS_KEY);
}
