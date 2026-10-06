import { SupportedTopicId, TopicCategory } from "../../shared/contracts";
import { TOPIC_CATALOG } from "../topic/topic.constants";
import { TopicKnowledgeModel } from "../topic/topic.model";

export type IngestionVerificationStatus = "VERIFIED" | "UNVERIFIED" | "REJECTED";

export interface IKnowledgeIngestionSource {
  sourceType: "PUBLIC_API" | "LOCAL_CATALOG" | "MANUAL_IMPORT";
  sourceName: string;
  sourceReference: string;
  retrievedAt: string;
}

export interface INormalizedTopicInput {
  topicId: string;
  name?: string;
  category?: TopicCategory;
  summary?: string;
  supportedOperations?: string[];
  defaultInitialValues?: unknown[];
  complexity?: {
    time?: string;
    space?: string;
  };
  provenance?: Partial<IKnowledgeIngestionSource>;
  verificationStatus?: IngestionVerificationStatus;
}

export interface INormalizedTopicRecord {
  id: SupportedTopicId;
  name: string;
  category: TopicCategory;
  summary: string;
  supportedOperations: string[];
  defaultInitialValues: unknown[];
  complexity: {
    time: string;
    space: string;
  };
  provenance: IKnowledgeIngestionSource;
  verificationStatus: IngestionVerificationStatus;
}

export interface IIngestionDecision {
  accepted: boolean;
  stored: boolean;
  reason?: string;
  topic?: INormalizedTopicRecord;
  canonicalSummary?: string;
}

export class KnowledgeIngestionService {
  private readonly publicSourceConfig: Record<
    SupportedTopicId,
    {
      wikipediaTitle: string;
      sourceName: string;
      sourceReference: string;
    }
  > = {
    STACK: {
      wikipediaTitle: "Stack_(abstract_data_type)",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)",
    },
    QUEUE: {
      wikipediaTitle: "Queue_(abstract_data_type)",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Queue_(abstract_data_type)",
    },
    BINARY_SEARCH: {
      wikipediaTitle: "Binary_search_algorithm",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Binary_search_algorithm",
    },
    BUBBLE_SORT: {
      wikipediaTitle: "Bubble_sort",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Bubble_sort",
    },
    LINEAR_SEARCH: {
      wikipediaTitle: "Linear_search",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Linear_search",
    },
    LINKED_LIST: {
      wikipediaTitle: "Linked_list",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Linked_list",
    },
    BST: {
      wikipediaTitle: "Binary_search_tree",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Binary_search_tree",
    },
    SELECTION_SORT: {
      wikipediaTitle: "Selection_sort",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Selection_sort",
    },
    TWO_POINTERS: {
      wikipediaTitle: "Two_pointers",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Two_pointers",
    },
    BFS: {
      wikipediaTitle: "Breadth-first_search",
      sourceName: "Wikipedia REST API",
      sourceReference: "https://en.wikipedia.org/wiki/Breadth-first_search",
    },
  };

  private readonly supportedCategories: TopicCategory[] = [
    "DATA_STRUCTURE",
    "SEARCH_ALGORITHM",
    "SORT_ALGORITHM",
    "ALGORITHMIC_TECHNIQUE",
    "GRAPH_ALGORITHM",
  ];

  public getPublicSourceReference(topicId: SupportedTopicId): { wikipediaTitle: string; sourceName: string; sourceReference: string } {
    const config = this.publicSourceConfig[topicId];
    if (!config) {
      throw new Error(`No public-source mapping is defined for topic "${topicId}".`);
    }

    return config;
  }

  async fetchPublicTopicSummary(topicId: SupportedTopicId): Promise<{ source: IKnowledgeIngestionSource; summary: string; title: string }> {
    const config = this.getPublicSourceReference(topicId);
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(config.wikipediaTitle)}`);

    if (!response.ok) {
      throw new Error(`Wikipedia fetch failed for ${topicId}: ${response.status}`);
    }

    const payload = (await response.json()) as {
      title?: string;
      extract?: string;
      type?: string;
      canonicalurl?: string;
    };

    const summary = payload.extract?.trim() || `${topicId} public knowledge summary.`;

    return {
      source: {
        sourceType: "PUBLIC_API",
        sourceName: config.sourceName,
        sourceReference: payload.canonicalurl ?? config.sourceReference,
        retrievedAt: new Date().toISOString(),
      },
      summary,
      title: payload.title || config.wikipediaTitle.replace(/_/g, " "),
    };
  }

  async importPublicTopicMetadata(topicId: SupportedTopicId): Promise<IIngestionDecision> {
    const canonical = TOPIC_CATALOG[topicId];
    if (!canonical) {
      return {
        accepted: false,
        stored: false,
        reason: `Topic "${topicId}" is not a supported CORVIZ topic and cannot be imported as canonical metadata.`,
      };
    }

    const fetched = await this.fetchPublicTopicSummary(topicId);
    const normalized = this.normalizeTopicPayload({
      topicId,
      name: canonical.name,
      category: canonical.category,
      summary: fetched.summary,
      supportedOperations: canonical.supportedOperations,
      defaultInitialValues: canonical.defaultInitialValues,
      complexity: canonical.complexity,
      provenance: {
        sourceType: fetched.source.sourceType,
        sourceName: fetched.source.sourceName,
        sourceReference: fetched.source.sourceReference,
        retrievedAt: fetched.source.retrievedAt,
      },
      verificationStatus: "UNVERIFIED",
    });

    if (!normalized.valid || !normalized.topic) {
      return {
        accepted: false,
        stored: false,
        reason: normalized.errors.join(" ") || "Public source metadata failed CORVIZ validation.",
        canonicalSummary: canonical.summary,
      };
    }

    if (TopicKnowledgeModel.db.readyState === 1) {
      try {
        const existingVerified = await TopicKnowledgeModel.findOne({ topicId, verificationStatus: "VERIFIED" }).lean();
        if (existingVerified) {
          const shadowRecord = await TopicKnowledgeModel.create({
            topicId,
            name: normalized.topic.name,
            category: normalized.topic.category,
            summary: normalized.topic.summary,
            supportedOperations: normalized.topic.supportedOperations,
            defaultInitialValues: normalized.topic.defaultInitialValues,
            complexity: normalized.topic.complexity,
            provenance: {
              sourceType: normalized.topic.provenance.sourceType,
              sourceName: normalized.topic.provenance.sourceName,
              sourceReference: normalized.topic.provenance.sourceReference,
              retrievedAt: normalized.topic.provenance.retrievedAt,
              verifiedAt: new Date(),
            },
            verificationStatus: "UNVERIFIED",
          });

          return {
            accepted: false,
            stored: !!shadowRecord,
            reason: `External metadata for ${topicId} was rejected because the canonical verified CORVIZ topic already exists and must not be overwritten. Provenance was stored as unverified metadata only.`,
            topic: normalized.topic,
            canonicalSummary: canonical.summary,
          };
        }

        const persisted = await TopicKnowledgeModel.create({
          topicId,
          name: normalized.topic.name,
          category: normalized.topic.category,
          summary: normalized.topic.summary,
          supportedOperations: normalized.topic.supportedOperations,
          defaultInitialValues: normalized.topic.defaultInitialValues,
          complexity: normalized.topic.complexity,
          provenance: {
            sourceType: normalized.topic.provenance.sourceType,
            sourceName: normalized.topic.provenance.sourceName,
            sourceReference: normalized.topic.provenance.sourceReference,
            retrievedAt: normalized.topic.provenance.retrievedAt,
            verifiedAt: new Date(),
          },
          verificationStatus: "UNVERIFIED",
        });

        return {
          accepted: true,
          stored: !!persisted,
          reason: "Public source metadata was accepted as unverified enrichment only; it does not become the canonical runtime knowledge source.",
          topic: normalized.topic,
          canonicalSummary: canonical.summary,
        };
      } catch (_error) {
        return {
          accepted: false,
          stored: false,
          reason: "Public-source ingestion failed due to MongoDB persistence availability or validation constraints.",
          topic: normalized.topic,
          canonicalSummary: canonical.summary,
        };
      }
    }

    return {
      accepted: false,
      stored: false,
      reason: `External metadata for ${topicId} was not persisted because MongoDB is unavailable; canonical CORVIZ metadata remains the authoritative source.`,
      topic: normalized.topic,
      canonicalSummary: canonical.summary,
    };
  }

  normalizeTopicPayload(raw: INormalizedTopicInput): { valid: boolean; topic?: INormalizedTopicRecord; errors: string[] } {
    const errors: string[] = [];

    if (!raw.topicId || !Object.values(TOPIC_CATALOG).some((topic) => topic.id === raw.topicId)) {
      errors.push(`Unsupported topic: ${raw.topicId ?? "missing"}.`);
    }

    if (!raw.name?.trim()) {
      errors.push("Topic name is required.");
    }

    if (!raw.category || !this.supportedCategories.includes(raw.category)) {
      errors.push("Topic category must be a supported CORVIZ category.");
    }

    if (!raw.summary?.trim()) {
      errors.push("Topic summary is required.");
    }

    if (!Array.isArray(raw.supportedOperations) || raw.supportedOperations.length === 0) {
      errors.push("At least one supported operation is required.");
    }

    if (!Array.isArray(raw.defaultInitialValues)) {
      errors.push("A default initial values array is required.");
    }

    if (!raw.complexity?.time?.trim() || !raw.complexity?.space?.trim()) {
      errors.push("Complexity metadata is required.");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const relatedCatalog = TOPIC_CATALOG[raw.topicId as SupportedTopicId];
    const resolution = relatedCatalog ?? {
      id: raw.topicId as SupportedTopicId,
      name: raw.name,
      category: raw.category!,
      summary: raw.summary,
      supportedOperations: raw.supportedOperations!,
      defaultInitialValues: raw.defaultInitialValues!,
      complexity: {
        time: raw.complexity!.time!,
        space: raw.complexity!.space!,
      },
    };

    const provenance = {
      sourceType: raw.provenance?.sourceType ?? "LOCAL_CATALOG",
      sourceName: raw.provenance?.sourceName ?? "CORVIZ canonical catalog",
      sourceReference: raw.provenance?.sourceReference ?? "internal-catalog",
      retrievedAt: raw.provenance?.retrievedAt ?? new Date().toISOString(),
    };

    const verificationStatus = raw.verificationStatus ?? "VERIFIED";

    return {
      valid: true,
      topic: {
        id: resolution.id,
        name: raw.name ?? resolution.name,
        category: raw.category ?? resolution.category,
        summary: raw.summary ?? resolution.summary,
        supportedOperations: raw.supportedOperations ?? resolution.supportedOperations,
        defaultInitialValues: raw.defaultInitialValues ?? resolution.defaultInitialValues,
        complexity: {
          time: raw.complexity?.time ?? resolution.complexity.time,
          space: raw.complexity?.space ?? resolution.complexity.space,
        },
        provenance,
        verificationStatus,
      },
      errors: [],
    };
  }
}

export const knowledgeIngestionService = new KnowledgeIngestionService();
