import { IConceptKnowledge, SupportedTopicId } from "../../shared/contracts";
import { ICkrProvider } from "./ckr.types";
import { stackCkrProvider } from "./topics/stack.ckr";
import { queueCkrProvider } from "./topics/queue.ckr";
import { binarySearchCkrProvider } from "./topics/binary-search.ckr";
import { bubbleSortCkrProvider } from "./topics/bubble-sort.ckr";
import { linearSearchCkrProvider } from "./topics/linear-search.ckr";
import { linkedListCkrProvider } from "./topics/linked-list.ckr";
import { bstCkrProvider } from "./topics/bst.ckr";
import { selectionSortCkrProvider } from "./topics/selection-sort.ckr";
import { twoPointersCkrProvider } from "./topics/two-pointers.ckr";
import { bfsCkrProvider } from "./topics/bfs.ckr";

class CkrService {
  private providers = new Map<SupportedTopicId, ICkrProvider>();

  constructor() {
    this.registerProvider(stackCkrProvider);
    this.registerProvider(queueCkrProvider);
    this.registerProvider(binarySearchCkrProvider);
    this.registerProvider(bubbleSortCkrProvider);
    this.registerProvider(linearSearchCkrProvider);
    this.registerProvider(linkedListCkrProvider);
    this.registerProvider(bstCkrProvider);
    this.registerProvider(selectionSortCkrProvider);
    this.registerProvider(twoPointersCkrProvider);
    this.registerProvider(bfsCkrProvider);
  }

  registerProvider(provider: ICkrProvider): void {
    this.providers.set(provider.topicId, provider);
  }

  getCkr(topicId: SupportedTopicId): IConceptKnowledge {
    const provider = this.providers.get(topicId);
    if (!provider) {
      throw new Error(`CKR Provider not registered for topic "${topicId}".`);
    }
    return provider.getCkr();
  }

  hasProvider(topicId: SupportedTopicId): boolean {
    return this.providers.has(topicId);
  }
}

export const ckrService = new CkrService();
