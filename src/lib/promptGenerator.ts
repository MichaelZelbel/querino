export type PromptFramework = "auto" | "crispe" | "race" | "oracle" | "simple";

export interface FrameworkOption {
  value: PromptFramework;
  label: string;
  description: string;
}

export const FRAMEWORK_OPTIONS: FrameworkOption[] = [
  {
    value: "auto",
    label: "Auto (Let Querino choose)",
    description: "Querino will pick a suitable framework based on your goal and inputs.",
  },
  {
    value: "crispe",
    label: "CRISPE",
    description: "Highly structured prompts with clear role, intent, style, and examples. Great for complex tasks.",
  },
  {
    value: "race",
    label: "RACE",
    description: "Compact but powerful structure ideal for task-oriented instructions.",
  },
  {
    value: "oracle",
    label: "ORACLE",
    description: "Strict, rule-heavy prompts where constraints and examples matter.",
  },
  {
    value: "simple",
    label: "Simple Instruction",
    description: "Short, direct prompts without a lot of scaffolding.",
  },
];

export interface WizardFormData {
  goal: string;
  targetLlm: string;
  customLlm?: string;
  audience?: string;
  toneStyle?: string;
  inputs?: string;
  outputFormat?: string;
  constraints?: string;
  additionalNotes?: string;
  framework: PromptFramework;
}

export function getFrameworkDisplayName(framework: PromptFramework): string {
  const option = FRAMEWORK_OPTIONS.find((f) => f.value === framework);
  return option?.label || framework.toUpperCase();
}

function generateCRISPEPrompt(data: WizardFormData): string {
  const llm = data.targetLlm === "other" ? data.customLlm || "General LLM" : data.targetLlm;
  const sections: string[] = [];

  // Context
  sections.push("## Context");
  sections.push(`You are working with ${llm}.`);
  if (data.audience?.trim()) {
    sections.push(`The target audience is: ${data.audience.trim()}`);
  }
  if (data.inputs?.trim()) {
    sections.push(`You will receive: ${data.inputs.trim()}`);
  }
  sections.push("");

  // Role
  sections.push("## Role");
  sections.push("You are an expert assistant specialized in this domain.");
  sections.push("");

  // Intent
  sections.push("## Intent");
  sections.push(data.goal);
  sections.push("");

  // Style
  if (data.toneStyle?.trim()) {
    sections.push("## Style");
    sections.push(data.toneStyle.trim());
    sections.push("");
  }

  // Persona
  sections.push("## Persona");
  sections.push("Respond as a knowledgeable professional who is helpful and precise.");
  sections.push("");

  // Examples / Output
  sections.push("## Expected Output");
  if (data.outputFormat?.trim()) {
    sections.push(data.outputFormat.trim());
  }
  if (data.additionalNotes?.trim()) {
    sections.push("");
    sections.push("Examples/Notes:");
    sections.push(data.additionalNotes.trim());
  }
  sections.push("");

  // Constraints
  if (data.constraints?.trim()) {
    sections.push("## Constraints");
    sections.push(data.constraints.trim());
  }

  return sections.join("\n");
}

function generateRACEPrompt(data: WizardFormData): string {
  const llm = data.targetLlm === "other" ? data.customLlm || "General LLM" : data.targetLlm;
  const sections: string[] = [];

  // Role
  sections.push("**Role:** You are an expert assistant" + (data.toneStyle?.trim() ? ` with a ${data.toneStyle.trim()} approach` : "") + ".");
  sections.push("");

  // Action
  sections.push("**Action:** " + data.goal);
  sections.push("");

  // Context
  sections.push("**Context:**");
  sections.push(`- Target: ${llm}`);
  if (data.audience?.trim()) {
    sections.push(`- Audience: ${data.audience.trim()}`);
  }
  if (data.inputs?.trim()) {
    sections.push(`- Input: ${data.inputs.trim()}`);
  }
  if (data.constraints?.trim()) {
    sections.push(`- Constraints: ${data.constraints.trim()}`);
  }
  sections.push("");

  // Expectations
  sections.push("**Expectations:**");
  if (data.outputFormat?.trim()) {
    sections.push(data.outputFormat.trim());
  } else {
    sections.push("Provide a clear, well-structured response.");
  }
  if (data.additionalNotes?.trim()) {
    sections.push("");
    sections.push("Additional notes: " + data.additionalNotes.trim());
  }

  return sections.join("\n");
}

function generateORACLEPrompt(data: WizardFormData): string {
  const llm = data.targetLlm === "other" ? data.customLlm || "General LLM" : data.targetLlm;
  const sections: string[] = [];

  // Objective
  sections.push("# Objective");
  sections.push(data.goal);
  sections.push("");

  // Rules
  sections.push("# Rules");
  sections.push("1. Be explicit and structured in your response.");
  sections.push("2. Ask clarifying questions if the input is ambiguous.");
  if (data.constraints?.trim()) {
    sections.push("3. " + data.constraints.trim());
  }
  sections.push("");

  // Actions
  sections.push("# Actions");
  sections.push(`- Process input for ${llm}`);
  if (data.inputs?.trim()) {
    sections.push(`- Expect input type: ${data.inputs.trim()}`);
  }
  if (data.audience?.trim()) {
    sections.push(`- Tailor output for: ${data.audience.trim()}`);
  }
  sections.push("");

  // Constraints
  sections.push("# Constraints");
  if (data.toneStyle?.trim()) {
    sections.push(`- Tone: ${data.toneStyle.trim()}`);
  }
  sections.push("- Do not invent information");
  sections.push("- Acknowledge uncertainty when present");
  sections.push("");

  // Language
  sections.push("# Language");
  sections.push("Use clear, professional language appropriate for the target audience.");
  sections.push("");

  // Examples
  if (data.outputFormat?.trim() || data.additionalNotes?.trim()) {
    sections.push("# Examples & Output Format");
    if (data.outputFormat?.trim()) {
      sections.push(data.outputFormat.trim());
    }
    if (data.additionalNotes?.trim()) {
      sections.push("");
      sections.push(data.additionalNotes.trim());
    }
  }

  return sections.join("\n");
}

function generateSimplePrompt(data: WizardFormData): string {
  const sections: string[] = [];

  sections.push(data.goal);
  sections.push("");

  if (data.outputFormat?.trim()) {
    sections.push("Output format: " + data.outputFormat.trim());
  }

  if (data.constraints?.trim()) {
    sections.push("Constraints: " + data.constraints.trim());
  }

  if (data.additionalNotes?.trim()) {
    sections.push("");
    sections.push(data.additionalNotes.trim());
  }

  return sections.join("\n").trim();
}

function generateDefaultPrompt(data: WizardFormData): string {
  const llm = data.targetLlm === "other" ? data.customLlm || "General LLM" : data.targetLlm;
  
  const sections: string[] = [
    "You are an expert assistant.",
    "",
  ];

  sections.push("Goal:");
  sections.push(`- ${data.goal}`);
  sections.push("");

  sections.push("Target model/context:");
  sections.push(`- ${llm}`);
  sections.push("");

  if (data.audience?.trim()) {
    sections.push("Audience:");
    sections.push(`- ${data.audience.trim()}`);
    sections.push("");
  }

  if (data.toneStyle?.trim()) {
    sections.push("Tone & Style:");
    sections.push(`- ${data.toneStyle.trim()}`);
    sections.push("");
  }

  if (data.inputs?.trim()) {
    sections.push("Input you will receive:");
    sections.push(`- ${data.inputs.trim()}`);
    sections.push("");
  }

  if (data.outputFormat?.trim()) {
    sections.push("What you should produce:");
    sections.push(`- ${data.outputFormat.trim()}`);
    sections.push("");
  }

  if (data.constraints?.trim()) {
    sections.push("Constraints:");
    sections.push(`- ${data.constraints.trim()}`);
    sections.push("");
  }

  if (data.additionalNotes?.trim()) {
    sections.push("Additional notes:");
    sections.push(`- ${data.additionalNotes.trim()}`);
    sections.push("");
  }

  sections.push("When responding, follow these rules:");
  sections.push("1. Be explicit and structured.");
  sections.push("2. Ask clarifying questions if the input is ambiguous.");
  sections.push("3. Respect all constraints above.");

  return sections.join("\n");
}

// Auto-select framework based on form data
function autoSelectFramework(data: WizardFormData): PromptFramework {
  const hasConstraints = !!data.constraints?.trim();
  const hasExamples = !!data.additionalNotes?.trim();
  const hasAudience = !!data.audience?.trim();
  const hasToneStyle = !!data.toneStyle?.trim();
  const hasOutputFormat = !!data.outputFormat?.trim();

  // Count complexity indicators
  const complexity = [hasConstraints, hasExamples, hasAudience, hasToneStyle, hasOutputFormat].filter(Boolean).length;

  // Simple goal with few fields -> simple
  if (complexity <= 1) {
    return "simple";
  }

  // Heavy on constraints and rules -> oracle
  if (hasConstraints && hasExamples) {
    return "oracle";
  }

  // Has audience and style -> crispe (comprehensive)
  if (hasAudience && hasToneStyle && complexity >= 3) {
    return "crispe";
  }

  // Default to race for moderate complexity
  return "race";
}

export function generatePromptFromWizard(data: WizardFormData): { prompt: string; usedFramework: PromptFramework } {
  let framework = data.framework;
  
  if (framework === "auto") {
    framework = autoSelectFramework(data);
  }

  let prompt: string;
  switch (framework) {
    case "crispe":
      prompt = generateCRISPEPrompt(data);
      break;
    case "race":
      prompt = generateRACEPrompt(data);
      break;
    case "oracle":
      prompt = generateORACLEPrompt(data);
      break;
    case "simple":
      prompt = generateSimplePrompt(data);
      break;
    default:
      prompt = generateDefaultPrompt(data);
  }

  return { prompt, usedFramework: framework };
}
