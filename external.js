module.exports = async ({ github, context, core, io }) => {
  const data = require('./i18n-lint-report.json');
  const blob = (context && context.sha) || 'master';

  const reports = createReports(blob, data);
  for (const r of reports) {
    console.log(`register issue for ${r.package}, ${[...r.body].length}, ${r.body.length} ...`);
    await github.issues.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: r.title,
      body: r.body
    })
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
      console.log('target', target, item.filePath.split('packages/'))
      target.messages = item.messages.map(msg => {
        return `
### \`${msg.message}\`
https://github.com/kazupon/sandbox-github-actions/blob/${blob}/packages/${target.file}#L${msg.line}-L${msg.endLine}
`;
      });
      pkg.targets.push(target);
      return pkg;
    }, pkg);
  });

  const reports = packages.map(pkg => {
    const title = `[${pkg.stat.package}] 👮 ‍️i18n`;
    const detail = pkg.targets
      .map(t => {
        return `### ${t.file}\n<details>\n${t.messages.map(m => m).join('\n')}</details>\n`;
      })
      .join('\n\n');
    const body = `
- ファイル数: ${pkg.stat.file}
- 件数: ${pkg.stat.warning}

## i18n 未対応箇所のコマンドでの確認方法

以下のコマンドをターミナルにコピー & ペーストでして確認してください。
(レポート形式は、ESLintのフォーマットになります。)

\`\`\`sh
npx eslint --config ./.eslintrc-i18n.js --ext .vue,.js --no-eslintrc --ignore-path ./.eslintignore-i18n ./packages/${
  pkg.stat.package
    }
\`\`\`

## 詳細

各ファイル、件数の詳細はこちらです。

${
  detail.length <= 60000
    ? (detail + String(detail) + String(detail))
    : '**ファイル数、件数が多すぎて、Issue の本文文字数制限のため、ここで表示できません。上記のコマンドで確認してください！**'
}
`;
    return { pkg: pkg.stat.package, title, body };
  });

  return reports;
}
