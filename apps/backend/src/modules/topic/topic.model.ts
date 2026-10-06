import { Schema, model } from "mongoose";

import { SUPPORTED_TOPIC_IDS } from "../../shared/contracts";

const topicProvenanceSchema = new Schema(
  {
    sourceType: { type: String, default: "LOCAL_CATALOG" },
    sourceName: { type: String, default: "CORVIZ" },
    sourceReference: { type: String, default: "internal-catalog" },
    retrievedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const topicKnowledgeSchema = new Schema(
  {
    topicId: {
      type: String,
      required: true,
      enum: Object.values(SUPPORTED_TOPIC_IDS),
    },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "DATA_STRUCTURE",
        "SEARCH_ALGORITHM",
        "SORT_ALGORITHM",
        "ALGORITHMIC_TECHNIQUE",
        "GRAPH_ALGORITHM",
      ],
    },
    summary: { type: String, required: true },
    supportedOperations: { type: [String], required: true },
    defaultInitialValues: { type: [Schema.Types.Mixed], required: true },
    complexity: {
      time: { type: String, required: true },
      space: { type: String, required: true },
    },
    provenance: { type: topicProvenanceSchema, required: true },
    verificationStatus: {
      type: String,
      enum: ["VERIFIED", "UNVERIFIED", "REJECTED"],
      default: "VERIFIED",
    },
  },
  {
    timestamps: true,
    collection: "topic_knowledge",
  }
);

export const TopicKnowledgeModel = model("TopicKnowledge", topicKnowledgeSchema);
