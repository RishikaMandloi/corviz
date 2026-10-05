import { ITutorContext, ITutorProviderResult } from "./tutor.types";

export interface IAiProvider {
  generateResponse(question: string, context: ITutorContext): Promise<ITutorProviderResult>;
}
