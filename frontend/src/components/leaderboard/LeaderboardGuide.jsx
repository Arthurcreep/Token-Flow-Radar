import Card from '../common/Card';

export default function LeaderboardGuide() {
  return (
    <Card
      title="How to read this table"
      subtitle="This leaderboard is a flow-anomaly shortlist. It is not a buy/sell signal."
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-emerald-300">Negative Netflow USD</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Tokens are leaving known CEX wallets. This is interpreted as <span className="font-semibold text-emerald-300">supply drain</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-red-300">Positive Netflow USD</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Tokens are entering known CEX wallets. This can indicate <span className="font-semibold text-red-300">possible sell pressure</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-cyan-300">Large Netflow</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Same direction logic, but only for transfers above the selected USD threshold.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-amber-300">out / in</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Count of large outflow and inflow transactions. It is not token amount.
          </p>
        </div>
      </div>
    </Card>
  );
}
