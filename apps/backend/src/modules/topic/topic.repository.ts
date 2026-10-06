import { ITopicMetadata, SupportedTopicId } from "../../shared/contracts";
import { TOPIC_CATALOG } from "./topic.constants";
import { TopicKnowledgeModel } from "./topic.model";

export type TopicRepositoryResult = ITopicMetadata & {
  provenance?: {
    sourceType?: string;
    sourceName?: string;
    sourceReference?: string;
    retrievedAt?: string;
    verifiedAt?: string;
  };
  verificationStatus?: "VERIFIED" | "UNVERIFIED" | "REJECTED";
};

class TopicRepository {
  async getVerifiedTopics(): Promise<TopicRepositoryResult[]> {
    try {
      const docs = await TopicKnowledgeModel.find({ verificationStatus: "VERIFIED" }).lean();
      if (docs.length > 0) {
        return docs.map((doc) => ({
          id: doc.topicId as SupportedTopicId,
          name: doc.name,
          category: doc.category,
          summary: doc.summary,
          supportedOperations: doc.supportedOperations,
          defaultInitialValues: doc.defaultInitialValues,
          complexity: {
            time: doc.complexity?.time ?? "N/A",
            space: doc.complexity?.space ?? "N/A",
          },
          provenance: {
            sourceType: doc.provenance?.sourceType,
            sourceName: doc.provenance?.sourceName,
            sourceReference: doc.provenance?.sourceReference,
            retrievedAt: doc.provenance?.retrievedAt?.toISOString?.(),
            verifiedAt: doc.provenance?.verifiedAt?.toISOString?.(),
          },
          verificationStatus: doc.verificationStatus,
        }));
      }
    } catch (_error) {
      // MongoDB is optional during local runtime. Fall back to the canonical catalog.
    }

    return Object.values(TOPIC_CATALOG);
  }

  async getTopic(topicId: SupportedTopicId): Promise<TopicRepositoryResult | undefined> {
    try {
      const doc = await TopicKnowledgeModel.findOne({ topicId, verificationStatus: "VERIFIED" }).lean();
      if (doc) {
        return {
          id: doc.topicId as SupportedTopicId,
          name: doc.name,
          category: doc.category,
          summary: doc.summary,
          supportedOperations: doc.supportedOperations,
          defaultInitialValues: doc.defaultInitialValues,
          complexity: {
            time: doc.complexity?.time ?? "N/A",
            space: doc.complexity?.space ?? "N/A",
          },
          provenance: {
            sourceType: doc.provenance?.sourceType,
            sourceName: doc.provenance?.sourceName,
            sourceReference: doc.provenance?.sourceReference,
            retrievedAt: doc.provenance?.retrievedAt?.toISOString?.(),
            verifiedAt: doc.provenance?.verifiedAt?.toISOString?.(),
          },
          verificationStatus: doc.verificationStatus,
        };
      }
    } catch (_error) {
      // grace fallback
    }

    return Object.values(TOPIC_CATALOG).find((topic) => topic.id === topicId);
  }

  async seedVerifiedCatalog(): Promise<void> {
    try {
      const catalog = Object.values(TOPIC_CATALOG).map((topic) => ({
        topicId: topic.id,
        name: topic.name,
        category: topic.category,
        summary: topic.summary,
        supportedOperations: topic.supportedOperations,
        defaultInitialValues: topic.defaultInitialValues,
        complexity: topic.complexity,
        provenance: {
          sourceType: "LOCAL_CATALOG",
          sourceName: "CORVIZ canonical catalog",
          sourceReference: "internal-catalog",
          retrievedAt: new Date(),
          verifiedAt: new Date(),
        },
        verificationStatus: "VERIFIED",
      }));

      await TopicKnowledgeModel.deleteMany({});
      await TopicKnowledgeModel.insertMany(catalog);
    } catch (_error) {
      // leave canonical catalog in memory when Mongo is unavailable
    }
  }
}

export const topicRepository = new TopicRepository();
