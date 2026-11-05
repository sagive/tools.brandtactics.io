"use client";

import { useState } from "react";
import { Info, Copy, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export function BacklinkInfoPopover({ description }: { description?: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!description || !description.trim()) {
    return null;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(description.trim());
    setCopied(true);
    toast.success("Description copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="inline-flex items-center justify-center p-0.5 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
        title="View description / notes"
      >
        <Info className="w-3.5 h-3.5" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={6}
        className="w-72 sm:w-80 p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-50 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
          <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Description / Instructions
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
            title="Copy description text"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto pr-1 select-text">
          {description.trim()}
        </div>
      </PopoverContent>
    </Popover>
  );
}

