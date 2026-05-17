import Card from '../common/Card';

import {
  formatCompactUsd
} from '../../utils/format';

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function getProfileCount(items, profileLabel) {
  return items.filter((item) => item.analysisProfile?.profileLabel === profileLabel).length;
}

function getTotalNetflowUsd(items) {
  return items.reduce((sum, item) => sum + toNumber(item.cex?.netflowUsd), 0);
}

function getTotalLargeNetflowUsd(items) {
  return items.reduce((sum, item) => sum + toNumber(item.large?.netflowUsd), 0);
}

function getTopCleanCandidate(items) {
  const cleanItems = items
    .filter((item) => item.analysisProfile?.profileLabel === 'clean_supply_drain')
    .sort((a, b) => Math.abs(toNumber(b.cex?.netflowUsd)) - Math.abs(toNumber(a.cex?.netflowUsd)));

  return cleanItems[0] || null;
}

function getTopRiskCandidate(items) {
  const riskyItems = items
    .filter((item) => {
      const flags = item.analysisProfile?.riskFlags || [];

      return flags.includes('large_layer_conflict')
        || flags.includes('extreme_ath_drawdown')
        || flags.includes('extreme_recovery_distance');
    })
    .sort((a, b) => Math.abs(toNumber(b.cex?.netflowUsd)) - Math.abs(toNumber(a.cex?.netflowUsd)));

  return riskyItems[0] || null;
}

function getMarketBias({
  cleanCount,
  sellPressureCount,
  mixedCount,
  unconfirmedCount,
  totalNetflowUsd
}) {
  if (cleanCount >= 5 && totalNetflowUsd < 0) {
    return {
      label: 'Доминирует вывод с бирж',
      tone: 'text-emerald-300',
      description: 'Большая часть качественных сигналов показывает вывод токенов с известных CEX-кошельков.'
    };
  }

  if (sellPressureCount >= 3 || totalNetflowUsd > 0) {
    return {
      label: 'Риск давления продажи',
      tone: 'text-red-300',
      description: 'По рынку заметен завод токенов на биржи или картина недостаточно конструктивна.'
    };
  }

  if (mixedCount + unconfirmedCount > cleanCount) {
    return {
      label: 'Шумный рынок',
      tone: 'text-amber-300',
      description: 'Смешанных и неподтвержденных сигналов больше, чем чистых.'
    };
  }

  return {
    label: 'Нейтральный watchlist',
    tone: 'text-slate-300',
    description: 'Сигналы есть, но общая картина пока не выглядит однозначной.'
  };
}

function translateProfileLabel(value) {
  if (value === 'clean_supply_drain') return 'чистый вывод с бирж';
  if (value === 'speculative_recovery_candidate') return 'спекулятивное восстановление';
  if (value === 'mixed_flow') return 'смешанный поток';
  if (value === 'unconfirmed_flow') return 'неподтвержденный поток';
  if (value === 'sell_pressure_watch') return 'риск давления продажи';

  return 'профиль не определен';
}

function translateStrength(value) {
  if (value === 'very_strong') return 'очень сильный';
  if (value === 'strong') return 'сильный';
  if (value === 'moderate') return 'умеренный';
  if (value === 'weak') return 'слабый';

  return 'нет оценки';
}

function StatCard({
  label,
  value,
  description,
  valueClassName = 'text-white'
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={['mt-3 text-2xl font-black', valueClassName].join(' ')}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function CandidateCard({
  title,
  item,
  emptyText
}) {
  if (!item) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
        <p className="mt-3 text-lg font-black text-slate-500">—</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-black text-white">{item.token?.symbol}</p>
        <p className="text-xs text-slate-500">{item.token?.name}</p>
      </div>

      <p className={['mt-2 text-sm font-bold', toNumber(item.cex?.netflowUsd) < 0 ? 'text-emerald-300' : 'text-red-300'].join(' ')}>
        {formatCompactUsd(item.cex?.netflowUsd)}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {translateProfileLabel(item.analysisProfile?.profileLabel)} · {translateStrength(item.strength)}
      </p>
    </div>
  );
}

export default function LeaderboardOverview({
  items = []
}) {
  const cleanCount = getProfileCount(items, 'clean_supply_drain');
  const speculativeCount = getProfileCount(items, 'speculative_recovery_candidate');
  const mixedCount = getProfileCount(items, 'mixed_flow');
  const unconfirmedCount = getProfileCount(items, 'unconfirmed_flow');
  const sellPressureCount = getProfileCount(items, 'sell_pressure_watch');

  const totalNetflowUsd = getTotalNetflowUsd(items);
  const totalLargeNetflowUsd = getTotalLargeNetflowUsd(items);

  const topCleanCandidate = getTopCleanCandidate(items);
  const topRiskCandidate = getTopRiskCandidate(items);

  const marketBias = getMarketBias({
    cleanCount,
    sellPressureCount,
    mixedCount,
    unconfirmedCount,
    totalNetflowUsd
  });

  return (
    <Card
      title="Обзор рынка"
      subtitle="Сводка по текущей таблице: CEX-потоки, крупные переводы, ценовой контекст и профиль сигнала."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Общий режим"
          value={marketBias.label}
          valueClassName={marketBias.tone}
          description={marketBias.description}
        />

        <StatCard
          label="Суммарный CEX netflow"
          value={formatCompactUsd(totalNetflowUsd)}
          valueClassName={totalNetflowUsd < 0 ? 'text-emerald-300' : totalNetflowUsd > 0 ? 'text-red-300' : 'text-slate-300'}
          description="Минус означает, что по выбранным токенам предложение в сумме выходит с известных биржевых кошельков."
        />

        <StatCard
          label="Крупный netflow"
          value={formatCompactUsd(totalLargeNetflowUsd)}
          valueClassName={totalLargeNetflowUsd < 0 ? 'text-emerald-300' : totalLargeNetflowUsd > 0 ? 'text-red-300' : 'text-slate-300'}
          description="Сумма только по крупным переводам выше заданного USD-порога."
        />

        <StatCard
          label="Токены в выборке"
          value={items.length}
          description="Количество токенов, которые сейчас видны после выбранных фильтров."
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Чистый вывод"
          value={cleanCount}
          valueClassName="text-emerald-300"
          description="Вывод с бирж подтвержден крупными переводами."
        />

        <StatCard
          label="Спекулятивные"
          value={speculativeCount}
          valueClassName="text-amber-300"
          description="Вывод есть, но просадка от ATH или риск восстановления высокие."
        />

        <StatCard
          label="Смешанные"
          value={mixedCount}
          valueClassName="text-fuchsia-300"
          description="Общий поток и крупные переводы показывают разное направление."
        />

        <StatCard
          label="Без подтверждения"
          value={unconfirmedCount}
          valueClassName="text-slate-300"
          description="Есть движение, но крупные переводы его не подтверждают."
        />

        <StatCard
          label="Давление продажи"
          value={sellPressureCount}
          valueClassName="text-red-300"
          description="Профиль похож на завод токенов на биржи."
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CandidateCard
          title="Лучший чистый кандидат"
          item={topCleanCandidate}
          emptyText="В текущей выборке нет чистого кандидата с подтвержденным выводом."
        />

        <CandidateCard
          title="Главная аномалия"
          item={topRiskCandidate}
          emptyText="В текущей выборке нет сильной аномалии с заметными риск-флагами."
        />
      </div>
    </Card>
  );
}
