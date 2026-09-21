import client from 'prom-client';

// Collect default Node.js and system metrics
client.collectDefaultMetrics({ prefix: 'pulsesync_' });

// Custom application metrics
export const httpRequestCounter = new client.Counter({
  name: 'pulsesync_http_requests_total',
  help: 'Total number of HTTP requests made to the API',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationHistogram = new client.Histogram({
  name: 'pulsesync_http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const activeWebsocketConnectionsGauge = new client.Gauge({
  name: 'pulsesync_websocket_active_connections',
  help: 'Number of currently active WebSocket connections',
});

export const incidentsCreatedCounter = new client.Counter({
  name: 'pulsesync_incidents_created_total',
  help: 'Total number of incident reports created',
  labelNames: ['severity', 'service_name'],
});

export const register = client.register;
