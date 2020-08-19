module.exports = async ({ github, context, core, io }, options = { enableBlame: false }) => {
  const data = require('./i18n-lint-report.json')
  const blob = (context && context.sha) || 'master'
  const branch = 'master'
  const { enableBlame } = options

  const reports = createReports(blob, data);
  for (const r of reports) {
    console.log(`register issue for ${r.package}, ${[...r.body].length}, ${r.body.length} ...`);
    const issueRes = await github.issues.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: r.title,
      body: r.body
    })
    // console.log('issue', issueRes)
    for (const d of r.details) {
      try {
        const filePath = d.file
        const blameRes = await getBlame(github, context.repo.repo, context.repo.owner, branch, `packages/${filePath}`)
        // console.log('brameRes', JSON.stringify(blameRes))
        for (const message of d.messages) {
          const comment = createComment({
            ranges: blameRes.repository.ref.target.blame.ranges,
            filePath,
            message,
            blob,
            enableBlame
          })
          // console.log('comment', comment)
          await github.issues.createComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issueRes.data.number,
            body: comment
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
  return context
}

function createComment({ ranges, filePath, message, blob, enableBlame }) {
  const user = enableBlame
    ? getUser(ranges, message) || ''
    : ''
  return `# ${filePath}
## \`${message.message}\`

${user ? `最終コード編集者: @${user}` : ''}

https://github.com/kazupon/sandbox-github-actions/blob/${blob}/packages/${filePath}#L${message.line}-L${message.endLine}
`
}

function getUser(ranges, message) {
  // console.log('getUser: ranges', ranges)
  // console.log('getUser: message', message)
  let user = null
  for (const range of ranges) {
    if (message.line >= range.startingLine || message.line <= range.endingLine) {
      user = range.commit.author.user.login
      break
    }
  }
  return user
}

function getBlame(github, repo, owner, branch, path) {
  return github.graphql(
    `
      {
        repository(owner: "${owner}", name: "${repo}") {
          ref(qualifiedName:"${branch}") {  
            name
            target {
              ... on Commit {
                author {
                  user {
                    login
                  }
                }
                blame(path:"${path}") {
                  ranges {
                    commit {
                      author {
                        user {
                          login
                        }
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
