import promClient from 'prom-client';

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

const alertsProcessed = new promClient.Counter({
  name: 'alerts_processed_total',
  help: 'Total number of alerts processed',
  labelNames: ['type', 'severity']
});
register.registerMetric(alertsProcessed);

const activeConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});
register.registerMetric(activeConnections);

const notificationsSent = new promClient.Counter({
  name: 'notifications_sent_total',
  help: 'Total notifications sent',
  labelNames: ['channel', 'status']
});
register.registerMetric(notificationsSent);

export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode
      },
      duration
    );
  });
  
  next();
}

export function metricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType);
  register.metrics().then(data => res.send(data));
}

export {
  alertsProcessed,
  activeConnections,
  notificationsSent
};
