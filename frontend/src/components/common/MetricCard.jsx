import { getSignedClass } from '../../utils/format';

export default function MetricCard({ label, value, hint, signed = false, right }) {
  return (
    <div className="soft-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="metric-label">{label}</p>
          <p className={`metric-value ${signed ? getSignedClass(value) : ''}`}>
            {value}
          </p>
          {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
        </div>
        {right}
      </div>
    </div>
  );
}
