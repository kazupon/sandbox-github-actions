module.exports = async ({ github, context, core, io }) => {
  const data = require('./i18n-lint-report.json');
  const blob = (context && context.sha) || 'master';
  const branch = 'master'

  const reports = createReports(blob, data);
  for (const r of reports) {
    console.log(`register issue for ${r.package}, ${[...r.body].length}, ${r.body.length} ...`);
    // const issueRes = await github.issues.create({
    //   owner: context.repo.owner,
    //   repo: context.repo.repo,
    //   title: r.title,
    //   body: r.body
    // })
    // console.log('issue', issueRes)
    for (const d of r.details) {
      console.log('detail', d)
      getBlame(github, context.repo.owner, context.repo.repo, branch, d.file)
      // await github.issues.createComment({
      //   owner: context.repo.owner,
      //   repo: context.repo.repo,
      //   issue_number: issueRes.data.number,
      //   body: d
      // })
    }
  }
  // console.log('github', github)
  /*
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
`, {}, {
  headers: {
    authorization: process.env.GITHUB_TOKEN
  }
})
  console.log('res', JSON.stringify(res))
  */
  return context
}

async function getBlame(github, repo, owner, branch, path) {
  console.log('getblame', repo, owner, branch, path)
  const res = await github.graphql(
    `
      {
        repository(owner: "${owner}", name: "${repo}") {
          ref(qualifiedName:"${branch}") {  
            name
            target {
              ... on Commit {
                author {
                  name
                }
                blame(path:"${path}") {
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
    `
  )
  console.log('res', JSON.stringify(res))
}

function createReports(blob, data) {
  // aggregate reporting
  const packages = data.map(group => {
    // stat
    const stat = group.reduce(
      (stat, item) => {
        stat.package = item.package;
        stat.warning += item.warningCount;
        stat.file++;
        return stat;
      },
      { warning: 0, file: 0 },
    );

    const pkg = { stat, targets: [] };

    return group.reduce((pkg, item) => {
      const target = { file: item.filePath.split('packages/').pop() };
      target.messages = item.messages
      pkg.targets.push(target);
      return pkg;
    }, pkg);
  });

  const reports = packages.map(pkg => {
    const title = `[${pkg.stat.package}] 👮 ‍️i18n`;
    const details = pkg.targets
    const body = `
- ファイル数: ${pkg.stat.file}
- 件数: ${pkg.stat.warning}

## i18n 未対応箇所のコマンドでの確認方法

以下のコマンドをターミナルにコピー & ペーストでして確認してください。
(レポート形式は、ESLintのフォーマットになります。)
      
@kazupon
\`\`\`sh
npx eslint --config ./.eslintrc-i18n.js --ext .vue,.js --no-eslintrc --ignore-path ./.eslintignore-i18n ./packages/${
  pkg.stat.package
    }
\`\`\`

ESLint で検出した未対応箇所は、以下コメントのコメントに投稿された内容を確認してください。
`;
    return { package: pkg.stat.package, title, body, details };
  });

  return reports;
}
