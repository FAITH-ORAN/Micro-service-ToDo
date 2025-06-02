const { NodeSDK } = require('@opentelemetry/sdk-node')
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
const { resourceFromAttributes } = require('@opentelemetry/resources')
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')

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
    console.log('✅ OpenTelemetry initialized')
  } catch (err) {
    console.error('❌ Error initializing OpenTelemetry', err)
  }
}

module.exports = initTelemetry
