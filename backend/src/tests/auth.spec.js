import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'

describe('Auth Utilities', () => {
  it('generates a valid JWT token', () => {
    const secret = 'test-secret'
    const userId = '507f1f77bcf86cd799439011'
    const token = jwt.sign({ userId }, secret, { expiresIn: '7d' })
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('decodes a valid token correctly', () => {
    const secret = 'test-secret'
    const userId = '507f1f77bcf86cd799439011'
    const token = jwt.sign({ userId }, secret, { expiresIn: '7d' })
    const decoded = jwt.verify(token, secret)
    expect(decoded.userId).toBe(userId)
  })

  it('rejects an invalid token', () => {
    expect(() => jwt.verify('invalid-token', 'secret')).toThrow()
  })

  it('rejects a token with wrong secret', () => {
    const token = jwt.sign({ userId: 'abc' }, 'secret-a', { expiresIn: '7d' })
    expect(() => jwt.verify(token, 'secret-b')).toThrow()
  })

  it('rejects an expired token', () => {
    const token = jwt.sign({ userId: 'abc' }, 'secret', { expiresIn: '0s' })
    expect(() => jwt.verify(token, 'secret')).toThrow()
  })
})
