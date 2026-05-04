import { useEffect, useState } from 'react';

const KEY = 'glamify-sidebar-collapsed';

export default function useSidebarToggle() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem(KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    try { window.localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  return [collapsed, () => setCollapsed(v => !v)];
}
