import { Schema, models, model, Model } from "mongoose";

export interface ISection {
  name: string;
  slug: string;
  cagesCount: number;
  cageButtonsCount: number;
  active: boolean;
}

const SectionSchema = new Schema<ISection>(
  {
    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    cagesCount: {
      type: Number,
      default: 15,
      min: 1,
    },

    cageButtonsCount: {
      type: Number,
      default: 24,
      min: 1,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Section: Model<ISection> =
  models.Section || model<ISection>("Section", SectionSchema);

export default Section;