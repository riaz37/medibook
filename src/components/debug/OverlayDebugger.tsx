"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Overlay Debugger Component
 * Helps identify which overlay components are currently active/open
 */
export function OverlayDebugger() {
  const [overlays, setOverlays] = useState<Array<{
    type: string;
    element: HTMLElement;
    state: string;
    zIndex: string;
    visible: boolean;
  }>>([]);

  useEffect(() => {
    const checkOverlays = () => {
      const found: Array<{
        type: string;
        element: HTMLElement;
        state: string;
        zIndex: string;
        visible: boolean;
      }> = [];

      // Check Dialog overlays
      const dialogOverlays = document.querySelectorAll('[data-slot="dialog-overlay"]');
      dialogOverlays.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const state = htmlEl.getAttribute('data-state') || 'unknown';
        const zIndex = window.getComputedStyle(htmlEl).zIndex;
        const visible = state === 'open' || htmlEl.style.display !== 'none';
        found.push({
          type: 'Dialog',
          element: htmlEl,
          state,
          zIndex,
          visible,
        });
      });

      // Check Sheet overlays (mobile sidebar)
      const sheetOverlays = document.querySelectorAll('[data-slot="sheet-overlay"]');
      sheetOverlays.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const state = htmlEl.getAttribute('data-state') || 'unknown';
        const zIndex = window.getComputedStyle(htmlEl).zIndex;
        const visible = state === 'open' || htmlEl.style.display !== 'none';
        found.push({
          type: 'Sheet',
          element: htmlEl,
          state,
          zIndex,
          visible,
        });
      });

      // Check AlertDialog overlays
      const alertDialogOverlays = document.querySelectorAll('[data-slot="alert-dialog-overlay"]');
      alertDialogOverlays.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const state = htmlEl.getAttribute('data-state') || 'unknown';
        const zIndex = window.getComputedStyle(htmlEl).zIndex;
        const visible = state === 'open' || htmlEl.style.display !== 'none';
        found.push({
          type: 'AlertDialog',
          element: htmlEl,
          state,
          zIndex,
          visible,
        });
      });

      // Check Drawer overlays
      const drawerOverlays = document.querySelectorAll('[data-slot="drawer-overlay"]');
      drawerOverlays.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const state = htmlEl.getAttribute('data-state') || 'unknown';
        const zIndex = window.getComputedStyle(htmlEl).zIndex;
        const visible = state === 'open' || htmlEl.style.display !== 'none';
        found.push({
          type: 'Drawer',
          element: htmlEl,
          state,
          zIndex,
          visible,
        });
      });

      // Check OnboardingTour overlay (custom z-index)
      const onboardingOverlays = document.querySelectorAll('.fixed.inset-0.z-\\[9998\\]');
      onboardingOverlays.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const zIndex = window.getComputedStyle(htmlEl).zIndex;
        const visible = htmlEl.style.display !== 'none' && htmlEl.style.opacity !== '0';
        found.push({
          type: 'OnboardingTour',
          element: htmlEl,
          state: 'custom',
          zIndex,
          visible,
        });
      });

      setOverlays(found);
    };

    // Check immediately
    checkOverlays();

    // Check periodically
    const interval = setInterval(checkOverlays, 500);

    // Also check on DOM changes
    const observer = new MutationObserver(checkOverlays);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'style', 'class'],
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  const closeAllOverlays = () => {
    // Try to close all open dialogs/sheets
    document.querySelectorAll('[data-slot="dialog-close"]').forEach((btn) => {
      (btn as HTMLElement).click();
    });
    document.querySelectorAll('[data-slot="sheet-close"]').forEach((btn) => {
      (btn as HTMLElement).click();
    });
    document.querySelectorAll('[data-slot="alert-dialog-close"]').forEach((btn) => {
      (btn as HTMLElement).click();
    });
  };

  if (overlays.length === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-[99999] w-96 max-h-96 overflow-auto bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Overlay Debugger</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={closeAllOverlays}
            className="text-xs"
          >
            Close All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {overlays.map((overlay, index) => (
          <div
            key={index}
            className={`p-2 rounded border ${
              overlay.visible
                ? 'bg-red-100 dark:bg-red-900/20 border-red-500'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300'
            }`}
          >
            <div className="text-xs font-semibold">{overlay.type}</div>
            <div className="text-xs text-muted-foreground">
              State: {overlay.state}
            </div>
            <div className="text-xs text-muted-foreground">
              Z-Index: {overlay.zIndex}
            </div>
            <div className="text-xs text-muted-foreground">
              Visible: {overlay.visible ? 'YES ⚠️' : 'No'}
            </div>
            {overlay.visible && (
              <Button
                size="sm"
                variant="destructive"
                className="mt-2 text-xs h-6"
                onClick={() => {
                  overlay.element.style.display = 'none';
                  overlay.element.style.opacity = '0';
                  overlay.element.style.pointerEvents = 'none';
                }}
              >
                Force Hide
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
