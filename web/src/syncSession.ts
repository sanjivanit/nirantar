// Tracks whether the "Building your Trust Profiles" sync screen has already
// been shown once in this browser session (sessionStorage clears itself when
// the tab/window closes), so logging in repeatedly during the same session
// or refreshing the page doesn't force the user through it again.
const KEY = 'nirantar_synced_session';

export function hasSyncedThisSession(): boolean {
  return sessionStorage.getItem(KEY) === '1';
}

export function markSyncedThisSession(): void {
  sessionStorage.setItem(KEY, '1');
}
