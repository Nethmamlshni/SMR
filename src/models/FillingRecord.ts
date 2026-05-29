import { Schema, models, model, Model, Types } from "mongoose";

export interface IFillingRecord {
  date: string;

  sectionId: Types.ObjectId;

  sectionName: string;

  fillingType: "next-day" | "additional";

  cageNumber: number;

  selectedCages: number[];

  cageButtonsCount: number;

  rawWeight: number;

  coconutType: "Small" | "Red" | "Black";

  deduction: number;

  finalWeight: number;

  coconutCount: number;

  createdBy: Types.ObjectId;

  createdByName: string;

  supervisorName: string;

  shift: "day" | "night";

  cageName: string;

  anotherCageName: string;
}

const FillingRecordSchema = new Schema<IFillingRecord>(
  {
    date: {
      type: String,
      required: true,
      index: true,
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    sectionName: {
      type: String,
      required: true,
    },

    fillingType: {
      type: String,
      enum: ["next-day", "additional"],
      required: true,
      index: true,
    },

    cageNumber: {
      type: Number,
      required: true,
    },

    selectedCages: [
      {
        type: Number,
      },
    ],

    cageButtonsCount: {
      type: Number,
      required: true,
    },

    rawWeight: {
      type: Number,
      required: true,
    },

    coconutType: {
      type: String,
      enum: ["Small", "Red", "Black"],
      required: true,
    },

    deduction: {
      type: Number,
      required: true,
    },

    finalWeight: {
      type: Number,
      required: true,
    },

    coconutCount: {
      type: Number,
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdByName: {
      type: String,
      required: true,
    },

    supervisorName: {
      type: String,
      required: true,
    },
    shift: {
      type: String,
      enum: ["day", "night"],
      required: true,
    },
    cageName: {
      type: String,
    },
    anotherCageName: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

FillingRecordSchema.index(
  {
    date: 1,
    sectionId: 1,
    fillingType: 1,
    cageNumber: 1,
  },
  {
    unique: true,
  }
);

const FillingRecord: Model<IFillingRecord> =
  models.FillingRecord ||
  model<IFillingRecord>("FillingRecord", FillingRecordSchema);

export default FillingRecord;