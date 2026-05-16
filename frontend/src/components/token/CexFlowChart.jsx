import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { formatNumber } from '../../utils/format';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';

function formatCompactNumber(value) {
  const numberValue = Number(value || 0);
  const absValue = Math.abs(numberValue);

  if (absValue >= 1_000_000) {
    return `${(numberValue / 1_000_000).toFixed(2)}M`;
  }

  if (absValue >= 1_000) {
    return `${(numberValue / 1_000).toFixed(1)}K`;
  }

  return formatNumber(numberValue);
}

function getFlowLabel(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0) {
    return 'Завод на CEX / Sell pressure';
  }

  if (numberValue < 0) {
    return 'Вывод с CEX / Supply drain';
  }

  return 'Нейтрально';
}

function getFlowColor(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0) {
    return '#ef4444';
  }

  if (numberValue < 0) {
    return '#22c55e';
  }

  return '#64748b';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = Number(payload[0].value || 0);
  const isSellPressure = value > 0;
  const isSupplyDrain = value < 0;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p
        className={[
          'mt-2 text-sm font-bold',
          isSellPressure
            ? 'text-red-300'
            : isSupplyDrain
              ? 'text-emerald-300'
              : 'text-slate-300'
        ].join(' ')}
      >
        {getFlowLabel(value)}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {formatNumber(value)} UNI
      </p>

      <p className="mt-2 max-w-[260px] text-xs leading-5 text-slate-500">
        {isSellPressure &&
          'Положительный netflow: токены заводят на известные CEX-кошельки. Это может означать риск продажи.'}

        {isSupplyDrain &&
          'Отрицательный netflow: токены выводят с известных CEX-кошельков. Это может означать снижение доступного supply.'}

        {!isSellPressure && !isSupplyDrain &&
          'Netflow около нуля: явного перевеса inflow/outflow нет.'}
      </p>
    </div>
  );
}

function toChartData(items = []) {
  return [...items]
    .sort((a, b) => new Date(`${a.date}T00:00:00.000Z`) - new Date(`${b.date}T00:00:00.000Z`))
    .map((item) => ({
      date: item.date.slice(5),
      netflow: Number(item.cexNetflow || 0)
    }));
}

export default function CexFlowChart({
  cexFlows,
  title = 'Структура CEX flows',
  subtitle = 'Дневной CEX netflow. Положительные значения означают завод токенов на CEX и возможное давление продажи. Отрицательные значения означают вывод токенов с CEX и снижение доступного supply.'
}) {
  const cexChartData = toChartData(cexFlows?.items || []);

  return (
    <Card
      title={title}
      subtitle={subtitle}
      right={
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-red-300">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            Завод на CEX / Sell pressure
          </div>

          <div className="flex items-center gap-2 text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Вывод с CEX / Supply drain
          </div>
        </div>
      }
    >
      {cexChartData.length ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cexChartData}
              margin={{
                top: 12,
                right: 12,
                left: 8,
                bottom: 0
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickFormatter={formatCompactNumber}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <ReferenceLine
                y={0}
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="netflow" radius={[8, 8, 8, 8]}>
                {cexChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getFlowColor(entry.netflow)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          title="Нет CEX flows для выбранного диапазона"
          description="Выбери другой диапазон или обнови real recent CEX flows."
        />
      )}
    </Card>
  );
}
