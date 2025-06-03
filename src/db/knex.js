const knex = require('knex')
const config = require('../../knexfile.js')

const env = process.env.NODE_ENV || 'development'

console.log('🔍 Current NODE_ENV:', env)
console.log('📦 Loaded config:', config[env])

const db = knex(config[env])

module.exports = db
