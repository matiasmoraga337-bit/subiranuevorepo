import { defineStore } from 'pinia'
import { fixedEvents, randomEvents, minigameEvents } from '../data/events.js'
import { api } from '../api/index.js'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export const useGameStore = defineStore('game', {
  state: () => ({
    day: 0,
    phase: 'menu',
    food: 6,
    water: 4,
    health: 80,
    morale: 70,
    currentEvent: null,
    currentSegment: 0,
    decisionResult: null,
    flags: {
      refugees: false,
    },
    usedRandomEvents: [],
    gameOverReason: null,
    journal: [],
    serverGameId: null,
    aiLoading: false,
  }),

  getters: {
    maxStat: () => 20,
    maxHealth: () => 100,
    maxMorale: () => 100,
    isGameOver() {
      return this.health <= 0 || this.morale <= 0
    },
    isVictory() {
      return this.day > 15 && this.health > 0 && this.morale > 0
    },
    survivalDays() {
      return this.day
    },
    
  },

  actions: {
    startGame() {
      this.day = 0
      this.phase = 'intro'
      this.food = 6
      this.water = 4
      this.health = 80
      this.morale = 70
      this.currentEvent = fixedEvents[0]
      this.currentSegment = 0
      this.decisionResult = null
      this.flags = { refugees: false }
      this.usedRandomEvents = []
      this.gameOverReason = null
      this.journal = []
    },

    addToJournal(entry) {
      this.journal.push({
        day: this.day,
        ...entry,
        timestamp: Date.now(),
      })
    },

    

    advanceSegment() {
      if (this.serverGameId) {
        this.advanceSegmentServer()
        return
      }

      if (!this.currentEvent) return

      const isLastSegment = this.currentSegment >= this.currentEvent.segments.length - 1

      if (isLastSegment) {
        if (this.currentEvent.type === 'intro') {
          this.day = 1
          this.advanceDay()
        } else if (this.currentEvent.decisions) {
          this.phase = 'decision'
        } else {
          if (this.currentEvent.effects) {
            this.applyEffects(this.currentEvent.effects)
          }
          this.addToJournal({
            type: 'evento',
            title: this.currentEvent.title || 'Evento aleatorio',
            description: this.currentEvent.segments.map((s) => s.text).join(' '),
          })
          this.day++
          this.advanceDay()
        }
      } else {
        this.currentSegment++
      }
    },

    makeDecision(decisionIndex) {
      if (this.serverGameId) {
        this.makeDecisionServer(decisionIndex)
        return
      }

      const event = this.currentEvent
      const decision = event.decisions[decisionIndex]

      let resultText = ''
      let wasSuccess = true

      if (decision.random) {
        const success = Math.random() < decision.successRate
        const effects = success ? decision.effects.success : decision.effects.failure
        this.applyEffects(effects)
        resultText = success ? decision.successResult : decision.failureResult
        wasSuccess = success
      } else {
        this.applyEffects(decision.effects)
        if (decision.setsFlag) {
          this.flags[decision.setsFlag] = true
        }
        resultText = decision.result
      }

      const journalEntry = {
        type: 'decision',
        title: event.title,
        decision: decision.text,
        result: resultText,
        success: wasSuccess,
        effects: decision.random
          ? (wasSuccess ? decision.effects.success : decision.effects.failure)
          : decision.effects,
      }

      this.addToJournal(journalEntry)

      this.decisionResult = {
        text: resultText,
        success: wasSuccess,
      }

      this.phase = 'result'
    },

    applyEffects(effects) {
      if (effects.food) this.food = clamp(this.food + effects.food, 0, this.maxStat)
      if (effects.water) this.water = clamp(this.water + effects.water, 0, this.maxStat)
      if (effects.health) this.health = clamp(this.health + effects.health, 0, this.maxHealth)
      if (effects.morale) this.morale = clamp(this.morale + effects.morale, 0, this.maxMorale)
    },

    eventMatches(event) {
      if (!event) return false
      if (event.requiresFlag && !this.flags[event.requiresFlag]) return false
      if (event.requiresNoFlag && this.flags[event.requiresNoFlag]) return false
      if (event.requiresFlags) {
        for (const flag of event.requiresFlags) {
          if (!this.flags[flag]) return false
        }
      }
      return true
    },

    resolveFixedEvent() {
      const entry = fixedEvents[this.day]
      if (!entry) return null
      if (Array.isArray(entry)) {
        return entry.find((e) => this.eventMatches(e)) || null
      }
      if (this.eventMatches(entry)) return entry
      return null
    },

    advanceDay() {
      if (this.isGameOver || this.isVictory) {
        this.phase = this.isVictory ? 'victory' : 'gameover'
        return
      }

      if (this.day > 15) {
        this.phase = 'victory'
        return
      }

      this.applyDailyConsumption()

      if (this.isGameOver) {
        this.gameOverReason = this.health <= 0 ? 'health' : 'morale'
        this.phase = 'gameover'
        return
      }

      const minigame = minigameEvents[this.day]
      if (minigame) {
        this.currentEvent = { ...minigame }
        this.phase = 'minigame'
        this.currentSegment = 0
        this.decisionResult = null
        return
      }

      const fixedEvent = this.resolveFixedEvent()

      if (fixedEvent) {
        this.currentEvent = fixedEvent
        this.phase = 'story'
        this.currentSegment = 0
        this.decisionResult = null
      } else {
        this.loadRandomEvent()
      }
    },

    applyDailyConsumption() {
      const foodCost = 1
      const waterCost = 1

      this.food = clamp(this.food - foodCost, 0, this.maxStat)
      this.water = clamp(this.water - waterCost, 0, this.maxStat)

      this.health = clamp(this.health - 4, 0, this.maxHealth)
      this.morale = clamp(this.morale - 3, 0, this.maxMorale)

      if (this.food <= 0) {
        this.health = clamp(this.health - 4, 0, this.maxHealth)
      }
      if (this.water <= 0) {
        this.health = clamp(this.health - 6, 0, this.maxHealth)
      }
      if (this.food <= 0 && this.water <= 0) {
        this.morale = clamp(this.morale - 2, 0, this.maxMorale)
      }
    },

    loadRandomEvent() {
      if (this.usedRandomEvents.length >= randomEvents.length) {
        this.usedRandomEvents = []
      }

      let randomIndex
      let attempts = 0
      do {
        randomIndex = Math.floor(Math.random() * randomEvents.length)
        attempts++
      } while (this.usedRandomEvents.includes(randomIndex) && attempts < randomEvents.length)

      this.usedRandomEvents.push(randomIndex)

      const event = randomEvents[randomIndex]
      this.currentEvent = {
        ...event,
        day: this.day,
        type: 'random',
      }
      this.phase = 'story'
      this.currentSegment = 0
      this.decisionResult = null
    },

    continueAfterResult() {
      if (this.serverGameId) {
        this.continueAfterResultServer()
        return
      }

      this.decisionResult = null
      this.day++

      if (this.isGameOver) {
        this.gameOverReason = this.health <= 0 ? 'health' : 'morale'
        this.phase = 'gameover'
        return
      }

      if (this.isVictory) {
        this.phase = 'victory'
        return
      }

      this.advanceDay()
    },

    completeMinigame(result) {
      if (this.serverGameId) {
        this.completeMinigameServer(result)
        return
      }

      const event = this.currentEvent
      const outcome = result === 'win' ? event.win : event.lose

      this.applyEffects(outcome)

      this.addToJournal({
        type: 'minijuego',
        title: event.title,
        description: outcome.message,
        effects: outcome,
      })

      this.decisionResult = null
      this.day++

      if (this.isGameOver) {
        this.gameOverReason = this.health <= 0 ? 'health' : 'morale'
        this.phase = 'gameover'
        return
      }

      if (this.isVictory) {
        this.phase = 'victory'
        return
      }

      this.advanceDay()
    },

    applyServerState(serverState) {
      if (!serverState) return
      this.day = serverState.day ?? this.day
      this.phase = serverState.phase ?? this.phase
      this.food = serverState.food ?? this.food
      this.water = serverState.water ?? this.water
      this.health = serverState.health ?? this.health
      this.morale = serverState.morale ?? this.morale
      this.currentEvent = serverState.currentEvent ?? this.currentEvent
      this.currentSegment = serverState.currentSegment ?? this.currentSegment
      this.decisionResult = serverState.decisionResult ?? this.decisionResult
      this.flags = serverState.flags ?? this.flags
      this.journal = serverState.journal ?? this.journal
      this.gameOverReason = serverState.gameOverReason ?? this.gameOverReason
    },

    async startGameServer() {
      try {
        const data = await api.games.create()
        this.serverGameId = data._id
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al crear partida en servidor:', err)
        this.startGame()
      }
    },

    async startGameOnServer() {
      if (!this.serverGameId) return
      try {
        const data = await api.games.start(this.serverGameId)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al iniciar partida en servidor:', err)
      }
    },

    async advanceSegmentServer() {
      if (!this.serverGameId) return
      try {
        const data = await api.games.advanceSegment(this.serverGameId)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al avanzar segmento en servidor:', err)
      }
    },

    async makeDecisionServer(index) {
      if (!this.serverGameId) return
      try {
        const data = await api.games.makeDecision(this.serverGameId, index)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al tomar decision en servidor:', err)
      }
    },

    async continueAfterResultServer() {
      if (!this.serverGameId) return
      this.aiLoading = true
      try {
        const data = await api.games.continue(this.serverGameId)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al continuar en servidor:', err)
      } finally {
        this.aiLoading = false
      }
    },

    async completeMinigameServer(result) {
      if (!this.serverGameId) return
      try {
        const data = await api.games.completeMinigame(this.serverGameId, result)
        this.applyServerState(data)
      } catch (err) {
        console.error('Error al completar minijuego en servidor:', err)
      }
    },

    reset() {
      this.serverGameId = null
      this.$reset()
    },
  },
})
