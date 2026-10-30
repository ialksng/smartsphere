import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: 'text/plain',
    },
    size: {
      type: Number,
      default: 0,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isTrashed: {
      type: Boolean,
      default: false,
    },
    cloudProvider: {
      type: String,
      default: 'local',
    },
    externalId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual to populate type: 'file' for MyStorage grid compatibility
DocumentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.type = 'file';
    return ret;
  },
});

export default mongoose.model('Document', DocumentSchema);

