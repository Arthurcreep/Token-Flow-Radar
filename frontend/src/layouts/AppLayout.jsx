import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/tokens', label: 'Tokens', hint: 'Watchlist' },
  { to: '/signals', label: 'Signals', hint: 'Journal' }
];

function navClass({ isActive }) {
  return [
    'group flex items-center justify-between rounded-2xl border px-4 py-3 transition',
    isActive
      ? 'border-cyan-400/30 bg-cyan-400/10 text-white shadow-lg shadow-cyan-950/30'
      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:bg-slate-800/70 hover:text-white'
  ].join(' ');
}

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-800 bg-slate-950/70 px-5 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-lg font-black text-cyan-300">
              TFR
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Token Flow Radar</h1>
              <p className="text-xs text-slate-500">MVP analytics console</p>
            </div>
          </div>

          <nav className="mt-8 grid gap-3">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                <span className="font-semibold">{item.label}</span>
                <span className="text-xs text-slate-500 group-hover:text-slate-400">{item.hint}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Backend
            </p>
            <p className="mt-2 text-sm text-slate-300">http://localhost:4000</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              API expected online
            </div>
          </div>
        </aside>

        <main className="px-4 py-6 md:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
