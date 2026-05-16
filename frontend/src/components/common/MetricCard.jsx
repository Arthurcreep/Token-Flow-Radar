import { getSignedClass } from '../../utils/format';

export default function MetricCard({ label, value, hint, signed = false, right }) {
  const isSimpleValue = typeof value === 'string' || typeof value === 'number';

  return (
    <div className="soft-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="metric-label">{label}</p>

          {isSimpleValue ? (
            <p className={`metric-value ${signed ? getSignedClass(value) : ''}`}>
              {value}
            </p>
          ) : (
            <div className="mt-2">
              {value}
            </div>
          )}

          {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
        </div>

        {right}
      </div>
    </div>
  );
}
