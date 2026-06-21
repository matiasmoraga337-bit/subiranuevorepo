import mongoose from 'mongoose'

const journalEntrySchema = new mongoose.Schema({
  day: Number,
  type: { type: String, enum: ['evento', 'decision', 'minijuego'] },
  title: String,
  decision: String,
  result: String,
  description: String,
  effects: mongoose.Schema.Types.Mixed,
  success: Boolean,
  timestamp: { type: Date, default: Date.now },
})

const gameSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Number, default: 0 },
  phase: {
    type: String,
    enum: ['menu', 'intro', 'story', 'decision', 'result', 'minigame', 'victory', 'gameover'],
    default: 'intro',
  },
  food: { type: Number, default: 6 },
  water: { type: Number, default: 4 },
  health: { type: Number, default: 80 },
  morale: { type: Number, default: 70 },
  maxStat: { type: Number, default: 20 },
  maxHealth: { type: Number, default: 100 },
  maxMorale: { type: Number, default: 100 },
  flags: { type: mongoose.Schema.Types.Mixed, default: {} },
  journal: [journalEntrySchema],
  currentEvent: { type: mongoose.Schema.Types.Mixed, default: null },
  currentSegment: { type: Number, default: 0 },
  decisionResult: { type: mongoose.Schema.Types.Mixed, default: null },
  usedRandomEvents: [Number],
  gameOverReason: { type: String, default: null },
  eventsThisDay: { type: Number, default: 0 },
  maxEventsPerDay: { type: Number, default: 3 },
  status: {
    type: String,
    enum: ['active', 'won', 'lost'],
    default: 'active',
  },
}, { timestamps: true })

gameSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.__v
  return obj
}

export default mongoose.model('Game', gameSchema)
