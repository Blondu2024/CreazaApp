"use client";

import { useState } from "react";
import { Rocket, Loader2, Check, ExternalLink, X, RefreshCw } from "lucide-react";
import { getAccessToken } from "@/lib/supabase";

interface DeployModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  deployUrl: string | null;
  onSuccess: (url: string, creditsCost: number, cached: boolean) => void;
}

type ModalState = "confirm" | "deploying" | "success" | "error";

export function DeployModal({ open, onClose, projectId, deployUrl, onSuccess }: DeployModalProps) {
  const [state, setState] = useState<ModalState>("confirm");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [creditsCost, setCreditsCost] = useState(0);
  const [error, setError] = useState("");

  if (!open) return null;

  const isRedeploy = !!deployUrl;
  const cost = isRedeploy ? 3 : 10;

  const handleDeploy = async () => {
    setState("deploying");
    setError("");

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, force: isRedeploy }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setError(data.error || "Eroare la publicare");
        return;
      }

      setResultUrl(data.url);
      setCreditsCost(data.creditsCost || 0);
      setState("success");
      onSuccess(data.url, data.creditsCost || 0, data.cached || false);
    } catch {
      setState("error");
      setError("Eroare de conexiune la serverele de deploy");
    }
  };

  const handleClose = () => {
    setState("confirm");
    setError("");
    setResultUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={state !== "deploying" ? handleClose : undefined}
      />
      <div className="relative w-full max-w-[360px] bg-card border border-border rounded-2xl p-6 shadow-2xl">
        {/* Close button */}
        {state !== "deploying" && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* CONFIRM */}
        {state === "confirm" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRedeploy ? "bg-[#6366f1]/10" : "bg-[#10b981]/10"}`}>
                {isRedeploy ? (
                  <RefreshCw className="w-5 h-5 text-[#6366f1]" />
                ) : (
                  <Rocket className="w-5 h-5 text-[#10b981]" />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {isRedeploy ? "Republică proiectul" : "Publică proiectul"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isRedeploy
                    ? "Actualizează site-ul publicat"
                    : "Proiectul va fi disponibil online"}
                </p>
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cost</span>
                <span className="text-sm font-semibold text-foreground">
                  {cost} credite
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 h-10 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleDeploy}
                className="flex-1 h-10 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {isRedeploy ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                {isRedeploy ? "Republică" : "Publică"}
              </button>
            </div>

            {isRedeploy && deployUrl && (
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-[#10b981] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Deschide versiunea curentă
              </a>
            )}
          </>
        )}

        {/* DEPLOYING */}
        {state === "deploying" && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="w-10 h-10 text-[#6366f1] animate-spin mb-4" />
            <p className="text-sm font-medium text-foreground">Se publică...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Durează câteva secunde
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {state === "success" && (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-[#10b981]" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              Publicat cu succes!
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {creditsCost > 0
                ? `${creditsCost} credite consumate`
                : "Nicio modificare — gratuit"}
            </p>

            {resultUrl && (
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-2"
              >
                <ExternalLink className="w-4 h-4" />
                Deschide în browser
              </a>
            )}
            <button
              onClick={handleClose}
              className="w-full h-10 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Închide
            </button>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              Eroare la publicare
            </p>
            <p className="text-xs text-red-400 text-center mb-4">{error}</p>
            <div className="flex gap-2 w-full">
              <button
                onClick={handleClose}
                className="flex-1 h-10 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Închide
              </button>
              <button
                onClick={handleDeploy}
                className="flex-1 h-10 bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Încearcă din nou
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
