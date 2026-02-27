import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const PASSWORD_SALT_BYTES = 16
const SESSION_TOKEN_BYTES = 32
const TOTP_STEP_SECONDS = 30
const TOTP_DIGITS = 6

function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  const clean = base32.replace(/=+$/, '').toUpperCase().replace(/\s+/g, '')
  for (const char of clean) {
    const val = alphabet.indexOf(char)
    if (val === -1) {
      throw new Error('Invalid base32 character')
    }
    bits += val.toString(2).padStart(5, '0')
  }

  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }

  return Buffer.from(bytes)
}

export function generateBase32Secret(length = 32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bytes = randomBytes(length)
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join('')
}

function hotp(secret, counter) {
  const key = base32Decode(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buffer.writeUInt32BE(counter & 0xffffffff, 4)

  const hmac = createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return (code % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0')
}

export function verifyTotp(secret, code, window = 1) {
  if (!/^\d{6}$/.test(code)) {
    return false
  }

  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS)
  for (let i = -window; i <= window; i++) {
    const candidate = hotp(secret, counter + i)
    const a = Buffer.from(candidate)
    const b = Buffer.from(code)
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return true
    }
  }
  return false
}

export function buildOtpAuthUri(email, secret, issuer = 'RedAmon IAM') {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedLabel = encodeURIComponent(`${issuer}:${email}`)
  return `otpauth://totp/${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`
}

export function hashPassword(password) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex')
  const digest = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${digest}`
}

export function verifyPassword(password, hashed) {
  const [salt, digest] = hashed.split(':')
  if (!salt || !digest) {
    return false
  }
  const candidate = scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(digest)
  const b = Buffer.from(candidate)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function generateSessionToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString('hex')
}

export function hashToken(token) {
  return createHmac('sha256', process.env.AUTH_TOKEN_PEPPER || 'redamon-default-pepper').update(token).digest('hex')
}

export function generateTemporaryPassword(length = 20) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = randomBytes(length)
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}
