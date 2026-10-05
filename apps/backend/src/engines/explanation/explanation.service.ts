import {
  IConceptKnowledge,
  IStateExecutionTrace,
} from "../../shared/contracts";

export interface IWrittenExplanation {
  summary: string;
  keyPoints: string[];
  steps: Array<{ step: number; title: string; detail: string }>;
  invariants: string[];
  edgeCases: string[];
}

class ExplanationService {
  /**
   * Generate structured written explanation derived directly from CKR and execution trace.
   */
  generateExplanation(
    ckr: IConceptKnowledge,
    trace: IStateExecutionTrace
  ): IWrittenExplanation {
    const steps = trace.transitions.map((t) => ({
      step: t.stepIndex,
      title: `${t.operation.type} Operation`,
      detail: t.explanation,
    }));

    return {
      summary: ckr.definition,
      keyPoints: ckr.learningObjectives,
      steps,
      invariants: ckr.invariants.map((inv) => `${inv.id}: ${inv.rule}`),
      edgeCases: ckr.edgeCases.map((ec) => `${ec.id} — ${ec.trigger} -> ${ec.expectedBehavior}`),
    };
  }
}

export const explanationService = new ExplanationService();

