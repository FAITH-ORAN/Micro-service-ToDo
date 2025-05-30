module.exports = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    completed: { type: 'boolean' },
  },
  required: ['title'],
  additionalProperties: false,
}
