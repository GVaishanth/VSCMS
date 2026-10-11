import { Wrench } from 'lucide-react';

export type LoadingPhase = 'database' | 'checking' | 'importing' | 'ready';

interface LoadingScreenProps {
  phase: LoadingPhase;
}

export function LoadingScreen({ phase }: LoadingScreenProps) {
  const statusText = {
    database: 'Opening local database…',
    checking: 'Checking saved records…',
    importing: 'Loading the review data…',
    ready: 'Opening your dashboard…',
  }[phase];

  return (
    <main className="vscms-loading" aria-label="VSCMS loading screen">
      <section className="loading-card" aria-labelledby="loading-title">
        <div className="loading-brand">
          <span className="loading-brand-mark" aria-hidden="true"><Wrench size={19} strokeWidth={2.2} /></span>
          <span>VSCMS</span>
        </div>
        <h1 id="loading-title">Loading your workshop</h1>
        <p className="loading-subtitle">Loading frontend and local workspace</p>
        <div
          className="loading-road"
          role="progressbar"
          aria-label="Loading VSCMS"
          aria-valuetext={statusText}
        >
          <span className="loading-road-track" aria-hidden="true" />
          <span className="loading-road-dashes" aria-hidden="true" />
          <span className="loading-car" aria-hidden="true">🚗</span>
        </div>
        <p className="loading-status" aria-live="polite">{statusText}</p>
      </section>

      <div className="loading-credit">Made by <strong>G.Vaishanth</strong></div>
    </main>
  );
}
