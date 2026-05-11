export default function ErrorState({ message = 'Something went wrong' }) {
  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
      <p className="text-sm font-semibold text-red-300">{message}</p>
      <p className="mt-2 text-xs text-red-300/70">
        Проверь, что backend запущен на http://localhost:4000
      </p>
    </div>
  );
}
