"use client";

import { useRef } from "react";
import { Send, Square, Paperclip, X, FileText } from "lucide-react";

interface Attachment {
  type: "image" | "document";
  name: string;
  base64: string;
  mimeType: string;
}

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  attachments: Attachment[];
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (i: number) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  input, setInput, isLoading, attachments,
  onSubmit, onStop, onFileUpload, onRemoveAttachment, textareaRef,
}: ChatInputProps) {
  const localFileRef = useRef<HTMLInputElement>(null);
  const fileInputRef = localFileRef;

  return (
    <div className="p-3 border-t border-border shrink-0">
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((att, i) => (
            <div key={i} className="relative flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1.5">
              {att.type === "image" ? (
                <img src={att.base64} alt={att.name} className="w-8 h-8 rounded object-cover" />
              ) : (
                <FileText className="w-4 h-4 text-[#6366f1]" />
              )}
              <span className="text-[11px] text-foreground max-w-[100px] truncate">{att.name}</span>
              <button onClick={() => onRemoveAttachment(i)} className="ml-1 text-muted-foreground hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="relative">
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md,.csv" multiple onChange={onFileUpload} className="hidden" />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          placeholder="Descrie ce vrei sa construiesti..."
          className="w-full bg-card border border-border rounded-lg px-3 py-2 pr-20 text-[25px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[#6366f1] min-h-[60px]"
          rows={2}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          {isLoading ? (
            <button type="button" onClick={onStop} className="w-7 h-7 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors">
              <Square className="w-3 h-3 text-red-400" fill="currentColor" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim() && attachments.length === 0} className="w-7 h-7 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-lg flex items-center justify-center disabled:opacity-30">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </form>
      <p className="text-[9px] text-muted-foreground/50 text-center mt-1">Enter trimite · Shift+Enter linie noua</p>
    </div>
  );
}
