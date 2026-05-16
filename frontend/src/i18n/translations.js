export const translations = {
  ru: {
    common: {
      tokens: 'Токены', signals: 'Сигналы', watchlist: 'Список', journal: 'Журнал',
      backend: 'Бэкенд', apiExpectedOnline: 'API должен быть онлайн',
      loading: 'Загружаем данные...', failedToLoadTokens: 'Не удалось загрузить токены',
      failedToLoadTokenDetail: 'Не удалось загрузить страницу токена',
      failedToLoadSignals: 'Не удалось загрузить сигналы',
      backToTokens: 'Назад к токенам', refreshData: 'Обновить данные',
      refreshDisabled: 'Обновление mixed/real pipeline пока заблокировано',
      refreshing: 'Обновляем...', pipelineRunning: 'Запускаем backend analytics pipeline...',
      pipelineRefreshed: 'Pipeline успешно обновлен.', pipelineFailed: 'Не удалось обновить token pipeline.',
      score: 'Скор', finalScore: 'Итоговый скор', confidence: 'Уверенность',
      freshness: 'Готовность', date: 'Дата', dataMode: 'Режим данных',
      scoreVersion: 'Версия скора', noData: 'Нет данных',
      noSignals: 'Сигналов пока нет', noCexFlows: 'Нет CEX flows',
      noHolders: 'Нет holders', openTokenDashboard: 'Открыть dashboard токена',
      unknown: 'Неизвестно'
    },
    nav: { title: 'Token Flow Radar', subtitle: 'MVP аналитическая консоль' },
    tokens: {
      eyebrow: 'Ethereum mainnet MVP', title: 'Token radar watchlist',
      subtitle: 'Карточки показывают regime, score и готовность данных. Красная плашка означает demo seed data, а не реальный рыночный сигнал.',
      totalTokens: 'Токены', readyTokens: 'Готово'
    },
    token: {
      cexNetflow7d: 'CEX Netflow 7d', cexInflow7d: 'CEX Inflow 7d',
      cexOutflow7d: 'CEX Outflow 7d', nonCexHolderChange: 'Изменение non-CEX holders',
      cexNetflowHint: 'USD valuation пока не подключен',
      cexInflowHint: 'Токены заходят на биржи', cexOutflowHint: 'Токены выходят с бирж',
      holderChangeHint: 'Top holders без CEX', cexFlowStructure: 'Структура CEX flows',
      cexFlowSubtitle: 'Дневной netflow. Отрицательные значения означают, что supply выходит с известных CEX-кошельков.',
      scoreDecomposition: 'Разложение скора', scoreSubtitle: 'MVP v1 score намеренно простой.',
      cexFlowScore: 'CEX Flow Score', holderScore: 'Holder Score',
      topHolders: 'Top holders', topHoldersSubtitle: 'Известные CEX-кошельки отделены от non-CEX holders.',
      rank: 'Ранг', address: 'Адрес', label: 'Метка', type: 'Тип', balance: 'Баланс', change7d: 'Изм. 7d',
      cex: 'CEX', nonCex: 'Non-CEX', noCexFlowsDescription: 'Сначала запусти calculate-cex-flows job.',
      noHoldersDescription: 'Сначала запусти fake holder seed.',
      actorsTitle: 'Funds vs Users CEX Flow',
      actorsSubtitle: 'Будущее разделение потоков: фонды, whales, юзеры, маркетмейкеры и unknown wallets.',
      actorsBody: 'Это честный placeholder. Пока нет классификации владельцев адресов, рисовать funds/users flow нельзя.',
      actorsRequirement: 'Нужная модель: address_owner_type = user | whale | fund | market_maker | treasury | unknown'
    },
    signals: {
      eyebrow: 'Signal Journal', title: 'События режимов',
      subtitle: 'Журнал хранит события из token metrics. Data mode обязателен: fake и mixed сигналы нельзя путать с реальным рынком.',
      latestSignals: 'Последние сигналы', noSignalsDescription: 'Запусти generate-signals job для UNI.'
    },
    dataMode: {
      realTitle: 'Реальные данные', fakeTitle: 'Fake Data / Demo Mode',
      mixedTitle: 'Смешанные данные', notCalculatedTitle: 'Метрики не рассчитаны', unknownTitle: 'Неизвестные данные'
    },
    regimes: {
      ACCUMULATION: 'НАКОПЛЕНИЕ',
      DISTRIBUTION: 'РАСПРЕДЕЛЕНИЕ',
      CEX_SUPPLY_DRAIN: 'ОТТОК С CEX',
      CEX_SELL_PRESSURE: 'ДАВЛЕНИЕ ПРОДАЖ НА CEX',
      MIXED_DATA_REVIEW_REQUIRED: 'ТРЕБУЕТСЯ ПРОВЕРКА СМЕШАННЫХ ДАННЫХ',
      UNCLEAR_LOW_CONFIDENCE: 'НЕЯСНО / НИЗКАЯ УВЕРЕННОСТЬ',
      NEUTRAL: 'НЕЙТРАЛЬНО',
      UNCLEAR: 'НЕЯСНО'
    },
    dynamic: {
      mixedReview:
        'CEX flows и holder snapshots пришли из разных режимов данных. Это полезно для инженерной проверки, но это не реальный рыночный сигнал.',
      fakeWarning:
        'Это demo seed data. Не воспринимай это как реальный рыночный сигнал.',
      mixedWarning:
        'Предупреждение: смешаны реальные и fake-данные. Не воспринимай это как настоящий accumulation/distribution сигнал.',
      accumulation:
        'CEX netflow отрицательный, а non-CEX top holders увеличивают балансы. Это похоже на давление накопления.',
      distribution:
        'CEX netflow положительный, а non-CEX top holders сокращают балансы. Это похоже на давление распределения.',
      cexSupplyDrain:
        'CEX netflow отрицательный: больше токенов выходит с бирж, чем заходит на биржи.',
      cexSellPressure:
        'CEX netflow положительный: больше токенов заходит на биржи, чем выходит с бирж.',
      lowConfidence:
        'Данных недостаточно, чтобы уверенно классифицировать режим токена.',
      noStrongRegime:
        'Сильный режим не обнаружен.'
    }
  },
  en: {
    common: {
      tokens: 'Tokens', signals: 'Signals', watchlist: 'Watchlist', journal: 'Journal',
      backend: 'Backend', apiExpectedOnline: 'API expected online',
      loading: 'Loading data...', failedToLoadTokens: 'Failed to load tokens',
      failedToLoadTokenDetail: 'Failed to load token detail',
      failedToLoadSignals: 'Failed to load signals',
      backToTokens: 'Back to tokens', refreshData: 'Refresh Data',
      refreshDisabled: 'Mixed/real pipeline refresh is temporarily disabled',
      refreshing: 'Refreshing...', pipelineRunning: 'Running backend analytics pipeline...',
      pipelineRefreshed: 'Pipeline refreshed successfully.', pipelineFailed: 'Failed to refresh token pipeline.',
      score: 'Score', finalScore: 'Final Score', confidence: 'Confidence',
      freshness: 'Freshness', date: 'Date', dataMode: 'Data mode',
      scoreVersion: 'Score version', noData: 'No data',
      noSignals: 'No signals yet', noCexFlows: 'No CEX flows',
      noHolders: 'No holder data', openTokenDashboard: 'Open token dashboard',
      unknown: 'Unknown'
    },
    nav: { title: 'Token Flow Radar', subtitle: 'MVP analytics console' },
    tokens: {
      eyebrow: 'Ethereum mainnet MVP', title: 'Token radar watchlist',
      subtitle: 'Cards show token regime, score and data readiness. Red badge means demo seed data, not a real market signal.',
      totalTokens: 'Tokens', readyTokens: 'Ready'
    },
    token: {
      cexNetflow7d: 'CEX Netflow 7d', cexInflow7d: 'CEX Inflow 7d',
      cexOutflow7d: 'CEX Outflow 7d', nonCexHolderChange: 'Non-CEX Holder Change',
      cexNetflowHint: 'USD valuation is pending',
      cexInflowHint: 'Tokens entering exchanges', cexOutflowHint: 'Tokens leaving exchanges',
      holderChangeHint: 'Top holders excluding CEX', cexFlowStructure: 'CEX flow structure',
      cexFlowSubtitle: 'Daily netflow breakdown. Negative values mean supply is leaving known CEX wallets.',
      scoreDecomposition: 'Score decomposition', scoreSubtitle: 'MVP v1 score is intentionally simple.',
      cexFlowScore: 'CEX Flow Score', holderScore: 'Holder Score',
      topHolders: 'Top holders', topHoldersSubtitle: 'Known CEX wallets are separated from non-CEX holders.',
      rank: 'Rank', address: 'Address', label: 'Label', type: 'Type', balance: 'Balance', change7d: '7d Change',
      cex: 'CEX', nonCex: 'Non-CEX', noCexFlowsDescription: 'Run calculate-cex-flows job first.',
      noHoldersDescription: 'Run fake holder seed first.',
      actorsTitle: 'Funds vs Users CEX Flow',
      actorsSubtitle: 'Planned actor split: funds, whales, users, market makers and unknown wallets.',
      actorsBody: 'This is an honest placeholder. We need address owner classification before drawing fund/user flows.',
      actorsRequirement: 'Required model: address_owner_type = user | whale | fund | market_maker | treasury | unknown'
    },
    signals: {
      eyebrow: 'Signal Journal', title: 'Detected regime events',
      subtitle: 'The journal stores events from token metrics. Data mode is mandatory: fake and mixed signals must not be confused with real market signals.',
      latestSignals: 'Latest signals', noSignalsDescription: 'Run generate-signals job for UNI.'
    },
    dataMode: {
      realTitle: 'Real Data', fakeTitle: 'Fake Data / Demo Mode',
      mixedTitle: 'Mixed Data', notCalculatedTitle: 'No Metrics', unknownTitle: 'Unknown Data'
    },
    regimes: {
      ACCUMULATION: 'ACCUMULATION',
      DISTRIBUTION: 'DISTRIBUTION',
      CEX_SUPPLY_DRAIN: 'CEX SUPPLY DRAIN',
      CEX_SELL_PRESSURE: 'CEX SELL PRESSURE',
      MIXED_DATA_REVIEW_REQUIRED: 'MIXED DATA REVIEW REQUIRED',
      UNCLEAR_LOW_CONFIDENCE: 'UNCLEAR / LOW CONFIDENCE',
      NEUTRAL: 'NEUTRAL',
      UNCLEAR: 'UNCLEAR'
    },
    dynamic: {
      mixedReview:
        'CEX flows and holder snapshots come from different data modes. This is useful for engineering validation, but it is not a real market signal.',
      fakeWarning:
        'This is demo seed data. Do not treat this as a real market signal.',
      mixedWarning:
        'Mixed data warning: real and fake sources are combined. Do not treat this as a real accumulation/distribution signal.',
      accumulation:
        'CEX netflow is negative while non-CEX top holders are increasing balances. This suggests accumulation pressure.',
      distribution:
        'CEX netflow is positive while non-CEX top holders are reducing balances. This suggests distribution pressure.',
      cexSupplyDrain:
        'CEX netflow is negative, meaning more tokens are leaving exchanges than entering them.',
      cexSellPressure:
        'CEX netflow is positive, meaning more tokens are entering exchanges than leaving them.',
      lowConfidence:
        'Data is not strong enough to classify the token regime with confidence.',
      noStrongRegime:
        'No strong regime detected.'
    }
  }
};
