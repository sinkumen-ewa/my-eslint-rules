const path = require('path')
const fs = require('fs/promises')
const { ESLint } = require('eslint')
const eslintConfig = require('./.eslintrc')

const errorLog = (data) => {
  console.log('\x1b[31m', data)
}

const successLog = (data) => {
  console.log('\x1b[32m', data)
}

const infoLog = (data) => {
  console.log('\x1b[34m', data)
}

(async function lintFiles() {
  infoLog('Linting files...')

  const cwd = process.cwd()
  const files = await fs.readdir(cwd)
  const errors = []

  const filesToLint = files.filter((file) => {
    const extension = path.extname(file)

    return ['.js'].includes(extension)
  })

  // https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions
  const eslint = new ESLint({
    cwd,
    errorOnUnmatchedPattern: true,
    extensions: ['.js'],
    allowInlineConfig: true,
    baseConfig: eslintConfig,
    rulePaths: [path.join(cwd, 'lint_rules')],
    useEslintrc: true,
    fix: true,
  })

  for (const file of filesToLint) {
    infoLog(`Checking ${file}`)

    const filePath = path.join(cwd, file)
    try {
      const lintResult = await eslint.lintFiles([filePath])
      await ESLint.outputFixes(lintResult)

      if (lintResult.length) {
        lintResult.forEach((r) => {
          r.messages.forEach((m) => {
            if (m.severity === 2) {
              errors.push(
                `${`(${m.ruleId || ''})`} ${m.message} ${r.filePath}:${m.line}:${m.column}`,
              )
            }
          })
        })
      }
    } catch (e) {
      errors.push(e.message)
    }
  }

  if (errors.length) {
    const error = 'Linting Failed.'
    console.log('\x1b[31m', '\x1b[4m', error)
    console.log('%s\x1b[0m', '\t')
    for (const err of errors) {
      errorLog(err)
      console.log()
    }
  } else {
    successLog('No linting issue found.')
  }
}()).catch((e) => {
  errorLog(e.message)
  process.exit(1)
})
