import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPin, createPin, pinKey, readPin } from '../src/services/deviceLock.ts';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
}, configurable: true });

test('PIN is salted and hashed, scoped by account and verified without storing plaintext', async () => {
  await createPin('owner-a', '1234');
  await createPin('owner-b', '1234');
  assert.notEqual(readPin('owner-a')?.hash, readPin('owner-b')?.hash);
  assert.equal(values.get(pinKey('owner-a'))?.includes('1234'), false);
  assert.equal((await checkPin('owner-a', '1234')).ok, true);
  assert.equal((await checkPin('owner-a', '9999')).ok, false);
  assert.equal(readPin('unknown'), null);
});
test('five failures persist a cooldown which survives a new read, then a correct code clears it', async () => {
  await createPin('limited', '4567');
  const now = Date.now();
  for (let attempt = 0; attempt < 5; attempt++) await checkPin('limited', '0000', now);
  assert.equal(readPin('limited')?.blockedUntil, now + 30_000);
  assert.equal((await checkPin('limited', '4567', now + 1)).ok, false);
  assert.equal((await checkPin('limited', '4567', now + 30_001)).ok, true);
  assert.equal(readPin('limited')?.failures, 0);
});
test('invalid PINs and corrupt records cannot silently create an unlocked device', async () => {
  await assert.rejects(createPin('invalid', '123'), /fyra/);
  values.set(pinKey('corrupt'), '{broken');
  assert.throws(() => readPin('corrupt'), /kunde inte läsas/);
});
