/**
 * Placeholder for a future LLM-backed insights provider.
 * Swap via setRuleEngineProvider(new OpenAIProvider(...)) when ready.
 */
import type {
  RuleEngineProvider,
  RuleEvaluationContext,
  RuleEvaluationResult,
} from "@/app/lib/training/rules/types";

export class OpenAIProvider implements RuleEngineProvider {
  readonly id = "openai";

  evaluate(context: RuleEvaluationContext): RuleEvaluationResult {
    void context;
    throw new Error(
      "OpenAIProvider is not implemented. Use RuleBasedProvider or setRuleEngineProvider after configuring OpenAI."
    );
  }
}
