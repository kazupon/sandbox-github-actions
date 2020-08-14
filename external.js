module.exports = async ({ github, context, core, io }, data) => {
  // const j = require('./package.json')
  // console.log('j', j)
  // console.log('data type', typeof data)
  // console.log('data', data)
  // github.issues.create({
  //   owner: context.repo.owner,
  //   repo: context.repo.repo,
  //   title: 'test test',
  //   body: 'this is test'
  // })
  console.log('github', github)
  const { repo } = await github.graphql(
`
  {
    repository(owner: "kazupon", name: "sandbox-github-actions") {
      issues(last: 3) {
        edges {
          node {
            title
          }
        }
      }
    }
  }
`, {})
  console.log('repo', repo)
  return context
}