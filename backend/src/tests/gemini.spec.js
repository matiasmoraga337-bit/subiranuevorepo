import { describe, it, expect } from 'vitest'
import { clamp, generateContextHash, buildGamePrompt } from '../services/gemini.js'

describe('gemini service', () => {
  describe('clamp', () => {
    it('clamps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('clamps value below minimum', () => {
      expect(clamp(-5, 0, 100)).toBe(0)
    })

    it('clamps value above maximum', () => {
      expect(clamp(150, 0, 100)).toBe(100)
    })

    it('clamps at exact boundaries', () => {
      expect(clamp(0, 0, 100)).toBe(0)
      expect(clamp(100, 0, 100)).toBe(100)
    })
  })

  describe('generateContextHash', () => {
    it('generates a hash string', () => {
      const hash = generateContextHash(5, { refugees: true }, 8, 6, 75, 65)
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash).toHaveLength(64)
    })

    it('generates different hashes for different contexts', () => {
      const hash1 = generateContextHash(1, {}, 6, 4, 80, 70)
      const hash2 = generateContextHash(5, { refugees: true }, 2, 1, 50, 40)
      expect(hash1).not.toBe(hash2)
    })

    it('generates same hash for identical contexts', () => {
      const hash1 = generateContextHash(3, { d3_super: true }, 10, 7, 85, 72)
      const hash2 = generateContextHash(3, { d3_super: true }, 10, 7, 85, 72)
      expect(hash1).toBe(hash2)
    })
  })

  describe('buildGamePrompt', () => {
    it('builds a prompt with game state', () => {
      const prompt = buildGamePrompt(5, { refugees: true, d3_super: true }, 8, 6, 75, 65, 'ya exploraste')
      expect(prompt).toContain('15 Días')
      expect(prompt).toContain('día 5')
      expect(prompt).toContain('Comida: 8/20')
      expect(prompt).toContain('refugees')
      expect(prompt).toContain('d3_super')
      expect(prompt).toContain('ya exploraste')
      expect(prompt).toContain('JSON')
    })

    it('handles empty flags', () => {
      const prompt = buildGamePrompt(1, {}, 6, 4, 80, 70, '')
      expect(prompt).toContain('ninguno')
    })
  })
})
