const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');

const logger = require('./utils/logger');
const tokenRoutes = require('./modules/tokens/token.routes');
const healthRoutes = require('./modules/health/health.routes');
const labelRoutes = require('./modules/labels/label.routes');
const transferRoutes = require('./modules/transfers/transfer.routes');
const cexFlowRoutes = require('./modules/cex-flows/cexFlow.routes');
const jobRoutes = require('./modules/jobs/job.routes');
const holderRoutes = require('./modules/holders/holder.routes');
const metricRoutes = require('./modules/metrics/metric.routes');
const signalRoutes = require('./modules/signals/signal.routes');
const marketLeaderboardRoutes = require('./modules/markets/marketLeaderboard.routes');
const tokenImportRoutes = require('./modules/token-import/tokenImport.routes');
const priceContextRoutes = require('./modules/price-context/priceContext.routes');
const flowDiagnosticsRoutes = require('./modules/flow-diagnostics/flowDiagnostics.routes');
const flowProfileRoutes = require('./modules/flow-profile/flowProfile.routes');

const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(
  pinoHttp({
    logger
  })
);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.use('/api', holderRoutes);
app.use('/api', metricRoutes);
app.use('/api', signalRoutes);
app.use('/api', cexFlowRoutes);
app.use('/api', flowDiagnosticsRoutes);
app.use('/api', flowProfileRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/tokens', cexFlowRoutes);
app.use('/api/tokens', tokenImportRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/markets', marketLeaderboardRoutes);
app.use('/api/price-context', priceContextRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;