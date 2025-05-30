module.exports = {
    type: 'object',
    properties: {
      title: { type: 'string' , minLength: 1},
      completed: { type: 'boolean' }
    },
    additionalProperties: false,
    minProperties: 1 
  }
  