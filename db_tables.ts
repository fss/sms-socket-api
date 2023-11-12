export declare interface TableDefinition {
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
