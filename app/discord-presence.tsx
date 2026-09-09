import { memo } from 'react';
import { profile } from './profile';
import { useDiscordPresence } from './discord-context';

const statusLabels = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do not disturb',
  offline: 'Offline',
};

export const DiscordPresence = memo(function DiscordPresence() {
  const userId = profile.discord.userId.trim();
  const configured = /^\d{17,20}$/.test(userId);
  const state = useDiscordPresence();
  const presence = configured && state.kind === 'live' ? state.presence : null;
  let label = 'Presence not connected';
  if (configured) {
    if (presence) label = statusLabels[presence.status];
    else if (state.kind === 'connecting') label = 'Connecting…';
    else if (state.kind === 'unmonitored') label = 'Join Lanyard to connect';
    else label = 'Presence unavailable';
  }
  return (
    <output
      className="discord-inline-presence"
      aria-label={`Discord status: ${label}`}
    >
      <span>{label}</span>
      {profile.discord.showActivity && presence?.activity && (
        <span className="discord-inline-activity" title={presence.activity}>
          {presence.activity}
        </span>
      )}
    </output>
  );
});
