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
import { extractImageMetadata } from '../../features/images/lib/imageBlockHelpers';
import { clearDraft, readDraft, saveDraft } from '../../features/persistence/lib/draftStore';

type Props = {
  session: EditorSession;
  onClose: () => void;
  onSave: (entry: CorpusEntry) => void;
};

export function EditorModal({ session, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<CorpusEntry | null>(() => session.entry);
  const [aliasesText, setAliasesText] = useState(() => session.entry?.aliases.join(', ') ?? '');

  useEffect(() => {
    if (!session.open || !session.entry) {
      return;
    }

    let cancelled = false;

    void readDraft(session.entry.id)
      .then((savedDraft) => {
        if (!cancelled && savedDraft) {
          setDraft(savedDraft);
          setAliasesText(savedDraft.aliases.join(', '));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session.open || !draft) {
      return;
    }

    const handle = window.setTimeout(() => {
      void saveDraft(draft).catch(() => undefined);
    }, 700);

    return () => window.clearTimeout(handle);
  }, [draft, session.open]);

  const suggestedTags = useMemo(() => {
    if (!draft) {
      return [];
    }

    return suggestTags(draft);
  }, [draft]);

  if (!session.open || !draft) {
    return null;
  }

  const currentDraft = draft;
  const blocks = deserializeBodyToBlocks(currentDraft.body);
  const imageCount = extractImageMetadata(blocks).length;

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
    patch({ tags: normalizeTags([...currentDraft.tags, tag]) });
  }

  function removeTag(tag: string) {
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

    void clearDraft(finalized.id).catch(() => undefined);
    onSave(finalized);
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
          confidence={currentDraft.confidence}
          pinned={currentDraft.pinned}
          tags={currentDraft.tags}
          suggestedTags={suggestedTags}
          imageCount={imageCount}
          onSummaryChange={(summary) => patch({ summary })}
          onProductChange={(product) => patch({ product })}
          onCategoryChange={(category) => patch({ category })}
          onAliasesChange={(value) => {
            setAliasesText(value);
            patch({ aliases: value.split(',').map((alias) => alias.trim()).filter(Boolean) });
          }}
          onConfidenceChange={(confidence) => patch({ confidence })}
          onPinnedChange={(pinned) => patch({ pinned })}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onAcceptSuggestion={addTag}
          onSave={handleSave}
        />
      </div>
    </Modal>
  );
}
