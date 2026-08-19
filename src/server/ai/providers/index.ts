import { ChatAnthropic } from '@langchain/anthropic'
import { AIMessage, AIMessageChunk, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOpenAI } from '@langchain/openai'

import { vault } from '@/lib/vault'

import type { CallModelOptions, CallModelResult, Provider } from './types'

export type { CallModelOptions, CallModelResult, ChatMessage, NormalizedUsage, Provider, Role } from './types'

function detectProvider(model: string): Provider {
  const m = model.trim().toLowerCase()
  if (/^(gpt|o\d)/.test(m)) return 'openai'
  if (/^claude/.test(m)) return 'anthropic'
  if (/^gemini/.test(m)) return 'google'
  throw new Error(`Unknown provider for model: "${model}"`)
}

async function createModel(provider: Provider, opts: CallModelOptions) {
  switch (provider) {
    case 'openai': {
      const apiKey = await vault.get('OPENAI_API_KEY')
      if (!apiKey) throw new Error('OpenAI API key not configured')
      return new ChatOpenAI({ model: opts.model, apiKey, temperature: opts.temperature, maxTokens: opts.maxTokens })
    }
    case 'anthropic': {
      const apiKey = await vault.get('ANTHROPIC_API_KEY')
      if (!apiKey) throw new Error('Anthropic API key not configured')
      return new ChatAnthropic({ model: opts.model, apiKey, temperature: opts.temperature, maxTokens: opts.maxTokens ?? 4096 })
    }
    case 'google': {
      const apiKey = await vault.get('GEMINI_API_KEY')
      if (!apiKey) throw new Error('Gemini API key not configured')
      return new ChatGoogleGenerativeAI({ model: opts.model, apiKey, temperature: opts.temperature, maxOutputTokens: opts.maxTokens })
    }
  }
}

function buildMessages(opts: CallModelOptions) {
  const msgs: Array<SystemMessage | HumanMessage | AIMessage> = []
  if (opts.system) msgs.push(new SystemMessage(opts.system))
  for (const m of opts.messages) {
    if (m.role === 'system') msgs.push(new SystemMessage(m.content))
    else if (m.role === 'user') msgs.push(new HumanMessage(m.content))
    else msgs.push(new AIMessage(m.content))
  }
  return msgs
}

/**
 * Google's Gemini structured-output validator accepts only a restricted
 * subset of JSON Schema / OpenAPI 3.0 (no `additionalProperties`, no
 * `$schema`, `$id`, `$ref`, `const`, `examples`, etc.). OpenAI and Anthropic
 * both accept standard JSON Schema including `additionalProperties: false`,
 * so schemas authored against those providers reliably 400 against Gemini
 * with "Unknown name \"additionalProperties\"" (or similar) errors.
 *
 * This strips the known-unsupported keywords recursively so the *same*
 * schema definition can be reused across all three providers without each
 * call site needing a Gemini-specific variant.
 */
const GEMINI_UNSUPPORTED_SCHEMA_KEYS = new Set([
  'additionalProperties',
  '$schema',
  '$id',
  '$ref',
  '$defs',
  'const',
  'examples',
  'default',
])

function sanitizeSchemaForGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchemaForGemini)
  }
  if (schema && typeof schema === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
      if (GEMINI_UNSUPPORTED_SCHEMA_KEYS.has(key)) continue
      out[key] = sanitizeSchemaForGemini(value)
    }
    return out
  }
  return schema
}

export async function callModel<T = unknown>(opts: CallModelOptions): Promise<CallModelResult<T>> {
  const provider = detectProvider(opts.model)
  const llm = await createModel(provider, opts)
  const messages = buildMessages(opts)

  if (opts.jsonSchema) {
    const schema =
      provider === 'google' ? sanitizeSchemaForGemini(opts.jsonSchema.schema) : opts.jsonSchema.schema
    const structured = llm.withStructuredOutput(schema, {
      name: opts.jsonSchema.name,
      includeRaw: true,
    })
    const { raw, parsed } = await structured.invoke(messages)
    const msg = raw as AIMessageChunk
    return {
      text: typeof msg.content === 'string' ? msg.content : '',
      json: parsed as T,
      usage: {
        inputTokens: msg.usage_metadata?.input_tokens ?? 0,
        outputTokens: msg.usage_metadata?.output_tokens ?? 0,
        totalTokens: msg.usage_metadata?.total_tokens ?? 0,
      },
      provider,
      raw: msg,
    }
  }

  const result = await llm.invoke(messages)
  return {
    text: typeof result.content === 'string' ? result.content : '',
    json: undefined,
    usage: {
      inputTokens: result.usage_metadata?.input_tokens ?? 0,
      outputTokens: result.usage_metadata?.output_tokens ?? 0,
      totalTokens: result.usage_metadata?.total_tokens ?? 0,
    },
    provider,
    raw: result,
  }
}
