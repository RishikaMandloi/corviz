"use strict";
/**
 * @synapse/shared
 * Universal contracts shared between backend verification engines and frontend visualizers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHARED_VERIFICATION_STATUS = exports.SHARED_VERIFICATION_SEVERITY = exports.SUPPORTED_TOPIC_IDS = void 0;
// ============================================================
// 1. TOPICS & TAXONOMY (EXACTLY 10 SUPPORTED TOPICS)
// ============================================================
exports.SUPPORTED_TOPIC_IDS = {
    STACK: "STACK",
    QUEUE: "QUEUE",
    BINARY_SEARCH: "BINARY_SEARCH",
    BUBBLE_SORT: "BUBBLE_SORT",
    LINEAR_SEARCH: "LINEAR_SEARCH",
    LINKED_LIST: "LINKED_LIST",
    BST: "BST",
    SELECTION_SORT: "SELECTION_SORT",
    TWO_POINTERS: "TWO_POINTERS",
    BFS: "BFS",
};
// ============================================================
// 5. VERIFICATION (KVE & VKVE)
// ============================================================
exports.SHARED_VERIFICATION_SEVERITY = {
    ERROR: "ERROR",
    WARNING: "WARNING",
    INFO: "INFO",
};
exports.SHARED_VERIFICATION_STATUS = {
    PENDING: "PENDING",
    PASSED: "PASSED",
    FAILED: "FAILED",
    NEEDS_REVIEW: "NEEDS_REVIEW",
};
//# sourceMappingURL=index.js.map