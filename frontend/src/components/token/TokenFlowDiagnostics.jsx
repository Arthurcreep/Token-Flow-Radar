import Card from '../common/Card';

import {
  formatCompactUsd,
  formatNumber
} from '../../utils/format';

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  return `${Number(value).toFixed(1)}%`;
}

function getSignedUsdClass(value) {
  const numberValue = toNumber(value);

  if (numberValue < 0) return 'text-emerald-300';
  if (numberValue > 0) return 'text-red-300';

  return 'text-slate-300';
}

function getRiskClass(riskLevel) {
  if (riskLevel === 'high') return 'border-red-500/40 bg-red-500/10 text-red-300';
  if (riskLevel === 'medium') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  if (riskLevel === 'low') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';

  return 'border-slate-700 bg-slate-800 text-slate-300';
}

function translateRiskLevel(riskLevel) {
  if (riskLevel === 'high') return 'высокий';
  if (riskLevel === 'medium') return 'средний';
  if (riskLevel === 'low') return 'низкий';

  return 'не определен';
}

function QuestionCard({
  question
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
        {question.question}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        {question.answer}
      </p>
    </div>
  );
}

function ConcentrationWarning({
  concentrationRisk
}) {
  if (!concentrationRisk) return null;

  const riskLevel = concentrationRisk.riskLevel;

  if (riskLevel !== 'high' && riskLevel !== 'medium') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200">
        Концентрация низкая: движение не выглядит полностью завязанным на один адрес или одну entity.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
      <span className="font-black">Внимание: высокая концентрация.</span>{' '}
      Большая часть движения пришла от одного участника или адреса. Такой сигнал может быть не рыночным накоплением,
      а техническим перераспределением ликвидности внутри CEX-инфраструктуры.
    </div>
  );
}

function MainMetrics({
  diagnostics
}) {
  const summary = diagnostics?.summary || {};
  const data = diagnostics?.diagnostics || {};
  const concentrationRisk = data.concentrationRisk || {};

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card title="Главный день вывода" subtitle={data.mainOutflowDay?.date || '—'}>
        <p className={['text-2xl font-black', getSignedUsdClass(data.mainOutflowDay?.cexNetflowUsd)].join(' ')}>
          {formatCompactUsd(data.mainOutflowDay?.cexNetflowUsd)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Самый сильный дневной netflow
        </p>
      </Card>

      <Card title="Паттерн" subtitle={data.pattern?.confidence ? `уверенность: ${data.pattern.confidence}` : '—'}>
        <p className="text-2xl font-black text-white">
          {data.pattern?.label || '—'}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Отрицательных дней: {summary.negativeNetflowDays ?? 0} из {summary.activeDays ?? 0}
        </p>
      </Card>

      <Card title="Крупные выводы" subtitle={`Порог: ${formatCompactUsd(summary.largeTransferThresholdUsd)}`}>
        <p className="text-2xl font-black text-emerald-300">
          {formatCompactUsd(summary.largeOutflowUsd)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {formatNumber(summary.largeOutflowCount, 0)} крупных outflow-транзакций
        </p>
      </Card>

      <Card title="Концентрация" subtitle="Entity / address risk">
        <span className={['inline-flex rounded-full border px-3 py-2 text-sm font-black', getRiskClass(concentrationRisk.riskLevel)].join(' ')}>
          {translateRiskLevel(concentrationRisk.riskLevel)}
        </span>
        <p className="mt-3 text-xs text-slate-500">
          entity {formatPct(concentrationRisk.topEntitySharePct)} · address {formatPct(concentrationRisk.topAddressSharePct)}
        </p>
      </Card>
    </div>
  );
}

function EntityBreakdown({
  items = []
}) {
  return (
    <Card
      title="Участники потока"
      subtitle="Какие биржи / entity дали основной вклад в движение."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Участник</th>
              <th className="px-4 py-3">Завод</th>
              <th className="px-4 py-3">Вывод</th>
              <th className="px-4 py-3">Netflow</th>
              <th className="px-4 py-3">Транзакции</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.key || item.label} className="border-b border-slate-900/80">
                <td className="px-4 py-4 font-bold text-white">{item.label || item.key}</td>
                <td className="px-4 py-4 text-red-300">{formatCompactUsd(item.inflowUsd)}</td>
                <td className="px-4 py-4 text-emerald-300">{formatCompactUsd(item.outflowUsd)}</td>
                <td className={['px-4 py-4 font-black', getSignedUsdClass(item.netflowUsd)].join(' ')}>
                  {formatCompactUsd(item.netflowUsd)}
                </td>
                <td className="px-4 py-4 text-slate-400">
                  завод {formatNumber(item.inflowTxCount, 0)} / вывод {formatNumber(item.outflowTxCount, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!items.length && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center">
          <p className="text-sm font-semibold text-slate-400">Участники не определены.</p>
        </div>
      )}
    </Card>
  );
}

function AddressBreakdown({
  items = []
}) {
  return (
    <Card
      title="CEX-адреса"
      subtitle="Какие конкретные адреса дали основной вклад."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.address || item.key} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-black text-white">{item.label || item.address}</p>
                <p className="mt-1 break-all text-xs text-slate-600">{item.address}</p>
              </div>

              <p className={['text-lg font-black', getSignedUsdClass(item.netflowUsd)].join(' ')}>
                {formatCompactUsd(item.netflowUsd)}
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              entity: {item.entityName || '—'} · завод {formatCompactUsd(item.inflowUsd)} · вывод {formatCompactUsd(item.outflowUsd)}
            </p>
          </div>
        ))}
      </div>

      {!items.length && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center">
          <p className="text-sm font-semibold text-slate-400">Адреса не определены.</p>
        </div>
      )}
    </Card>
  );
}

export default function TokenFlowDiagnostics({
  diagnostics
}) {
  if (!diagnostics) {
    return (
      <Card
        title="Диагностика потока"
        subtitle="Backend diagnostics не найден."
      >
        <p className="text-sm text-slate-500">
          Проверь endpoint /flow-diagnostics для этого токена.
        </p>
      </Card>
    );
  }

  const data = diagnostics.diagnostics || {};
  const questions = data.questions || [];
  const concentrationRisk = data.concentrationRisk || {};

  return (
    <section className="space-y-4">
      <Card
        title="Диагностика потока"
        subtitle="Ответы на ключевые вопросы: когда был вывод, был ли возврат, кто участвовал и нет ли концентрации на одном CEX-адресе."
      >
        <p className="text-sm leading-7 text-slate-300">
          {data.interpretation || 'Интерпретация пока недоступна.'}
        </p>

        {Boolean(data.warnings?.length) && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-200">
            {data.warnings.join(' ')}
          </div>
        )}
      </Card>

      <MainMetrics diagnostics={diagnostics} />

      <ConcentrationWarning concentrationRisk={concentrationRisk} />

      <div className="grid gap-4 lg:grid-cols-2">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <EntityBreakdown items={data.entityBreakdown || []} />
        <AddressBreakdown items={data.addressBreakdown || []} />
      </div>
    </section>
  );
}
