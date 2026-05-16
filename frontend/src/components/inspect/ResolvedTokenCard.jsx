import { Link } from 'react-router-dom';

import Badge from '../common/Badge';
import Card from '../common/Card';

function getStatusClass(value) {
  return value
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : 'border-amber-500/40 bg-amber-500/10 text-amber-300';
}

function StatusRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <div className="mt-2">
        <Badge className={getStatusClass(Boolean(value))}>
          {value ? 'yes' : 'no'}
        </Badge>
      </div>
    </div>
  );
}

export default function ResolvedTokenCard({
  resolvedToken,
  onAnalyze,
  analyzeStatus
}) {
  if (!resolvedToken) return null;

  const { inputType, token, status, coingecko, metadata } = resolvedToken;
  const isAnalyzing = analyzeStatus === 'loading';

  return (
    <Card
      title="Resolved token"
      subtitle="Backend resolved the user input and returned analysis readiness status."
      right={
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/tokens/${token.symbol}`}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-200 transition hover:bg-slate-800"
          >
            Open detail
          </Link>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || !status?.readyForCexFlowAnalysis}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze CEX flows'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-3xl font-black text-white">
              {token.symbol}
            </h2>

            <Badge className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
              {inputType?.replaceAll('_', ' ') || 'resolved'}
            </Badge>

            {token.coingeckoId && (
              <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                CoinGecko matched
              </Badge>
            )}
          </div>

          <p className="mt-2 text-lg font-semibold text-slate-300">
            {token.name}
          </p>

          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Contract
              </p>
              <p className="mt-2 break-all font-mono text-slate-300">
                {token.contractAddress}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                CoinGecko ID
              </p>
              <p className="mt-2 font-mono text-slate-300">
                {token.coingeckoId || 'not matched'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Decimals
              </p>
              <p className="mt-2 font-mono text-slate-300">
                {token.decimals}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Chain
              </p>
              <p className="mt-2 font-mono text-slate-300">
                {token.chain}
              </p>
            </div>
          </div>

          {metadata?.totalSupplyRaw && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Total supply raw
              </p>
              <p className="mt-2 break-all font-mono text-xs text-slate-400">
                {metadata.totalSupplyRaw}
              </p>
            </div>
          )}

          {coingecko && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
                CoinGecko match
              </p>
              <p className="mt-2 text-sm text-emerald-100">
                {coingecko.name} · {coingecko.id}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <StatusRow label="Already existed" value={status?.alreadyExisted} />
          <StatusRow label="Metadata loaded" value={status?.metadataLoaded} />
          <StatusRow label="CoinGecko matched" value={status?.coingeckoMatched} />
          <StatusRow label="Ready for CEX flow analysis" value={status?.readyForCexFlowAnalysis} />
        </div>
      </div>

      {status?.warnings?.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="font-semibold text-amber-200">Warnings</p>

          <div className="mt-3 space-y-2">
            {status.warnings.map((warning) => (
              <div key={`${warning.code}-${warning.message}`} className="text-sm text-amber-100/80">
                <span className="font-mono text-amber-300">{warning.code}</span>: {warning.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
