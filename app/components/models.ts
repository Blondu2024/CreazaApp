export interface AIModel {
  value: string;
  label: string;
  price: string;
  category: string;
}

export const models: AIModel[] = [
  // Gratuite
  { value: "qwen/qwen3.6-plus-preview:free", label: "Qwen 3.6 Plus Preview", price: "GRATUIT", category: "free" },
  { value: "google/gemini-2.0-flash-001:free", label: "Gemini 2.0 Flash", price: "GRATUIT", category: "free" },
  { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B", price: "GRATUIT", category: "free" },
  { value: "deepseek/deepseek-chat:free", label: "DeepSeek V3", price: "GRATUIT", category: "free" },
  { value: "qwen/qwen3-coder:free", label: "Qwen3 Coder", price: "GRATUIT", category: "free" },
  { value: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 405B", price: "GRATUIT", category: "free" },

  // OpenAI
  { value: "openai/gpt-5.4", label: "GPT-5.4", price: "$2.50/$15", category: "openai" },
  { value: "openai/gpt-5.3-codex", label: "GPT-5.3 Codex", price: "$1.75/$14", category: "openai" },
  { value: "openai/gpt-4.1", label: "GPT-4.1", price: "$2.50/$10", category: "openai" },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", price: "$0.40/$1.60", category: "openai" },
  { value: "openai/gpt-4o", label: "GPT-4o", price: "$2.50/$10", category: "openai" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", price: "$0.15/$0.60", category: "openai" },

  // Anthropic
  { value: "anthropic/claude-opus-4-6", label: "Claude Opus 4.6", price: "$5/$25", category: "anthropic" },
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", price: "$3/$15", category: "anthropic" },
  { value: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5", price: "$3/$15", category: "anthropic" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", price: "$3/$15", category: "anthropic" },
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", price: "$0.80/$4", category: "anthropic" },
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", price: "$3/$15", category: "anthropic" },

  // Google
  { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro", price: "$1.25/$10", category: "google" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", price: "$0.075/$0.30", category: "google" },
  { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash", price: "$0.10/$0.40", category: "google" },

  // DeepSeek
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1", price: "$0.55/$2.19", category: "deepseek" },
  { value: "deepseek/deepseek-chat", label: "DeepSeek V3", price: "$0.14/$0.28", category: "deepseek" },

  // Qwen
  { value: "qwen/qwen3-coder", label: "Qwen3 Coder", price: "$0.20/$0.60", category: "qwen" },
  { value: "qwen/qwq-32b", label: "QwQ 32B", price: "$0.12/$0.18", category: "qwen" },

  // Meta
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", price: "$0.12/$0.30", category: "meta" },
  { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", price: "$0.20/$0.60", category: "meta" },

  // Mistral
  { value: "mistralai/codestral-2501", label: "Codestral", price: "$0.30/$0.90", category: "mistral" },
  { value: "mistralai/devstral-small-2505", label: "Devstral Small", price: "$0.10/$0.30", category: "mistral" },
];

export const MODEL_CATEGORIES = [
  { key: "free", label: "Gratuite" },
  { key: "openai", label: "OpenAI" },
  { key: "anthropic", label: "Anthropic" },
  { key: "google", label: "Google" },
  { key: "deepseek", label: "DeepSeek" },
  { key: "qwen", label: "Qwen" },
  { key: "meta", label: "Meta Llama" },
  { key: "mistral", label: "Mistral" },
];
