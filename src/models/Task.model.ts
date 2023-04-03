import mongoose from 'mongoose';
import { IUser } from './User.model';

export interface ITask extends mongoose.Document {
  content: string;
  user: IUser['_id'];
}

const TaskSchema = new mongoose.Schema<ITask>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model<ITask>('Task', TaskSchema);
export default Task;
