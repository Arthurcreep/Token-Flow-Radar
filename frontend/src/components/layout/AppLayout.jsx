import { NavLink, Outlet } from 'react-router-dom';

function getLinkClass({ isActive }) {
  return [
    'rounded-2xl px-4 py-2 text-sm font-bold transition',
    isActive
      ? 'bg-cyan-400/15 text-cyan-200'
      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
  ].join(' ');
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Token Flow Radar
            </p>
            <h1 className="mt-1 text-xl font-black text-white">
              CEX Flow Intelligence
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/leaderboard" className={getLinkClass}>
              Leaderboard
            </NavLink>

            <NavLink to="/inspect" className={getLinkClass}>
              Inspect
            </NavLink>

            <NavLink to="/tokens" className={getLinkClass}>
              Tokens
            </NavLink>

            <NavLink to="/signals" className={getLinkClass}>
              Signals
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
