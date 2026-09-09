import type { SocialIcon } from './profile';

export function SocialSymbol({ name }: { name: SocialIcon }) {
  if (name === 'discord')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.3 4.8a20 20 0 0 0-4.8-1.5l-.6 1.2a18 18 0 0 0-5.8 0l-.6-1.2a20 20 0 0 0-4.8 1.5C.7 9.3-.1 13.7.3 18a20 20 0 0 0 5.9 3l1.2-2a12 12 0 0 1-1.9-.9l.5-.4a14 14 0 0 0 12 0l.5.4a12 12 0 0 1-1.9.9l1.2 2a20 20 0 0 0 5.9-3c.5-5-1-9.4-3.4-13.2ZM8 15.6c-1.2 0-2.1-1.1-2.1-2.5s.9-2.5 2.1-2.5 2.2 1.1 2.1 2.5c0 1.4-.9 2.5-2.1 2.5Zm8 0c-1.2 0-2.1-1.1-2.1-2.5s.9-2.5 2.1-2.5 2.2 1.1 2.1 2.5c0 1.4-.9 2.5-2.1 2.5Z" />
      </svg>
    );
  if (name === 'github')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .7a11.6 11.6 0 0 0-3.7 22.6c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.4 4.6 18.4 5 18.4 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6A11.6 11.6 0 0 0 12 .7Z" />
      </svg>
    );
  if (name === 'steam')
    return (
      <img
        src="/Steam.jpg"
        alt=""
        aria-hidden="true"
      />
    );
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      <path
        d="M1.5 8h21M1.5 16h21M12 1.5c-6 5-6 16 0 21M12 1.5c6 5 6 16 0 21"
        stroke="#666"
      />
    </svg>
  );
}
