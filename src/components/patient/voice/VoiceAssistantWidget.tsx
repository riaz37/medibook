"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, X, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import VapiWidget to reduce initial bundle size
const VapiWidget = dynamic(() => import("./VapiWidget"), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

export function VoiceAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
        isOpen ? (isMinimized ? "w-80 h-16" : "w-96 h-[600px]") : "w-16 h-16"
      )}
    >
      {isOpen ? (
        <div className="h-full w-full bg-card border-2 border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Mic className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Voice Assistant</h3>
                <p className="text-xs text-muted-foreground">Book appointments by voice</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <VapiWidget />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="w-16 h-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Mic className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}

