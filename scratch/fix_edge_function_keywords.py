import re

file_path = "supabase/functions/_shared/automationEngine.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """const buildExpectedKeywordsFromFirstNode = (automation: AutomationRecord): string[] => {
    const flow = normalizeFlow(automation);
    const firstNode = flow?.nodes?.[0];
    const buttonKeywords =
      firstNode?.buttons
        ?.map((button) => button.payload || button.title)
        .filter(Boolean)
        .map((keyword) => cleanText(keyword).toLowerCase()) ?? [];
  
    return Array.from(new Set(['setup', ...buttonKeywords].filter(Boolean)));"""

replacement = """const buildExpectedKeywordsFromFirstNode = (automation: AutomationRecord): string[] => {
    const flow = normalizeFlow(automation);
    const firstNode = flow?.nodes?.[0];
    const buttonKeywords =
      firstNode?.buttons
        ?.map((button) => button.payload || button.title)
        .filter(Boolean)
        .map((keyword) => cleanText(keyword).toLowerCase()) ?? [];
        
    if (flow?.opening_button) {
      buttonKeywords.push(cleanText(flow.opening_button).toLowerCase());
    }
  
    return Array.from(new Set(['setup', ...buttonKeywords].filter(Boolean)));"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed buildExpectedKeywordsFromFirstNode")
else:
    print("Could not find the target block for buildExpectedKeywordsFromFirstNode")
