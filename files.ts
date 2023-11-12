import { resolve } from 'path'
import { existsSync, mkdirSync } from 'fs'

export function getDataDir () {
  const dirPath = resolve('data')
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath)
  }
  return dirPath
}

export function getDatabaseFilePath () {
  return resolve(getDataDir(), 'sms.db')
}
