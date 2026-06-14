'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, X, Plus } from 'lucide-react';

const LS_DISMISSED = 'prompt-enhancer:install-hint-dismissed';

/**
 * iOS Safari has no beforeinstallprompt event, so we nudge the user toward
 * Share → Add to Home Screen. Shown only on iOS Safari, when not already
 * running standalone, and only until dismissed once.
 */
export default function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_DISMISSED)) return;

    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error — non-standard iOS Safari flag
      window.navigator.standalone === true;

    if (isIOS && isSafari && !standalone) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(LS_DISMISSED, '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-50 safe-bottom"
        >
          <div className="mx-auto max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-tint)]/95 backdrop-blur-xl px-4 py-3.5 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Plus size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">Install on your iPhone</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
                  Tap{' '}
                  <Share size={12} className="inline -translate-y-px text-[var(--accent)]" />{' '}
                  Share, then{' '}
                  <span className="font-medium text-[var(--text)]">Add to Home Screen</span> for a
                  full-screen app.
                </p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="-mr-1 -mt-1 rounded-lg p-1.5 text-[var(--faint)] hover:bg-white/5 hover:text-[var(--text)] transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
