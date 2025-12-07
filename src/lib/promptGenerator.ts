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
}

export function generatePromptFromWizard(data: WizardFormData): string {
  const llm = data.targetLlm === "other" ? data.customLlm || "General LLM" : data.targetLlm;
  
  const sections: string[] = [
    "You are an expert assistant.",
    "",
  ];

  // Goal (required)
  sections.push("Goal:");
  sections.push(`- ${data.goal}`);
  sections.push("");

  // Target LLM
  sections.push("Target model/context:");
  sections.push(`- ${llm}`);
  sections.push("");

  // Audience (optional)
  if (data.audience?.trim()) {
    sections.push("Audience:");
    sections.push(`- ${data.audience.trim()}`);
    sections.push("");
  }

  // Tone & Style (optional)
  if (data.toneStyle?.trim()) {
    sections.push("Tone & Style:");
    sections.push(`- ${data.toneStyle.trim()}`);
    sections.push("");
  }

  // Inputs (optional)
  if (data.inputs?.trim()) {
    sections.push("Input you will receive:");
    sections.push(`- ${data.inputs.trim()}`);
    sections.push("");
  }

  // Output format (optional)
  if (data.outputFormat?.trim()) {
    sections.push("What you should produce:");
    sections.push(`- ${data.outputFormat.trim()}`);
    sections.push("");
  }

  // Constraints (optional)
  if (data.constraints?.trim()) {
    sections.push("Constraints:");
    sections.push(`- ${data.constraints.trim()}`);
    sections.push("");
  }

  // Additional notes (optional)
  if (data.additionalNotes?.trim()) {
    sections.push("Additional notes:");
    sections.push(`- ${data.additionalNotes.trim()}`);
    sections.push("");
  }

  // Standard closing rules
  sections.push("When responding, follow these rules:");
  sections.push("1. Be explicit and structured.");
  sections.push("2. Ask clarifying questions if the input is ambiguous.");
  sections.push("3. Respect all constraints above.");

  return sections.join("\n");
}
