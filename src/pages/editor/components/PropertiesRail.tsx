import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { TagEditor } from './TagEditor';
import { SuggestedTags } from './SuggestedTags';

type Props = {
  summary: string;
  product: string;
  category: string;
  aliases: string;
  pinned: boolean;
  tags: string[];
  suggestedTags: string[];
  productOptions: string[];
  categoryOptions: string[];
  onSummaryChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAliasesChange: (value: string) => void;
  onPinnedChange: (value: boolean) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onAcceptSuggestion: (tag: string) => void;
  onSave: () => void;
};

export function PropertiesRail(props: Props) {
  return (
    <aside className="lattice-scrollbar flex w-full min-w-0 shrink-0 flex-col gap-4 overflow-visible border-t border-white/8 bg-black/10 px-4 py-5 md:px-5 lg:h-full lg:w-[360px] lg:overflow-auto lg:border-t-0 lg:border-l">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Properties</p>
          <p className="mt-1 text-sm text-muted">Metadata stays in the same exported JSON.</p>
        </div>
        <Button variant="solid" onClick={props.onSave}>Save</Button>
      </div>

      <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">Summary</span>
            <Input as="textarea" value={props.summary} onChange={(event) => props.onSummaryChange(event.target.value)} placeholder="Short operational summary" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">Product</span>
            <Input
              value={props.product}
              onChange={(event) => props.onProductChange(event.target.value)}
              placeholder="Product or system"
              list="product-options"
            />
            <datalist id="product-options">
              {props.productOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">Category</span>
            <Input
              value={props.category}
              onChange={(event) => props.onCategoryChange(event.target.value)}
              placeholder="Category"
              list="category-options"
            />
            <datalist id="category-options">
              {props.categoryOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">Aliases</span>
            <Input value={props.aliases} onChange={(event) => props.onAliasesChange(event.target.value)} placeholder="Comma-separated alternate names" />
          </label>
          <label className="flex items-center rounded-2xl border border-white/8 bg-white/3 px-3.5 py-2.5 sm:items-end">
            <input type="checkbox" checked={props.pinned} onChange={(event) => props.onPinnedChange(event.target.checked)} className="mr-3 accent-teal" />
            <span className="text-sm text-soft-linen">Pinned article</span>
          </label>
        </div>
      </section>

      <TagEditor tags={props.tags} onAddTag={props.onAddTag} onRemoveTag={props.onRemoveTag} />
      <SuggestedTags suggestions={props.suggestedTags} onAccept={props.onAcceptSuggestion} />
    </aside>
  );
}
