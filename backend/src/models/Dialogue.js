import mongoose from 'mongoose'

const dialogueSchema = new mongoose.Schema({
  contextHash: { type: String, required: true, unique: true, index: true },
  prompt: { type: String, required: true },
  response: { type: mongoose.Schema.Types.Mixed, required: true },
  model: { type: String, default: 'gemini-2.5-flash' },
  tokensUsed: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model('Dialogue', dialogueSchema)
