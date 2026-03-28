import { useEffect, useMemo, useState } from 'react';
import type { CorpusEntry } from '../../features/corpus/model/types';
import { Modal } from '../../shared/ui/Modal';
import type { EditorSession } from '../workspace/useWorkspaceController';
import { DocumentSurface } from './components/DocumentSurface';
import { PropertiesRail } from './components/PropertiesRail';
import { deserializeBodyToBlocks } from '../../features/editor/lib/blockDeserialization';
import { serializeBlocksToBody } from '../../features/editor/lib/blockSerialization';
import { normalizeTags } from '../../features/tags/lib/normalizeTags';
import { suggestTags } from '../../features/tags/lib/suggestTags';
import { logAction, logError, logInfo } from '../../shared/lib/clientLogger';
import { clearDraft, readDraft, saveDraft } from '../../features/persistence/lib/draftStore';

type Props = {
  session: EditorSession;
  corpusEntries: CorpusEntry[];
  onClose: () => void;
  onSave: (entry: CorpusEntry) => void;
  onDelete: (entryId: string) => void;
  productOptions: string[];
  categoryOptions: string[];
};

export function EditorModal({ session, corpusEntries, onClose, onSave, onDelete, productOptions, categoryOptions }: Props) {
  const [draft, setDraft] = useState<CorpusEntry | null>(() => session.entry);
  const [aliasesText, setAliasesText] = useState(() => session.entry?.aliases.join(', ') ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!session.open || !session.entry) {
      return;
    }

    let cancelled = false;

    void readDraft(session.entry.id)
      .then((savedDraft) => {
        if (!cancelled && savedDraft) {
          logInfo('editor.draft.restore_completed', {
            entryId: savedDraft.id,
            mode: session.mode,
          });
          setDraft(savedDraft);
          setAliasesText(savedDraft.aliases.join(', '));
        }
      })
      .catch((error) => {
        logError('editor.draft.restore_failed', error, {
          entryId: session.entry.id,
          mode: session.mode,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!confirmDelete) {
      return;
    }

    const handle = window.setTimeout(() => setConfirmDelete(false), 3500);
    return () => window.clearTimeout(handle);
  }, [confirmDelete]);

  useEffect(() => {
    if (!session.open || !draft) {
      return;
    }

    const handle = window.setTimeout(() => {
      void saveDraft(draft)
        .then(() => {
          logInfo('editor.draft.autosaved', {
            entryId: draft.id,
            mode: session.mode,
          });
        })
        .catch((error) => {
          logError('editor.draft.autosave_failed', error, {
            entryId: draft.id,
            mode: session.mode,
          });
        });
    }, 700);

    return () => window.clearTimeout(handle);
  }, [draft, session.open]);

  const suggestedTags = useMemo(() => {
    if (!draft) {
      return [];
    }

    return suggestTags(draft, corpusEntries);
  }, [corpusEntries, draft]);

  if (!session.open || !draft) {
    return null;
  }

  const currentDraft = draft;
  const blocks = deserializeBodyToBlocks(currentDraft.body);

  function patch(next: Partial<CorpusEntry>) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ...next,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function addTag(tag: string) {
    logAction('editor.tag.added', {
      entryId: currentDraft.id,
      tag,
    });
    patch({ tags: normalizeTags([...currentDraft.tags, tag]) });
  }

  function removeTag(tag: string) {
    logAction('editor.tag.removed', {
      entryId: currentDraft.id,
      tag,
    });
    patch({ tags: currentDraft.tags.filter((existing) => existing !== tag) });
  }

  function handleSave() {
    const finalized: CorpusEntry = {
      ...currentDraft,
      title: currentDraft.title.trim() || 'Untitled article',
      summary: currentDraft.summary.trim(),
      product: currentDraft.product.trim() || 'General',
      category: currentDraft.category.trim() || 'Reference',
      aliases: aliasesText
        .split(',')
        .map((alias) => alias.trim())
        .filter(Boolean),
      tags: normalizeTags(currentDraft.tags),
      updatedAt: new Date().toISOString(),
    };

    logAction('editor.article.saved', {
      entryId: finalized.id,
      mode: session.mode,
      tagCount: finalized.tags.length,
      aliasCount: finalized.aliases.length,
    });
    void clearDraft(finalized.id).catch((error) => {
      logError('editor.draft.clear_failed', error, {
        entryId: finalized.id,
      });
    });
    onSave(finalized);
  }

  function handleDelete() {
    if (session.mode !== 'edit') {
      return;
    }

    if (!confirmDelete) {
      logAction('editor.article.delete_confirmation_requested', {
        entryId: currentDraft.id,
      });
      setConfirmDelete(true);
      return;
    }

    logAction('editor.article.deleted', {
      entryId: currentDraft.id,
    });
    void clearDraft(currentDraft.id).catch((error) => {
      logError('editor.draft.clear_failed', error, {
        entryId: currentDraft.id,
      });
    });
    setConfirmDelete(false);
    onDelete(currentDraft.id);
  }

  return (
    <Modal
      open={session.open}
      onClose={onClose}
      title={session.mode === 'create' ? 'New article' : 'Edit article'}
      description="Everything stays local to the browser until you export the corpus JSON."
      className="h-[min(94vh,1020px)]"
    >
      <div className="flex h-full min-h-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <DocumentSurface
          title={currentDraft.title}
          onTitleChange={(title) => patch({ title })}
          blocks={blocks}
          onBlocksChange={(nextBlocks) => patch({ body: serializeBlocksToBody(nextBlocks) })}
        />
        <PropertiesRail
          summary={currentDraft.summary}
          product={currentDraft.product}
          category={currentDraft.category}
          aliases={aliasesText}
          pinned={currentDraft.pinned}
          tags={currentDraft.tags}
          suggestedTags={suggestedTags}
          productOptions={productOptions}
          categoryOptions={categoryOptions}
          canDelete={session.mode === 'edit'}
          confirmDelete={confirmDelete}
          onSummaryChange={(summary) => patch({ summary })}
          onProductChange={(product) => patch({ product })}
          onCategoryChange={(category) => patch({ category })}
          onAliasesChange={(value) => {
            setAliasesText(value);
            patch({ aliases: value.split(',').map((alias) => alias.trim()).filter(Boolean) });
          }}
          onPinnedChange={(pinned) => patch({ pinned })}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onAcceptSuggestion={addTag}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      </div>
    </Modal>
  );
}
