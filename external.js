module.exports = ({ github, context, core, io }, data) => {
  const j = require('./package.json')
  console.log('j', j)
  console.log('data type', typeof data)
  console.log('data', data)
  return context.payload
}