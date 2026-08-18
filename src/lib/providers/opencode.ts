import OpenAI from 'openai'

import { vault } from '@/lib/vault'

// OpenCode Zen (https://opencode.ai/docs/zen) is an AI gateway that exposes
// a curated set of coding-optimized models (GPT, Claude, Gemini, DeepSeek,
// MiniMax, Grok, Qwen, and more) behind a single API key and billing account.
//
// The OpenAI-compatible /v1/chat/completions endpoint gives the broadest
// model coverage (DeepSeek, MiniMax, and others are documented as
// OpenAI-compatible-only), so we reuse the `openai` SDK already used for
// OPENAI_API_KEY, just pointed at Zen's base URL instead.
const OPENCODE_ZEN_BASE_URL = 'https://opencode.ai/zen/v1'

let client: OpenAI | null = null
let cachedKey: string | null = null

export async function getOpenCode() {
  const apiKey = await vault.get('OPENCODE_API_KEY')
  if (!apiKey) {
    throw new Error('OpenCode API key not configured')
  }

  if (!client || cachedKey !== apiKey) {
    client = new OpenAI({ apiKey, baseURL: OPENCODE_ZEN_BASE_URL })
    cachedKey = apiKey
  }

  return client
}
