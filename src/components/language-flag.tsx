"use client";

import { cn } from "@/lib/utils";

const USFlag = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#bd3d44" d="M0 0h640v480H0z"/>
      <path fill="#fff" d="M0 36.9h640v36.9H0zm0 73.8h640v36.9H0zm0 73.9h640v36.9H0zm0 73.8h640v36.9H0zm0 73.9h640v36.9H0zm0 73.8h640v36.9H0z"/>
      <path fill="#192f5d" d="M0 0h280v258.5H0z"/>
    </g>
  </svg>
);

const ILFlag = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <path fill="#fff" d="M0 0h640v480H0z"/>
    <path fill="#0038b8" d="M0 40h640v60H0zm0 340h640v60H0z"/>
    <g fill="none" stroke="#0038b8" strokeWidth="20">
      <polygon points="320,160 390,280 250,280"/>
      <polygon points="320,320 390,200 250,200"/>
    </g>
  </svg>
);

export function LanguageFlag({ language, className }: { language?: string; className?: string }) {
  const lang = (language || "english").toLowerCase();
  const isHebrew = lang === "hebrew" || lang === "he" || lang === "il";

  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center shrink-0 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default select-none",
        className
      )}
      title={isHebrew ? "Hebrew (IL)" : "English (US)"}
    >
      {isHebrew ? (
        <ILFlag className="w-4 h-3 rounded-[2px] shadow-sm border border-gray-200/60" />
      ) : (
        <USFlag className="w-4 h-3 rounded-[2px] shadow-sm border border-gray-200/60" />
      )}
    </div>
  );
}
