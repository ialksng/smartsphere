import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'ai', 'system'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: 'text',
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', ChatMessageSchema);

