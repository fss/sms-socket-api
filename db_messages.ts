import { allTables, insert, query } from './db'
import { BadRequestError } from 'restify-errors'

export async function storeReceivedMessage (sender: string, body: string) {
  if (!sender) {
    throw new BadRequestError('no sender info')
  } else if (!body) {
    throw new BadRequestError('got SMS with no body')
  } else {
    return await insert(allTables[0], { sender, body })
  }
}

export async function storeQueuedMessage (recipient: string, body: string) {
  if (!body) {
    throw new BadRequestError('No body provided')
  } else if (!recipient) {
    throw new BadRequestError('No recipient provided')
  }
  return await insert(allTables[1], { body, recipient })
}

export async function storeSentMessage (recipient: string, body: string, queuedId: number) {
  if (!body) {
    throw new BadRequestError('No body provided')
  } else if (!recipient) {
    throw new BadRequestError('No recipient provided')
  }
  const sentId = await insert(allTables[2], { body, recipient })
  if (sentId > 0) {
    await query(`delete from ${allTables[1].name} where id=?`, [queuedId])
  }
  return sentId
}

export async function getMessages (table: string, limit: number, offset: number) {
  return await query(`select * from ${table} LIMIT ? OFFSET ?`, [limit, offset])
}
