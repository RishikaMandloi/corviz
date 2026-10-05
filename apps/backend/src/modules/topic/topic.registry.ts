import { ITopicMetadata, SupportedTopicId } from "../../shared/contracts";
import { TOPIC_CATALOG, TOPIC_IDS } from "./topic.constants";
import { ITopicHandler } from "./topic.types";

class TopicRegistry {
  private handlers = new Map<SupportedTopicId, ITopicHandler>();

  /**
   * Register a topic-specific handler.
   */
  registerHandler(handler: ITopicHandler): void {
    this.handlers.set(handler.topicId, handler);
  }

  /**
   * Check if topic is supported in the current 10-topic scope.
   */
  isSupported(topicId: string): topicId is SupportedTopicId {
    return Object.values(TOPIC_IDS).includes(topicId as SupportedTopicId);
  }

  /**
   * Get metadata for a supported topic.
   */
  getMetadata(topicId: SupportedTopicId): ITopicMetadata {
    const meta = TOPIC_CATALOG[topicId];
    if (!meta) {
      throw new Error(`Topic "${topicId}" is not in the approved 10-topic catalog.`);
    }
    return meta;
  }

  /**
   * Get all 10 supported topic metadata records.
   */
  getAllMetadata(): ITopicMetadata[] {
    return Object.values(TOPIC_CATALOG);
  }

  /**
   * Get active topic handler for execution/verification.
   */
  getHandler(topicId: SupportedTopicId): ITopicHandler {
    const handler = this.handlers.get(topicId);
    if (!handler) {
      throw new Error(`Topic handler for "${topicId}" is not yet registered.`);
    }
    return handler;
  }

  hasHandler(topicId: SupportedTopicId): boolean {
    return this.handlers.has(topicId);
  }
}

export const topicRegistry = new TopicRegistry();

