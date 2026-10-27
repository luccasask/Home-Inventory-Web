import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from '../src/domain/authErrors.ts';

test('email quota errors explain the sending limit without blaming the address or blocking an existing code', () => {
  const message = authErrorMessage({ status: 429, code: 'over_email_send_rate_limit' }, 'send');
  assert.match(message, /gränsen/i);
  assert.match(message, /timme/);
  assert.match(message, /redan fått en kod/);
  assert.doesNotMatch(message, /Kontrollera adressen/);
});
test('delivery configuration errors do not incorrectly advise repeated sending', () => {
  assert.match(authErrorMessage({code:'email_address_not_authorized'}, 'send'), /mejltjänsten/i);
  assert.match(authErrorMessage({code:'email_provider_disabled'}, 'send'), /inställningar/);
});
test('expired codes, missing browser verifiers, and connectivity failures have separate recovery instructions', () => {
  assert.match(authErrorMessage({code:'otp_expired'}, 'verify'), /senaste koden/);
  assert.match(authErrorMessage({code:'bad_code_verifier'}, 'session'), /engångskod/);
  assert.match(authErrorMessage(new TypeError('Failed to fetch'), 'send'), /internetanslutningen/);
});
