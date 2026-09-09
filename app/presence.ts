export type Presence = {
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activity: string;
};
export type PresenceState =
  | {
      kind: 'connecting' | 'unavailable' | 'unmonitored';
      cachedPresence?: Presence;
    }
  | { kind: 'live'; presence: Presence };

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

export function parsePresence(value: unknown, userId: string): Presence | null {
  const data = record(value);
  const user = record(data?.discord_user);
  if (!data || !user || user.id !== userId || typeof user.username !== 'string')
    return null;
  const status = data.discord_status;
  if (
    status !== 'online' &&
    status !== 'idle' &&
    status !== 'dnd' &&
    status !== 'offline'
  )
    return null;
  const hash =
    typeof user.avatar === 'string' && /^(a_)?[a-f0-9]+$/.test(user.avatar)
      ? user.avatar
      : '';
  let activity = '';
  const spotify = record(data.spotify);
  if (
    status !== 'offline' &&
    data.listening_to_spotify === true &&
    typeof spotify?.song === 'string'
  ) {
    activity = `Listening to ${spotify.song}`;
  } else if (status !== 'offline' && Array.isArray(data.activities)) {
    for (const item of data.activities) {
      const entry = record(item);
      if (entry?.type === 4 && typeof entry.state === 'string') {
        activity = entry.state;
        break;
      }
      if (entry?.type === 0 && typeof entry.name === 'string' && !activity)
        activity = `Playing ${entry.name}`;
    }
  }
  return {
    name:
      typeof user.global_name === 'string' && user.global_name
        ? user.global_name
        : user.username,
    avatar: hash
      ? `https://cdn.discordapp.com/avatars/${userId}/${hash}.webp?size=128`
      : '',
    status,
    activity,
  };
}

// One socket per mounted provider. Reconnect delays are bounded; cleanup cancels all work.
export function subscribePresence(
  userId: string,
  update: (state: PresenceState) => void,
  createSocket: () => WebSocket = () =>
    new WebSocket('wss://api.lanyard.rest/socket'),
) {
  let socket: WebSocket | null = null;
  let stopped = false;
  let failures = 0;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;

  function clearConnection() {
    clearInterval(heartbeat);
    clearTimeout(timeout);
  }
  function reconnect() {
    clearConnection();
    if (stopped) return;
    update({ kind: 'unavailable' });
    retry = setTimeout(
      connect,
      Math.min(30000, 1000 * 2 ** Math.min(failures++, 5)),
    );
  }
  function connect() {
    if (stopped) return;
    update({ kind: 'connecting' });
    try {
      socket = createSocket();
    } catch {
      reconnect();
      return;
    }
    const connection = socket;
    timeout = setTimeout(() => connection.close(), 10000);
    connection.onmessage = (event) => {
      let message: Record<string, unknown> | null;
      try {
        message = record(JSON.parse(String(event.data)));
      } catch {
        connection.close();
        return;
      }
      const data = record(message?.d);
      if (message?.op === 1) {
        const interval = data?.heartbeat_interval;
        if (
          typeof interval !== 'number' ||
          !Number.isFinite(interval) ||
          interval < 1000 ||
          interval > 120000
        ) {
          connection.close();
          return;
        }
        clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          if (connection.readyState === 1)
            connection.send(JSON.stringify({ op: 3 }));
        }, interval);
        connection.send(
          JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }),
        );
      }
      if (
        message?.op === 0 &&
        (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE')
      ) {
        clearTimeout(timeout);
        failures = 0;
        const presence = parsePresence(message.d, userId);
        update(presence ? { kind: 'live', presence } : { kind: 'unmonitored' });
      }
    };
    connection.onerror = () => connection.close();
    connection.onclose = reconnect;
  }
  // React development effects can clean up immediately before mounting again.
  queueMicrotask(connect);
  return () => {
    stopped = true;
    clearConnection();
    clearTimeout(retry);
    if (socket) {
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
  };
}

// HTTPS snapshots keep status usable when a browser/network blocks WebSockets.
export function watchPresence(
  userId: string,
  update: (state: PresenceState) => void,
  dependencies = {
    subscribe: subscribePresence,
    fetch: globalThis.fetch.bind(globalThis),
  },
) {
  let stopped = false;
  let socketLive = false;
  let socketRevision = 0;
  let snapshot: PresenceState | null = null;
  let snapshotAt = 0;
  let lastAttempt = 0;
  let request: AbortController | null = null;

  async function refresh() {
    if (stopped || request) return;
    const controller = new AbortController();
    request = controller;
    lastAttempt = Date.now();
    const revision = socketRevision;
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await dependencies.fetch(
        `https://api.lanyard.rest/v1/users/${userId}`,
        { signal: controller.signal, cache: 'no-store' },
      );
      const body = record(await response.json());
      if (stopped || revision !== socketRevision) return;
      const error = record(body?.error);
      if (error?.code === 'user_not_monitored')
        snapshot = { kind: 'unmonitored' };
      else {
        const presence =
          response.ok && body?.success === true
            ? parsePresence(body.data, userId)
            : null;
        if (!presence) throw new Error('Presence snapshot unavailable');
        snapshot = { kind: 'live', presence };
      }
      snapshotAt = Date.now();
      update(snapshot);
    } catch {
      if (!stopped && !socketLive && revision === socketRevision) {
        snapshot = null;
        update({ kind: 'unavailable' });
      }
    } finally {
      clearTimeout(timeout);
      if (request === controller) request = null;
    }
  }

  const stopSocket = dependencies.subscribe(userId, (state) => {
    if (stopped) return;
    socketLive = state.kind === 'live';
    if (socketLive) {
      socketRevision++;
      snapshot = null;
      update(state);
      return;
    }
    if (snapshot && Date.now() - snapshotAt < 45000) update(snapshot);
    else update(state);
    if (Date.now() - lastAttempt >= 15000) void refresh();
  });
  // Also checks sockets that appear open after a network interruption.
  const poll = setInterval(() => void refresh(), 30000);
  if (!lastAttempt) void refresh();
  return () => {
    stopped = true;
    stopSocket();
    clearInterval(poll);
    request?.abort();
  };
}
