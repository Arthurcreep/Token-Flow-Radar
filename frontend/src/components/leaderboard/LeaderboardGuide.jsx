import Card from '../common/Card';

export default function LeaderboardGuide() {
  return (
    <Card
      title="Как читать эту таблицу"
      subtitle="Это список токенов с необычными потоками на биржевых кошельках. Это не торговый сигнал."
    >
      <div className="grid gap-4 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-emerald-300">Минусовой netflow</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Токены в сумме выходят с известных CEX-кошельков. Это может означать снижение доступного предложения на биржах.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-red-300">Плюсовой netflow</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Токены в сумме заходят на известные CEX-кошельки. Это может означать возможное давление продажи.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-cyan-300">Профиль</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Короткое объяснение от backend: поток чистый, спекулятивный, смешанный или слабый. Это не команда на сделку.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-cyan-300">Крупный netflow</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Та же логика, но только по переводам выше заданного USD-порога. Это помогает отделить шум от крупных движений.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-amber-300">До ATH</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Расстояние от текущей цены до прошлого исторического максимума. Это справка, а не прогноз прибыли.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-fuchsia-300">out / in</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Количество крупных выводов и заводов. Это число транзакций, а не количество токенов.
          </p>
        </div>
      </div>
    </Card>
  );
}
