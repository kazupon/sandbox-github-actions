module.exports = {
  mergeStrategy: { toSameBranch: ["master"] },
  publishCommand: ({ isYarn, tag, defaultCommand, dir }) => {
    return `echo 'publish!'`
  }
}
