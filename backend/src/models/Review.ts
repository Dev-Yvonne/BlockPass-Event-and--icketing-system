import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.index({ user: 1, event: 1 }, { unique: true });

export default model<IReview>("Review", reviewSchema);
