type Props = {
  title: string;
  detail?: string;
};

export function ErrorState({ title, detail }: Props) {
  return (
    <div className="rounded-3xl border border-rose-400/18 bg-rose-400/8 px-4 py-3 text-sm text-rose-100">
      <p className="font-medium">{title}</p>
      {detail ? <p className="mt-1 text-rose-100/75">{detail}</p> : null}
    </div>
  );
}
