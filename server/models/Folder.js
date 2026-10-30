import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    isTrashed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

FolderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.type = 'folder';
    ret.filename = doc.name; // For MyStorage display compatibility
    ret.size = 0;
    return ret;
  },
});

export default mongoose.model('Folder', FolderSchema);

