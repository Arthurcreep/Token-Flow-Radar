import { useTranslation } from '../../i18n/useTranslation';

const languages = [
  { value: 'ru', label: 'RU' },
  { value: 'en', label: 'EN' }
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-1">
      {languages.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setLanguage(item.value)}
          className={[
            'rounded-xl px-3 py-2 text-xs font-bold transition',
            language === item.value
              ? 'bg-cyan-400/15 text-cyan-200'
              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
