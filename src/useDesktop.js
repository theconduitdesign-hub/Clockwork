// Desktop layout switch. At 1024px and wider the app uses the sidebar and multi-column pages.
import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

function matches() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

export function useDesktop() {
  const [desktop, setDesktop] = useState(matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}

// Renders its children on phones only (e.g. the header logo, which the sidebar replaces on desktop).
export function MobileOnly({ children }) {
  return useDesktop() ? null : children;
}

// Renders its children on desktop only.
export function DesktopOnly({ children }) {
  return useDesktop() ? children : null;
}
