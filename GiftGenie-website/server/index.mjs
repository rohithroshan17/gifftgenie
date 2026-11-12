import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'
import { giftCandidates, fallbackRecommendations } from './candidates.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const app = express()
const port = Number(process.env.PORT || 3000)
const model = 'gpt-6-luna'
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const FALLBACK_USD_TO_INR = 83.5
let exchangeRateCache = { rate: FALLBACK_USD_TO_INR, fetchedAt: 0, source: 'fallback' }

async function getUsdToInr() {
  if (Date.now() - exchangeRateCache.fetchedAt < 60 * 60 * 1000) return exchangeRateCache
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR')
    const payload = await response.json()
    const rate = Number(payload?.rates?.INR)
    if (!response.ok || !Number.isFinite(rate) || rate <= 0) throw new Error('Invalid exchange-rate response')
    exchangeRateCache = { rate, fetchedAt: Date.now(), source: 'frankfurter' }
  } catch (error) {
    console.error('[exchange-rate] fallback:', error.message)
    exchangeRateCache = { rate: FALLBACK_USD_TO_INR, fetchedAt: Date.now(), source: 'fallback' }
  }
  return exchangeRateCache
}

async function requestAIText(messages) {
  const apiUrl = process.env.MANUS_API_URL
  const apiKey = process.env.MANUS_API_KEY
  if (!apiUrl || !apiKey) return null
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, reasoning: { effort: 'low' }, max_completion_tokens: 900 }),
  })
  const payload = await response.json()
  if (!response.ok || payload.error) throw new Error(payload.error?.message || `AI request failed with ${response.status}`)
  return payload.choices?.[0]?.message?.content?.trim() || null
}

async function requestAIStructured(messages, schemaName, schema) {
  const apiUrl = process.env.MANUS_API_URL
  const apiKey = process.env.MANUS_API_KEY
  if (!apiUrl || !apiKey) return null
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, reasoning: { effort: 'low' }, max_completion_tokens: 1200, response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } } }),
  })
  const payload = await response.json()
  if (!response.ok || payload.error) throw new Error(payload.error?.message || `AI request failed with ${response.status}`)
  return JSON.parse(payload.choices?.[0]?.message?.content || '{}')
}

// Keep the webhook before the JSON parser: Stripe signatures require the exact raw bytes.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured on this environment.' })
  const signature = req.headers['stripe-signature']
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).json({ error: 'Stripe webhook verification is not configured.' })
  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    if (['checkout.session.completed', 'payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) {
      // Fulfillment is intentionally not granted from the redirect. The Supabase order worker owns this next step.
      console.log(`[stripe] verified ${event.type} ${event.id}`)
    }
    return res.json({ received: true })
  } catch (error) {
    console.error('[stripe] webhook signature failure:', error.message)
    return res.status(400).json({ error: 'Invalid Stripe signature.' })
  }
})

app.use('/api', express.json({ limit: '64kb' }))
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'kindred-api' }))
app.get('/api/exchange-rate', async (_req, res) => {
  const exchangeRate = await getUsdToInr()
  return res.json({ base: 'USD', quote: 'INR', rate: exchangeRate.rate, source: exchangeRate.source, fetchedAt: exchangeRate.fetchedAt })
})

app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe test checkout is not configured on this environment.' })
  const email = String(req.body?.email || '').trim()
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  if (!email.includes('@') || !items.length || items.length > 20) return res.status(400).json({ error: 'Add a valid email and at least one gift to continue.' })
  const lineItems = []
  const exchangeRate = await getUsdToInr()
  for (const item of items) {
    const product = giftCandidates.find((candidate) => candidate.id === item.productId)
    const quantity = Number(item.quantity)
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ error: 'One of the gifts in your bag is no longer available.' })
    lineItems.push({ price_data: { currency: 'inr', product_data: { name: product.name }, unit_amount: Math.round(product.price * exchangeRate.rate * 100) }, quantity })
  }
  try {
    const browserOrigin = req.headers.origin || req.body?.origin || `http://localhost:${port}`
    const origin = new URL(browserOrigin).origin
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: email,
      allow_promotion_codes: true,
      success_url: `${origin}/orders?checkout=return&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: { customer_email: email },
    })
    return res.json({ url: session.url })
  } catch (error) {
    console.error('[stripe] checkout creation failed:', error.message)
    return res.status(502).json({ error: 'Stripe could not open checkout. Please try again.' })
  }
})

app.post('/api/gift-finder', async (req, res) => {
  const answers = req.body?.answers || {}
  const excluded = Array.isArray(req.body?.excludedProductIds) ? req.body.excludedProductIds : []
  const exchangeRate = await getUsdToInr()
  const candidateCatalog = giftCandidates.filter((candidate) => !excluded.includes(candidate.id)).map((candidate) => ({ ...candidate, priceInr: Math.round(candidate.price * exchangeRate.rate), originalCurrency: 'USD', displayCurrency: 'INR' }))
  const fallback = fallbackRecommendations(answers, excluded, exchangeRate.rate)
  const apiUrl = process.env.MANUS_API_URL
  const apiKey = process.env.MANUS_API_KEY

  if (!apiUrl || !apiKey) {
    return res.json({ source: 'fallback', message: 'Curated fallback — AI credentials are not configured on this environment.', recommendations: fallback })
  }

  const prompt = `You are Kindred, a warm and discerning gift concierge for shoppers in India. Recommend only products from the candidate catalog below. Use the buyer answers to select up to four gifts. Treat priceInr as the shopper-facing price and never invent a product ID or claim an unavailable feature. Keep explanations personal, specific, and concise.\n\nBUYER ANSWERS:\n${JSON.stringify(answers, null, 2)}\n\nEXCHANGE RATE:\n1 USD = ${exchangeRate.rate} INR\n\nCANDIDATE CATALOG:\n${JSON.stringify(candidateCatalog, null, 2)}`

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Return JSON only. You are a thoughtful gifting assistant that must ground every recommendation in the supplied catalog.' },
          { role: 'user', content: prompt },
        ],
        reasoning: { effort: 'low' },
        max_completion_tokens: 1400,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'gift_recommendations',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                recommendations: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 4,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      productId: { type: 'string', enum: candidateCatalog.map((candidate) => candidate.id) },
                      whyItFits: { type: 'string' },
                      personalNote: { type: 'string' },
                      matchScore: { type: 'integer', minimum: 50, maximum: 99 },
                    },
                    required: ['productId', 'whyItFits', 'personalNote', 'matchScore'],
                  },
                },
              },
              required: ['recommendations'],
            },
          },
        },
      }),
    })

    const payload = await response.json()
    if (!response.ok || payload.error) throw new Error(payload.error?.message || `AI request failed with ${response.status}`)
    const content = payload.choices?.[0]?.message?.content
    const parsed = JSON.parse(content)
    const valid = parsed.recommendations.filter((item) => candidateCatalog.some((candidate) => candidate.id === item.productId)).slice(0, 4)
    if (!valid.length) throw new Error('AI returned no grounded recommendations')
    return res.json({ source: 'ai', message: 'Personalised by Kindred AI.', recommendations: valid })
  } catch (error) {
    console.error('[gift-finder] AI fallback:', error.message)
    return res.json({ source: 'fallback', message: 'Curated fallback — the AI concierge is taking a quiet moment.', recommendations: fallback })
  }
})

app.post('/api/gift-chat', async (req, res) => {
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : []
  const messages = rawMessages.filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string').slice(-12).map((message) => ({ role: message.role, content: message.content.slice(0, 1600) }))
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || ''
  const exchangeRate = await getUsdToInr()
  const candidateCatalog = giftCandidates.map((candidate) => ({ ...candidate, priceInr: Math.round(candidate.price * exchangeRate.rate), originalCurrency: 'USD', displayCurrency: 'INR' }))
  const fallback = fallbackRecommendations({ interests: lastUserMessage, preferences: lastUserMessage, budget: lastUserMessage }, [], exchangeRate.rate)
  const schema = {
    type: 'object', additionalProperties: false,
    properties: {
      reply: { type: 'string' },
      recommendations: { type: 'array', maxItems: 4, items: { type: 'object', additionalProperties: false, properties: { productId: { type: 'string', enum: candidateCatalog.map((candidate) => candidate.id) }, whyItFits: { type: 'string' }, personalNote: { type: 'string' }, matchScore: { type: 'integer', minimum: 50, maximum: 99 } }, required: ['productId', 'whyItFits', 'personalNote', 'matchScore'] } },
    }, required: ['reply', 'recommendations'],
  }
  try {
    const result = await requestAIStructured([
      { role: 'system', content: `You are Kindred's conversational gift assistant for India. Ask a short follow-up when useful, understand natural language and Indian gifting occasions, and recommend only products from the supplied catalog. Use INR prices and never invent IDs. If the user is refining a previous result, explain what changed. Candidate catalog: ${JSON.stringify(candidateCatalog)}` },
      ...messages,
    ], 'gift_chat', schema)
    if (result?.reply) return res.json({ source: 'ai', reply: result.reply, recommendations: result.recommendations?.length ? result.recommendations : fallback })
  } catch (error) {
    console.error('[gift-chat] fallback:', error.message)
  }
  return res.json({ source: 'fallback', reply: process.env.MANUS_API_KEY ? 'I can still offer a small curated edit while the concierge reconnects. Tell me one more detail about them.' : 'The conversational AI assistant is not configured on this environment yet. You can still use the guided finder below, or add the server AI credentials to enable chat.', recommendations: fallback })
})

app.post('/api/support-chat', async (req, res) => {
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : []
  const messages = rawMessages.filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string').slice(-10).map((message) => ({ role: message.role, content: message.content.slice(0, 1600) }))
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content?.toLowerCase() || ''
  const fallback = lastUserMessage.includes('ship') ? 'Kindred orders are designed to ship with care. Delivery timing and live tracking will appear in your order history after a verified payment webhook. For a specific order, please sign in.' : lastUserMessage.includes('return') ? 'Unused gifts can be reviewed for return support within 7 days of delivery. Please contact hello@kindred.gifts with your order number so a human can help.' : lastUserMessage.includes('order') ? 'I can help with order questions once you are signed in and the order has been confirmed by Stripe. I will not treat a payment redirect as proof of payment.' : 'I can help with gifts, shipping, returns, and finding your way around Kindred. If I cannot answer, I will point you to a human at hello@kindred.gifts.'
  try {
    const reply = await requestAIText([
      { role: 'system', content: 'You are Kindred Support, a concise and warm customer-support assistant for an Indian gifting marketplace. Answer product, shipping, returns, navigation, and FAQ questions from these policies: prices display in INR; orders use Stripe test checkout; payment is confirmed only by a signed webhook; delivery and order history require verified order records; unresolved issues should escalate to hello@kindred.gifts. Never invent live order details and ask the user to sign in for authenticated order questions.' },
      ...messages,
    ])
    if (reply) return res.json({ source: 'ai', reply })
  } catch (error) {
    console.error('[support-chat] fallback:', error.message)
  }
  return res.json({ source: 'fallback', reply: fallback })
})

if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite')
  // The managed Preview proxy does not upgrade websocket connections for this
  // Express middleware listener. Disable HMR so Vite does not inject a client
  // that immediately reports a failed websocket connection in the browser.
  app.get('/@vite/client', (_req, res) => res.type('application/javascript').send(`
    const styleNodes = new Map()
    export function createHotContext() {
      return { accept() {}, dispose() {}, prune() {}, invalidate() {}, on() {}, send() {} }
    }
    export function updateStyle(id, content) {
      if (typeof document === 'undefined') return
      let node = styleNodes.get(id)
      if (!node) { node = document.createElement('style'); node.setAttribute('data-vite-dev-id', id); document.head.appendChild(node); styleNodes.set(id, node) }
      node.textContent = content
    }
    export function removeStyle(id) { const node = styleNodes.get(id); if (node) { node.remove(); styleNodes.delete(id) } }
    export function injectQuery(url) { return url }
  `))
  app.get('/@react-refresh', (_req, res) => res.type('application/javascript').send('/* Kindred Preview: React refresh disabled */'))
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'spa' })
  app.use(vite.middlewares)
} else {
  app.use(express.static(path.join(rootDir, 'dist')))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(rootDir, 'dist', 'index.html'))
  })
}

app.listen(port, '0.0.0.0', () => console.log(`Kindred server listening on ${port}`))
