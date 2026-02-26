import test from 'node:test'
import assert from 'node:assert/strict'
import {
  hashPassword,
  verifyPassword,
  generateBase32Secret,
  verifyTotp,
  buildOtpAuthUri,
  generateSessionToken,
  hashToken,
} from '../src/lib/auth/security.js'

test('hashPassword + verifyPassword works', () => {
  const hashed = hashPassword('StrongPassword#123')
  assert.equal(verifyPassword('StrongPassword#123', hashed), true)
  assert.equal(verifyPassword('wrong-password', hashed), false)
})

test('totp secret and URI generation', () => {
  const secret = generateBase32Secret(20)
  const uri = buildOtpAuthUri('analyst@redamon.local', secret)
  assert.ok(uri.startsWith('otpauth://totp/'))
  assert.equal(verifyTotp(secret, '000000'), false)
})

test('session token hashing is deterministic', () => {
  const token = generateSessionToken()
  assert.equal(token.length > 10, true)
  assert.equal(hashToken(token), hashToken(token))
})
