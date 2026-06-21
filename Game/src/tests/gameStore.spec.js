import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../stores/gameStore.js'

describe('Game Store — nueva versión', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Estado inicial', () => {
    it('empieza en fase menu con día 0', () => {
      const store = useGameStore()
      expect(store.phase).toBe('menu')
      expect(store.day).toBe(0)
    })

    it('tiene recursos iniciales correctos', () => {
      const store = useGameStore()
      expect(store.food).toBe(6)
      expect(store.water).toBe(4)
      expect(store.health).toBe(80)
      expect(store.morale).toBe(70)
    })

    it('diario empieza vacío', () => {
      const store = useGameStore()
      expect(store.journal).toHaveLength(0)
    })
  })

  describe('startGame()', () => {
    it('inicia el juego en fase intro y carga el evento del día 0', () => {
      const store = useGameStore()
      store.startGame()
      expect(store.phase).toBe('intro')
      expect(store.currentEvent).not.toBeNull()
      expect(store.currentEvent.title).toBe('ALERTA NACIONAL')
      expect(store.currentSegment).toBe(0)
    })

    it('resetea todos los valores antes de empezar', () => {
      const store = useGameStore()
      store.food = 2
      store.health = 50
      store.gameOverReason = 'health'
      store.journal.push({ test: true })

      store.startGame()

      expect(store.food).toBe(6)
      expect(store.health).toBe(80)
      expect(store.gameOverReason).toBeNull()
      expect(store.journal).toHaveLength(0)
    })
  })

  describe('advanceSegment()', () => {
    it('avanza al siguiente segmento del evento', () => {
      const store = useGameStore()
      store.startGame()
      const initialSegment = store.currentSegment

      store.advanceSegment()

      expect(store.currentSegment).toBe(initialSegment + 1)
    })

    it('al terminar los segmentos de intro, avanza al día 1', () => {
      const store = useGameStore()
      store.startGame()

      // Avanzar todos los segmentos de intro (son 4)
      for (let i = 0; i < 4; i++) {
        store.advanceSegment()
      }

      expect(store.day).toBe(1)
      expect(store.phase).toBe('story')
    })
  })

  describe('makeDecision()', () => {
    it('aplica efectos positivos y cambia a fase result', () => {
      const store = useGameStore()
      // Simular que estamos en fase decision con el evento del día 1
      store.startGame()
      // Ir hasta día 1
      for (let i = 0; i < 4; i++) store.advanceSegment() // termina intro

      // Ahora en día 1, avanzar segmentos hasta decisiones
      while (store.phase !== 'decision') {
        if (store.phase === 'story') {
          store.advanceSegment()
        }
      }

      store.makeDecision(0) // Dejar entrar

      expect(store.phase).toBe('result')
      expect(store.decisionResult).not.toBeNull()
      expect(store.flags.refugees).toBe(true)
    })

    it('aplica efectos negativos al no dejar entrar (Día 1)', () => {
      const store = useGameStore()
      store.startGame()
      for (let i = 0; i < 4; i++) store.advanceSegment()
      while (store.phase !== 'decision') store.advanceSegment()

      const moraleBefore = store.morale
      store.makeDecision(1) // No abrir

      expect(store.phase).toBe('result')
      expect(store.morale).toBeLessThan(moraleBefore)
    })

    it('registra la decisión en el diario', () => {
      const store = useGameStore()
      store.startGame()
      for (let i = 0; i < 4; i++) store.advanceSegment()
      while (store.phase !== 'decision') store.advanceSegment()

      store.makeDecision(0)

      expect(store.journal).toHaveLength(1)
      expect(store.journal[0].type).toBe('decision')
    })
  })

  

  describe('applyDailyConsumption()', () => {
    it('consume 1 de comida y agua, y desgaste pasivo de -4 salud y -3 moral', () => {
      const store = useGameStore()
      store.food = 6
      store.water = 4
      store.health = 100
      store.morale = 100

      store.applyDailyConsumption()

      expect(store.food).toBe(5)
      expect(store.water).toBe(3)
      expect(store.health).toBe(96)
      expect(store.morale).toBe(97)
    })

    it('consume 1 de comida y agua también con refugiados', () => {
      const store = useGameStore()
      store.flags.refugees = true
      store.food = 6
      store.water = 4
      store.health = 100
      store.morale = 100

      store.applyDailyConsumption()

      expect(store.food).toBe(5)
      expect(store.water).toBe(3)
      expect(store.health).toBe(96)
      expect(store.morale).toBe(97)
    })

    it('si comida llega a 0, la salud baja por desgaste + sin comida', () => {
      const store = useGameStore()
      store.food = 1
      store.health = 100
      store.morale = 100

      store.applyDailyConsumption()

      expect(store.food).toBe(0)
      expect(store.health).toBe(92)
      expect(store.morale).toBe(97)
    })

    it('si agua llega a 0, la salud baja por desgaste + sin agua', () => {
      const store = useGameStore()
      store.water = 1
      store.health = 100
      store.morale = 100

      store.applyDailyConsumption()

      expect(store.water).toBe(0)
      expect(store.health).toBe(90)
      expect(store.morale).toBe(97)
    })

    it('sin comida Y sin agua, moral baja extra', () => {
      const store = useGameStore()
      store.food = 0
      store.water = 0
      store.health = 100
      store.morale = 100

      store.applyDailyConsumption()

      expect(store.health).toBe(86)
      expect(store.morale).toBe(95)
    })
  })

  describe('Getters', () => {
    it('isGameOver con salud 0', () => {
      const store = useGameStore()
      store.health = 0
      expect(store.isGameOver).toBe(true)
    })

    it('isGameOver con moral 0', () => {
      const store = useGameStore()
      store.morale = 0
      expect(store.isGameOver).toBe(true)
    })

    it('isVictory con día > 15', () => {
      const store = useGameStore()
      store.day = 16
      store.health = 50
      store.morale = 50
      expect(store.isVictory).toBe(true)
    })

    it('no es victoria si salud es 0 aunque día > 15', () => {
      const store = useGameStore()
      store.day = 16
      store.health = 0
      expect(store.isVictory).toBe(false)
    })
  })
})
