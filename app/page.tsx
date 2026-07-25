'use client';

import { useEffect, useState } from 'react';
import { Settings, Wand2, GitBranch } from 'lucide-react';
import EnhanceSurface from '@/components/EnhanceSurface';
import HandoffSurface from '@/components/HandoffSurface';
import ProfilePanel from '@/components/ProfilePanel';
import InstallHint from '@/components/InstallHint';
import { Segmented } from '@/components/ui';
import type { StyleProfile, Surface } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';

const LS_PROFILE = 'prompt-enhancer:profile';
const LS_SURFACE = 'prompt-enhancer:surface';

const COPY: Record<Surface, { lead: string; accent: string; sub: string }> = {
  enhance: {
    lead: 'Say it roughly.',
    accent: 'Ship it precisely.',
    sub: 'A rough idea in, a production-grade prompt out — shaped for the model, task, and depth you pick.',
  },
  handoff: {
    lead: 'Out of context?',
    accent: 'Carry the session over.',
    sub: 'Paste a long Claude Code, Codex, or Cursor session. Get a brief that starts the next one exactly where this one stopped.',
  },
};

export default function Home() {
  const [surface, setSurface] = useState<Surface>('enhance');
  const [profile, setProfile] = useState<StyleProfile>(DEFAULT_PROFILE);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sessionSpend, setSessionSpend] = useState(0);
  const [ready, setReady] = useState(false);

  // Hydration must happen after mount: localStorage doesn't exist during SSR, so
  // reading it in a lazy initialiser would make the first client render disagree
  // with the server HTML. One extra render on mount is the correct trade here.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_PROFILE);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setProfile(JSON.parse(stored));
      const lastSurface = localStorage.getItem(LS_SURFACE);
      if (lastSurface === 'handoff' || lastSurface === 'enhance') setSurface(lastSurface);
    } catch {
      // corrupt storage shouldn't break the app
    }
    setReady(true);
  }, []);

  // Re-points --signal for the whole document, so switching surfaces shifts
  // every accent at once. This is the app's one orchestrated motion moment.
  useEffect(() => {
    document.documentElement.dataset.surface = surface;
    if (ready) localStorage.setItem(LS_SURFACE, surface);
  }, [surface, ready]);

  const saveProfile = (p: StyleProfile) => {
    setProfile(p);
    localStorage.setItem(LS_PROFILE, JSON.stringify(p));
  };

  const copy = COPY[surface];

  return (
    <main className="min-h-[100dvh] bg-[var(--ink)] text-[var(--chalk)]">
      <header className="safe-top safe-x sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--ink)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          {/* Wordmark shortens on mobile so the tabs and profile button always fit. */}
          <div className="flex min-w-0 shrink items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--signal)]" aria-hidden />
            <span className="display truncate text-[15px] text-[var(--chalk)]">
              <span className="sm:hidden">Studio</span>
              <span className="hidden sm:inline">Prompt Studio</span>
            </span>
          </div>

          <div className="w-[186px] shrink-0 sm:w-[240px]">
            <Segmented
              value={surface}
              onChange={setSurface}
              layoutId="surface"
              size="sm"
              options={[
                { value: 'enhance', label: 'Enhance', icon: <Wand2 size={12} /> },
                { value: 'handoff', label: 'Handoff', icon: <GitBranch size={12} /> },
              ]}
            />
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Style profile"
            title="Style profile"
            className="shrink-0 rounded-lg border border-[var(--line)] bg-[var(--ink-2)] p-2 text-[var(--ash)] transition hover:border-[var(--line-strong)] hover:text-[var(--chalk)]"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      <div className="safe-main mx-auto max-w-6xl">
        {/*
          The hero is set in the display monospace at a large size — terminal
          type used editorially, which is this product's own vernacular.
        */}
        <section className="mb-8 max-w-2xl sm:mb-10">
          {/* `key` remounts on surface change, which replays the CSS entrance. */}
          <h1
            key={surface}
            className="rise display text-[clamp(1.9rem,6.2vw,3.4rem)] text-[var(--chalk)]"
          >
            {copy.lead}
            <br />
            <span className="text-[var(--signal)]">{copy.accent}</span>
          </h1>
          <hr className="hairline my-5" />
          <p
            key={`${surface}-sub`}
            className="rise max-w-xl text-sm leading-6 text-[var(--ash)]"
          >
            {copy.sub}
          </p>
        </section>

        {surface === 'enhance' ? (
          <EnhanceSurface
            profile={profile}
            sessionSpend={sessionSpend}
            onSpend={(usd) => setSessionSpend((s) => s + usd)}
          />
        ) : (
          <HandoffSurface
            sessionSpend={sessionSpend}
            onSpend={(usd) => setSessionSpend((s) => s + usd)}
          />
        )}
      </div>

      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onSave={saveProfile}
      />
      <InstallHint />
    </main>
  );
}
