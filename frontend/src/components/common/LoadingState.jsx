import { useTranslation } from '../../i18n/useTranslation';

export default function LoadingState({ message }) {
  const { t } = useTranslation();

  return (
    <div className="panel flex min-h-72 items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-300" />
        <p className="mt-4 text-sm text-slate-400">
          {message || t('common.loading')}
        </p>
      </div>
    </div>
  );
}
