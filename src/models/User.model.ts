import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  telegramId: string;
  firstName: string;
  extraData: string;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
    },
    extraData: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
