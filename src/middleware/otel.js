const { NodeSDK } = require('@opentelemetry/sdk-node')
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
const { resourceFromAttributes } = require('@opentelemetry/resources')
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')
const logger = require('../logger');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4318/v1/traces',
  }),
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'todo-api',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

async function initTelemetry() {
  try {
    await sdk.start()
    logger.info({
      msg: '✅ OpenTelemetry initialized',
      service: 'todo-api',
    });
  } catch (err) {
    logger.error({
      msg: '❌ Error initializing OpenTelemetry',
      error: err.message,
    });
  }
}

module.exports = initTelemetry
