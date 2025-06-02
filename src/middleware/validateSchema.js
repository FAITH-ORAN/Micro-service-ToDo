const Ajv = require('ajv')

const ajv = new Ajv()

function validateSchema(schema) {
  const validate = ajv.compile(schema)

  return (req, res, next) => {
    const isValid = validate(req.body)
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid data',
        details: validate.errors,
      })
    }
    next()
  }
}

module.exports = validateSchema
