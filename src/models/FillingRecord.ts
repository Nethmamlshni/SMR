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

  shift: "Day" | "Night";

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
      index: true,
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
      index: true,
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
      enum: ["Day", "Night"],
      required: true,
    },

    cageName: {
      type: String,
      default: "",
    },

    anotherCageName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/*
  IMPORTANT:

  Removed unique index because:
  Same date + section + cage may have
  multiple Additional Filling records.

  If you keep the unique index,
  MongoDB will reject duplicates.
*/

const FillingRecord: Model<IFillingRecord> =
  models.FillingRecord ||
  model<IFillingRecord>(
    "FillingRecord",
    FillingRecordSchema
  );

export default FillingRecord;