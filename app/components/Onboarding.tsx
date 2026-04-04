"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Eye, Rocket, Globe, X, ChevronRight, Sparkles } from "lucide-react";

const STORAGE_KEY = "creazaapp_onboarding_done";

const steps = [
  {
    icon: Sparkles,
    title: "Bine ai venit pe CreazaApp!",
    description: "Construiește aplicații web cu ajutorul AI. Hai să-ți arăt cum funcționează — durează 30 de secunde.",
    color: "#6366f1",
  },
  {
    icon: MessageSquare,
    title: "1. Scrie ce vrei să construiești",
    description: "În chat-ul din stânga, descrie aplicația dorită. De exemplu: \"Landing page pentru o cafenea\" sau \"Aplicație todo cu categorii\". AI-ul generează codul automat.",
    color: "#3b82f6",
  },
  {
    icon: Eye,
    title: "2. Vezi rezultatul instant",
    description: "Preview-ul din dreapta se actualizează live. Poți edita codul direct în tab-ul Code sau cere AI-ului să facă modificări prin chat.",
    color: "#10b981",
  },
  {
    icon: Rocket,
    title: "3. Publică online cu un click",
    description: "Apasă butonul verde \"Publică\" din bara de sus. Primești instant un link proiect.creazaapp.com pe care îl poți trimite oricui.",
    color: "#a855f7",
  },
  {
    icon: Globe,
    title: "Gata! Ești pregătit.",
    description: "Download ZIP, export GitHub, domeniu custom — le găsești toate în bara de sus. Iar creditele le vezi în colțul dreapta sus. Succes!",
    color: "#f59e0b",
  },
];

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show for new users who haven't completed onboarding
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!show) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ backgroundColor: `${current.color}15` }}
            >
              <current.icon className="w-8 h-8" style={{ color: current.color }} />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-3">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">{current.description}</p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {!isFirst && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
                >
                  Înapoi
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#6366f1] to-[#a855f7] btn-primary-glow flex items-center justify-center gap-2"
              >
                {isLast ? "Începe să creezi!" : isFirst ? "Hai să vedem!" : "Continuă"}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-[#6366f1]" : i < step ? "bg-[#6366f1]/50" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute -top-10 right-0 flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Sari peste
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
