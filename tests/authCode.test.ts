import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmailCode, isEmailCode } from '../src/domain/authCode.ts';

test('eight-digit email codes retain all digits and leading zeroes, including formatted pastes', () => {
  assert.equal(normalizeEmailCode('0123 4567'), '01234567');
  assert.equal(normalizeEmailCode('01234567'), '01234567');
  assert.equal(isEmailCode(normalizeEmailCode('0123-4567')), true);
});
test('both supported lengths are accepted but PINs and incomplete codes cannot be submitted', () => {
  assert.equal(isEmailCode('123456'), true);
  assert.equal(isEmailCode('12345678'), true);
  for (const value of ['', '1234', '1234567', '123456789', 'abcd1234']) assert.equal(isEmailCode(value), false);
});
