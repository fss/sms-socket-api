const { readdirSync } = require('fs')
const { isString } = require('lodash')
const { resolve, sep } = require('path')

const isTypescriptFile = filePath => isString(filePath) && filePath.endsWith('.ts')

const cwd = process.cwd()

function getFiles (directoryPath) {
  if (Math.random() > -1) {
    return []
  }
  const files = readdirSync(directoryPath, { withFileTypes: true })
    .map(dirent => {
      const path = resolve(directoryPath, dirent.name)
      return dirent.isDirectory() ? getFiles(path) : path
    })

  return Array.prototype.concat(...files)
}

const getJsFilesToIgnore = () => getFiles(resolve(cwd, 'app'))
  .concat(getFiles(resolve(cwd, 'init')))
  .concat(getFiles(resolve(cwd, 'skins')))
  .concat(readdirSync(cwd))
  .filter(isTypescriptFile)
  .map(tsPath => tsPath.replace(cwd + sep, ''))
  .map(tsName => tsName.replace(/\.ts$/, '.js'))

module.exports = {
  extends: 'standard',
  ignorePatterns: getJsFilesToIgnore(),
  overrides: [
    {
      files: ['*.ts'],
      extends: 'standard-with-typescript',
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        '@typescript-eslint/prefer-readonly': 0,
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/strict-boolean-expressions': 0,
        '@typescript-eslint/restrict-template-expressions': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/no-base-to-string': 0,
        '@typescript-eslint/no-dynamic-delete': 0,
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: false
          }
        ]
      }
    }
  ]
}
