import { RuleBasedProvider } from "@/app/lib/training/rules/rule-based-provider";
import type { RuleEngineProvider } from "@/app/lib/training/rules/types";

let activeProvider: RuleEngineProvider = new RuleBasedProvider();

export function getRuleEngineProvider(): RuleEngineProvider {
  return activeProvider;
}

export function setRuleEngineProvider(provider: RuleEngineProvider): void {
  activeProvider = provider;
}

export function createDefaultRuleEngineProvider(): RuleEngineProvider {
  return new RuleBasedProvider();
}
