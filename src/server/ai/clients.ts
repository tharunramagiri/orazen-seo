import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

import { getAnthropic } from '@/lib/providers/anthropic'
import { getOpenAI } from '@/lib/providers/openai'
import { getOpenCode } from '@/lib/providers/opencode'

let _openai: OpenAI | null = null
let _anthropic: Anthropic | null = null
let _opencode: OpenAI | null = null

export async function getOpenAIClient(): Promise<OpenAI> {
  if (!_openai) _openai = await getOpenAI()
  return _openai
}

export async function getAnthropicClient(): Promise<Anthropic> {
  if (!_anthropic) {
    _anthropic = await getAnthropic()
  }
  return _anthropic
}

/**
 * OpenCode Zen (https://opencode.ai/docs/zen) — OpenAI-compatible gateway.
 * Same `OpenAI` client shape as getOpenAIClient(), just pointed at Zen's
 * base URL and billed against your OpenCode Zen workspace instead of a
 * direct OpenAI account.
 */
export async function getOpenCodeClient(): Promise<OpenAI> {
  if (!_opencode) _opencode = await getOpenCode()
  return _opencode
}

export const MODELS = {
  OPENAI_DEFAULT: 'gpt-5-mini',
  OPENAI_SMART: 'gpt-5.2',
  ANTHROPIC_DEFAULT: 'claude-sonnet-4-5-20250929',
  // OpenCode Zen model IDs (see https://opencode.ai/docs/zen for full list).
  OPENCODE_DEFAULT: 'gpt-5-mini',
  OPENCODE_DEEPSEEK: 'deepseek-v4-flash',
  OPENCODE_CLAUDE: 'claude-sonnet-5',
} as const
