import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from 'knex'
import crypto from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

// Cookies - Formas de manter contexto entre requisições

export async function transactionsRoutes(app: FastifyInstance) {
  // app.addHook('preHandler', async (request, reply) => {
  //   console.log('Middleware', request.method, request.url)
  // })

  const knexInstance = knex({
    client: 'sqlite3',
    connection: {
      filename: './db/app.db', // Substitua pelo caminho do seu banco de dados SQLite
    },
    useNullAsDefault: true,
  })

  app.get('/', {
    preHandler: [checkSessionIdExists],
  }, async (request) => {
    const { sessionId } = request.cookies

    const transactions = await knexInstance('transactions')
      .where('session_id', sessionId)
      .select()

    return {
      transactions,
    }
  })

  app.get('/:id', {
    preHandler: [checkSessionIdExists],
  }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { sessionId } = request.cookies

    const { id } = getTransactionParamsSchema.parse(request.params)

    const transactions = await knexInstance('transactions')
      .where({
        session_id: sessionId,
        id,
      })
      .first()

    return {
      transactions,
    }
  })

  app.get('/summary', {
    preHandler: [checkSessionIdExists],
  }, async (request) => {

    const { sessionId } = request.cookies

    const summary = await knexInstance('transactions')
      .where('session_id', sessionId)
      .sum('amount', { as: 'amount' })
      .first()

    return {
      summary,
    }
  })

  app.post('/', async (request, reply) => {
    // title, amount, type: credit or debit

    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { amount, title, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()

      reply.cookie('sessionId', sessionId, {
        httpOnly: true,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knexInstance('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
