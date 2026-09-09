import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attachTilt } from '../app/tilt.ts';

function fixture() {
  const host = new EventTarget();
  const frames = new Map();
  let id = 0;
  let time = 0;
  Object.assign(host, {
    document: new EventTarget(),
    requestAnimationFrame(callback) {
      frames.set(++id, callback);
      return id;
    },
    cancelAnimationFrame(key) {
      frames.delete(key);
    },
  });
  function panel() {
    const target = { style: {} };
    const surface = new EventTarget();
    let reads = 0;
    surface.getBoundingClientRect = () => {
      reads++;
      return { left: 100, top: 100, width: 400, height: 300 };
    };
    const stop = attachTilt(target, surface, host);
    return { target, surface, stop, reads: () => reads };
  }
  function pointer(surface, type, pointerType = 'mouse') {
    const event = new Event(type);
    Object.assign(event, { clientX: 500, clientY: 100, pointerType });
    surface.dispatchEvent(event);
  }
  function settle() {
    for (let count = 0; frames.size && count < 200; count++) {
      const pending = [...frames.values()];
      frames.clear();
      time += 16.67;
      for (const callback of pending) callback(time);
    }
    assert.equal(frames.size, 0);
  }
  return { host, frames, panel, pointer, settle };
}

test('only hovered panel tilts, with coalesced frames and no per-move layout reads', () => {
  const f = fixture();
  const a = f.panel();
  const b = f.panel();
  f.pointer(f.host, 'pointermove');
  assert.equal(f.frames.size, 0);
  f.pointer(a.surface, 'pointerenter');
  for (let i = 0; i < 100; i++) f.pointer(a.surface, 'pointermove');
  assert.equal(f.frames.size, 1);
  assert.equal(a.reads(), 1);
  f.settle();
  assert.equal(
    a.target.style.transform,
    'rotateX(10.000deg) rotateY(12.000deg)',
  );
  assert.equal(b.target.style.transform, undefined);
  a.surface.dispatchEvent(new Event('pointerleave'));
  f.pointer(b.surface, 'pointerenter');
  f.settle();
  assert.equal(a.target.style.transform, 'rotateX(0.000deg) rotateY(0.000deg)');
  assert.equal(
    b.target.style.transform,
    'rotateX(10.000deg) rotateY(12.000deg)',
  );
  a.stop();
  b.stop();
});

test('touch stays idle and cleanup cancels pending motion', () => {
  const f = fixture();
  const a = f.panel();
  f.pointer(a.surface, 'pointerenter', 'touch');
  f.pointer(a.surface, 'pointermove', 'touch');
  assert.equal(f.frames.size, 0);
  f.pointer(a.surface, 'pointerenter');
  a.stop();
  assert.equal(f.frames.size, 0);
  assert.equal(a.target.style.transform, '');
  f.pointer(a.surface, 'pointerenter');
  assert.equal(f.frames.size, 0);
});

test('window blur neutralizes hover and requires re-entry', () => {
  const f = fixture();
  const a = f.panel();
  f.pointer(a.surface, 'pointerenter');
  f.settle();
  f.host.dispatchEvent(new Event('blur'));
  f.settle();
  assert.equal(a.target.style.transform, 'rotateX(0.000deg) rotateY(0.000deg)');
  f.pointer(a.surface, 'pointermove');
  assert.equal(f.frames.size, 0);
  a.stop();
});
