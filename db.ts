import { Database as driver } from 'sqlite3'
import { type Database, open } from 'sqlite'
import { getDatabaseFilePath } from './files'
import { PreconditionFailedError } from 'restify-errors'

let db: Database | null = null

interface TableDefinition {
  name: string
  fields: string[]
}

const baseFields = [
  'id integer primary key autoincrement',
  'body text not null',
  'date datetime default current_timestamp'
]

export const allTables: TableDefinition[] = [
  {
    name: 'received',
    fields: baseFields.concat(['sender text not null'])
  },
  {
    name: 'queue',
    fields: baseFields.concat(['recipient text not null'])
  },
  {
    name: 'sent',
    fields: baseFields.concat(['recipient text not null'])
  }
]

export async function listTables () {
  return db ? await db.all('select name from sqlite_master where type=\'table\'') : []
}

export async function createTable (name: string, fields: string[]) {
  if (db) {
    const sql = `CREATE TABLE IF NOT EXISTS ${name} (${fields.join(', ')})`
    await db.run(sql)
  }
}

export async function initDatabase () {
  const filename = getDatabaseFilePath()
  db = await open({ filename, driver })
  console.log(`db connected using file ${filename}`)

  const existingTables = await listTables()
  const existingNames = new Set(existingTables.map(tbl => tbl.name))

  for (const tbl of allTables) {
    if (!existingNames.has(tbl.name)) {
      await createTable(tbl.name, tbl.fields)
      console.log(`created table "${tbl.name}"`)
    }
  }

  console.log('db ready')
}

export function esc (what: string) {
  return '`' + what + '`'
}

export async function insert (table: TableDefinition, doc: Record<any, any>): Promise<number> {
  if (!db) {
    return 0
  }

  const tableFields = table.fields.map(f => f.split(' ')[0])
  const docKeys = Object.keys(doc)

  const invalidField = docKeys.find(k => !tableFields.includes(k))
  if (invalidField) {
    throw new PreconditionFailedError(`No field "${invalidField}" in table "${table.name}" definition`)
  }

  const fieldPlaceholders = docKeys.map(() => '?').join(', ')
  const fieldNames = docKeys.map(esc).join(', ')
  const sql = `INSERT INTO ${esc(table.name)} (${fieldNames}) VALUES (${fieldPlaceholders})`

  const params: any[] = []

  docKeys.forEach(field => {
    params.push(doc[field])
  })

  console.log(`inserting into ${table.name}`, doc)

  const res = await db.run(sql, params)
  return res.lastID ?? 0
}

export async function query (query: string, params?: any) {
  if (!db) {
    throw new PreconditionFailedError('Database not connected')
  }
  return await db.all(query, params)
}
