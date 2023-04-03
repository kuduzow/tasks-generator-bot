import mongoose from 'mongoose';

export interface ILog extends mongoose.Document {
  author: string;
  message: string;
}

const LogSchema = new mongoose.Schema<ILog>(
  {
    author: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

const Log = mongoose.model<ILog>('Log', LogSchema);
export default Log;
