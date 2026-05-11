export default function EmptyState({ title = 'No data', description = 'Nothing to show yet.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
      <p className="font-semibold text-slate-300">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
