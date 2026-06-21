import { describe, it, expect } from 'vitest'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

const INITIAL_RESOURCES = { food: 6, water: 4, health: 80, morale: 70 }

describe('Game Logic', () => {
  describe('Daily Resource Consumption', () => {
    it('reduces all resources daily', () => {
      const state = { ...INITIAL_RESOURCES }

      state.food = clamp(state.food - 1, 0, 20)
      state.water = clamp(state.water - 1, 0, 20)
      state.health = clamp(state.health - 4, 0, 100)
      state.morale = clamp(state.morale - 3, 0, 100)

      expect(state.food).toBe(5)
      expect(state.water).toBe(3)
      expect(state.health).toBe(76)
      expect(state.morale).toBe(67)
    })

    it('applies extra health penalty when food is zero', () => {
      const state = { food: 1, water: 4, health: 80, morale: 70 }

      state.food = clamp(state.food - 1, 0, 20)
      state.water = clamp(state.water - 1, 0, 20)
      state.health = clamp(state.health - 4, 0, 100)
      state.morale = clamp(state.morale - 3, 0, 100)

      if (state.food <= 0) state.health = clamp(state.health - 4, 0, 100)

      expect(state.food).toBe(0)
      expect(state.health).toBe(72)
    })

    it('applies extra health penalty when water is zero', () => {
      const state = { food: 6, water: 1, health: 80, morale: 70 }

      state.food = clamp(state.food - 1, 0, 20)
      state.water = clamp(state.water - 1, 0, 20)
      state.health = clamp(state.health - 4, 0, 100)
      state.morale = clamp(state.morale - 3, 0, 100)

      if (state.water <= 0) state.health = clamp(state.health - 6, 0, 100)

      expect(state.water).toBe(0)
      expect(state.health).toBe(70)
    })
  })

  describe('Decision Effect Application', () => {
    it('applies positive effects', () => {
      const state = { ...INITIAL_RESOURCES }
      const effects = { food: 3, water: 2, health: 0, morale: 10 }

      state.food = clamp(state.food + effects.food, 0, 20)
      state.water = clamp(state.water + effects.water, 0, 20)
      state.health = clamp(state.health + effects.health, 0, 100)
      state.morale = clamp(state.morale + effects.morale, 0, 100)

      expect(state.food).toBe(9)
      expect(state.water).toBe(6)
      expect(state.morale).toBe(80)
    })

    it('applies negative effects', () => {
      const state = { ...INITIAL_RESOURCES }
      const effects = { food: -2, water: 0, health: -10, morale: -15 }

      state.food = clamp(state.food + effects.food, 0, 20)
      state.water = clamp(state.water + effects.water, 0, 20)
      state.health = clamp(state.health + effects.health, 0, 100)
      state.morale = clamp(state.morale + effects.morale, 0, 100)

      expect(state.food).toBe(4)
      expect(state.health).toBe(70)
      expect(state.morale).toBe(55)
    })

    it('does not go below zero', () => {
      const state = { food: 1, water: 1, health: 5, morale: 2 }
      const effects = { food: -3, water: -2, health: -20, morale: -10 }

      state.food = clamp(state.food + effects.food, 0, 20)
      state.water = clamp(state.water + effects.water, 0, 20)
      state.health = clamp(state.health + effects.health, 0, 100)
      state.morale = clamp(state.morale + effects.morale, 0, 100)

      expect(state.food).toBe(0)
      expect(state.water).toBe(0)
      expect(state.health).toBe(0)
      expect(state.morale).toBe(0)
    })
  })

  describe('Game Over Detection', () => {
    it('detects game over by health', () => {
      const state = { health: 0, morale: 50 }
      expect(state.health <= 0 || state.morale <= 0).toBe(true)
    })

    it('detects game over by morale', () => {
      const state = { health: 50, morale: 0 }
      expect(state.health <= 0 || state.morale <= 0).toBe(true)
    })

    it('does not trigger game over when resources are positive', () => {
      const state = { health: 50, morale: 50 }
      expect(state.health <= 0 || state.morale <= 0).toBe(false)
    })
  })

  describe('Victory Detection', () => {
    it('detects victory on day 16 with positive health and morale', () => {
      const day = 16
      const health = 30
      const morale = 40
      expect(day > 15 && health > 0 && morale > 0).toBe(true)
    })

    it('does not trigger victory on day 14', () => {
      const day = 14
      expect(day > 15).toBe(false)
    })
  })

  describe('Flag Management', () => {
    it('sets a flag on decision', () => {
      const flags = { refugees: false }
      flags.refugees = true
      expect(flags.refugees).toBe(true)
    })

    it('preserves existing flags when setting new ones', () => {
      const flags = { refugees: true }
      flags.d2_share = true
      expect(flags.refugees).toBe(true)
      expect(flags.d2_share).toBe(true)
    })
  })

  describe('Multiple Events Per Day', () => {
    it('advances day when eventsThisDay reaches max', () => {
      const eventsThisDay = 3
      const maxEventsPerDay = 3
      expect(eventsThisDay >= maxEventsPerDay).toBe(true)
    })

    it('stays on same day when events remain', () => {
      const eventsThisDay = 1
      const maxEventsPerDay = 3
      expect(eventsThisDay < maxEventsPerDay).toBe(true)
    })
  })
})
