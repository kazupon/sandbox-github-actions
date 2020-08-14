module.exports = ({ github, context, core, io }, data) => {
  const j = require('./package.json')
  console.log('j', j)
  console.log('data type', typeof data)
  console.log('data', data)
  github.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: 'test test',
    body: 'this is test'
  })
  return context.payload
}