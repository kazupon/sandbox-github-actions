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
  // console.log('github', github)
  const res = await github.graphql(
`
  {
    repository(owner: "kazupon", name: "vue-i18n") {
      ref(qualifiedName:"master") {  
        name
        target {
          ... on Commit {
            author {
              name
            }
            blame(path:"src/index.js") {
              ranges {
                commit {
                  author {
                    name
                  }
                }
                startingLine
                endingLine
              }
            }
          }
        }
      }
    }
  }
`, {}/*, {
  headers: {
    authorization: process.env.GITHUB_TOKEN
  }
}*/)
  console.log('res', JSON.stringify(res))
  return context
}