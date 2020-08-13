module.exports = ({ github, context, core, io }, data) => {
  console.log('data type', typeof data)
  console.log('data', data)
  return context.payload
}