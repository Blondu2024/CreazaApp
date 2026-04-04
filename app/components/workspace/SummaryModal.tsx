"use client";

import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { models } from "../models";

interface SummaryModalProps {
  summary: string;
  isLoading: boolean;
  canChooseModel: boolean;
  plan: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onContinue: () => void;
}

const PRO_MODEL_IDS = [
  "anthropic/claude-sonnet-4",
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.3-codex",
  "openai/gpt-4.1",
  "google/gemini-2.5-pro-preview",
  "deepseek/deepseek-r1",
];

const ULTRA_MODEL_IDS = [
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.4",
  ...PRO_MODEL_IDS,
];

export function SummaryModal({
  summary, isLoading, canChooseModel, plan,
  selectedModel, onModelChange, onContinue,
}: SummaryModalProps) {
  const allowedModels = plan === "ultra" ? ULTRA_MODEL_IDS : PRO_MODEL_IDS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-[#6366f1]/10 to-[#a855f7]/10">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-[#6366f1]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Conversatie noua</h3>
            <p className="text-xs text-muted-foreground">Contextul a atins limita. Continuam cu un rezumat.</p>
          </div>
        </div>

        {/* Summary content */}
        <div className="px-6 py-4 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="w-5 h-5 text-[#6366f1] animate-spin" />
              <span className="text-sm text-muted-foreground">Se genereaza rezumatul...</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </div>

        {/* Model selector for Pro/Ultra */}
        {canChooseModel && !isLoading && (
          <div className="px-6 py-3 border-t border-border">
            <label className="text-xs text-muted-foreground mb-1.5 block">Alege modelul pentru continuare:</label>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full h-9 bg-background border border-border text-foreground text-sm rounded-lg px-3 outline-none focus:border-[#6366f1]"
            >
              {models.filter((m) => allowedModels.includes(m.value)).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-6 py-2.5 rounded-xl font-semibold btn-primary-glow disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            Continua
          </button>
        </div>
      </div>
    </div>
  );
}
