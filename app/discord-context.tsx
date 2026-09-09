import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { profile } from './profile';
import { watchPresence, type PresenceState } from './presence';

const DiscordContext = createContext<PresenceState>({ kind: 'connecting' });

export function DiscordProvider({ children }: { children: ReactNode }) {
  const userId = profile.discord.userId.trim();
  const configured = /^\d{17,20}$/.test(userId);
  const [state, setState] = useState<PresenceState>({ kind: 'connecting' });

  useEffect(() => {
    if (!configured) return;
    let stop: (() => void) | undefined;
    function updatePresence(next: PresenceState) {
      setState((current) => {
        if (next.kind === 'live' || next.cachedPresence) return next;
        return {
          ...next,
          cachedPresence:
            current.kind === 'live' ? current.presence : current.cachedPresence,
        };
      });
    }
    function resume() {
      stop?.();
      stop = undefined;
      if (!document.hidden) stop = watchPresence(userId, updatePresence);
    }
    resume();
    document.addEventListener('visibilitychange', resume);
    return () => {
      stop?.();
      document.removeEventListener('visibilitychange', resume);
    };
  }, [configured, userId]);

  return (
    <DiscordContext.Provider value={state}>{children}</DiscordContext.Provider>
  );
}

export function useDiscordPresence() {
  return useContext(DiscordContext);
}
