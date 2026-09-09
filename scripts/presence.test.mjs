import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePresence, subscribePresence } from '../app/presence.ts';

const userId = '1415607936209911808';
function payload(status = 'online') {
  return {
    discord_user: {
      id: userId,
      username: 'owner',
      global_name: 'Owner',
      avatar: 'abcdef123456',
    },
    discord_status: status,
    activities: [{ type: 0, name: 'Minecraft' }],
  };
}

test('validates identity and status; offline never shows an active game', () => {
  assert.equal(parsePresence(payload(), userId).activity, 'Playing Minecraft');
  assert.equal(parsePresence(payload('offline'), userId).activity, '');
  assert.equal(parsePresence(payload('invented'), userId), null);
  assert.equal(parsePresence(payload(), '123456789012345678'), null);
  assert.equal(parsePresence(null, userId), null);
});

test('socket subscribes to the configured owner and replaces stale presence on disconnect', async () => {
  const sent = [];
  const states = [];
  const socket = {
    readyState: 1,
    onmessage: null,
    onclose: null,
    onerror: null,
    send(message) {
      sent.push(JSON.parse(message));
    },
    close() {
      this.onclose?.();
    },
  };
  const stop = subscribePresence(
    userId,
    (state) => states.push(state),
    () => socket,
  );
  await Promise.resolve();
  try {
    socket.onmessage({
      data: JSON.stringify({ op: 1, d: { heartbeat_interval: 30000 } }),
    });
    assert.deepEqual(sent[0], { op: 2, d: { subscribe_to_id: userId } });
    socket.onmessage({
      data: JSON.stringify({ op: 0, t: 'INIT_STATE', d: payload() }),
    });
    assert.equal(states.at(-1).kind, 'live');
    socket.onmessage({
      data: JSON.stringify({ op: 0, t: 'PRESENCE_UPDATE', d: payload('idle') }),
    });
    assert.equal(states.at(-1).presence.status, 'idle');
    socket.close();
    assert.equal(states.at(-1).kind, 'unavailable');
  } finally {
    stop();
  }
  assert.equal(socket.onmessage, null);
  assert.equal(socket.onclose, null);
});

test('an unmonitored account is not presented as offline', async () => {
  const states = [];
  const socket = {
    readyState: 1,
    onmessage: null,
    onclose: null,
    onerror: null,
    send() {},
    close() {},
  };
  const stop = subscribePresence(
    userId,
    (state) => states.push(state),
    () => socket,
  );
  await Promise.resolve();
  try {
    socket.onmessage({
      data: JSON.stringify({ op: 0, t: 'INIT_STATE', d: {} }),
    });
    assert.equal(states.at(-1).kind, 'unmonitored');
  } finally {
    stop();
  }
});

test('HTTPS fallback supplies status when WebSocket is blocked', async () => {
  const { watchPresence } = await import('../app/presence.ts');
  const states = [];
  let disconnected = false;
  const stop = watchPresence(userId, (state) => states.push(state), {
    subscribe(id, update) {
      update({ kind: 'unavailable' });
      return () => {
        disconnected = true;
      };
    },
    async fetch() {
      return {
        ok: true,
        async json() {
          return { success: true, data: payload('dnd') };
        },
      };
    },
  });
  try {
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(states.at(-1).kind, 'live');
    assert.equal(states.at(-1).presence.status, 'dnd');
  } finally {
    stop();
  }
  assert.equal(disconnected, true);
});

test('slow HTTP response cannot overwrite a newer live socket update', async () => {
  const { watchPresence } = await import('../app/presence.ts');
  const states = [];
  let send;
  let respond;
  const stop = watchPresence(userId, (state) => states.push(state), {
    subscribe(id, update) {
      send = update;
      update({ kind: 'connecting' });
      return () => {};
    },
    fetch() {
      return new Promise((resolve) => {
        respond = resolve;
      });
    },
  });
  try {
    send({ kind: 'live', presence: parsePresence(payload('online'), userId) });
    respond({
      ok: true,
      async json() {
        return { success: true, data: payload('offline') };
      },
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(states.at(-1).presence.status, 'online');
  } finally {
    stop();
  }
});

test('immediate effect cleanup does not open a throwaway socket', async () => {
  let connections = 0;
  const stop = subscribePresence(
    userId,
    () => {},
    () => {
      connections++;
      throw new Error('Unexpected connection');
    },
  );
  stop();
  await Promise.resolve();
  assert.equal(connections, 0);
});
