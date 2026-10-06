import assert from "node:assert/strict";

import { knowledgeIngestionService } from "../modules/knowledge/knowledge-ingestion.service";
import { TOPIC_CATALOG } from "../modules/topic/topic.constants";

const topicIds = [
  "STACK",
  "QUEUE",
  "BINARY_SEARCH",
  "BUBBLE_SORT",
  "LINEAR_SEARCH",
  "LINKED_LIST",
  "BST",
  "SELECTION_SORT",
  "TWO_POINTERS",
  "BFS",
] as const;

(async () => {
  const originalFetch = global.fetch;
  const fetchStub = async (input: string | URL | Request) => {
    const url = String(input);
    const topic = topicIds.find((id) => url.includes(knowledgeIngestionService.getPublicSourceReference(id).wikipediaTitle)) ?? "STACK";
    const titleMap: Record<string, string> = {
      STACK: "Stack (abstract data type)",
      QUEUE: "Queue (abstract data type)",
      BINARY_SEARCH: "Binary search algorithm",
      BUBBLE_SORT: "Bubble sort",
      LINEAR_SEARCH: "Linear search",
      LINKED_LIST: "Linked list",
      BST: "Binary search tree",
      SELECTION_SORT: "Selection sort",
      TWO_POINTERS: "Two pointers",
      BFS: "Breadth-first search",
    };

    return {
      ok: true,
      status: 200,
      json: async () => ({
        title: titleMap[topic],
        extract: `${titleMap[topic]} is a well-known computer science concept used in teaching and problem solving.`,
        canonicalurl: knowledgeIngestionService.getPublicSourceReference(topic as any).sourceReference,
      }),
    } as Response;
  };

  (global as any).fetch = fetchStub;

  try {
    for (const topicId of topicIds) {
      const sourceConfig = knowledgeIngestionService.getPublicSourceReference(topicId);
      assert.equal(sourceConfig.sourceName, "Wikipedia REST API");
      assert.ok(sourceConfig.sourceReference.includes("wikipedia.org/wiki/"), `${topicId} must map to a valid public Wikipedia URL.`);

      const summaryResult = await knowledgeIngestionService.fetchPublicTopicSummary(topicId);
      assert.ok(summaryResult.summary.length > 0, `${topicId} summary should not be empty.`);
      assert.equal(summaryResult.source.sourceType, "PUBLIC_API");
      assert.equal(summaryResult.source.sourceName, "Wikipedia REST API");
      assert.ok(summaryResult.source.sourceReference.includes("wikipedia.org/wiki/"), `${topicId} source reference should be public and traceable.`);

      const normalized = knowledgeIngestionService.normalizeTopicPayload({
        topicId,
        name: summaryResult.title,
        category: TOPIC_CATALOG[topicId].category,
        summary: summaryResult.summary,
        supportedOperations: TOPIC_CATALOG[topicId].supportedOperations,
        defaultInitialValues: TOPIC_CATALOG[topicId].defaultInitialValues,
        complexity: TOPIC_CATALOG[topicId].complexity,
        provenance: {
          sourceType: summaryResult.source.sourceType,
          sourceName: summaryResult.source.sourceName,
          sourceReference: summaryResult.source.sourceReference,
          retrievedAt: summaryResult.source.retrievedAt,
        },
        verificationStatus: "UNVERIFIED",
      });

      assert.equal(normalized.valid, true, `${topicId} should validate as a supported normalized public metadata payload.`);
      assert.equal(normalized.topic?.provenance.sourceType, "PUBLIC_API");
      assert.equal(normalized.topic?.verificationStatus, "UNVERIFIED");
    }

    const stackSource = await knowledgeIngestionService.fetchPublicTopicSummary("STACK");
    assert.match(stackSource.summary, /stack/i);

    const invalid = knowledgeIngestionService.normalizeTopicPayload({
      topicId: "UNKNOWN",
      name: "",
      category: "DATA_STRUCTURE",
      summary: "",
      supportedOperations: [],
      defaultInitialValues: [],
      complexity: { time: "", space: "" },
    });

    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors.length > 0);

    const importResult = await knowledgeIngestionService.importPublicTopicMetadata("STACK");
    assert.equal(importResult.accepted, false);
    assert.match(importResult.reason ?? "", /verified|canonical|overwrite/i);
    assert.equal(TOPIC_CATALOG.STACK.summary, importResult.canonicalSummary);

    console.log("Generic public-source ingestion tests passed across all 10 approved topics.");
  } finally {
    (global as any).fetch = originalFetch;
  }
})();
