//#region node_modules/.nitro/vite/services/ssr/assets/promptGenerator-DM4ousU3.js
var FRAMEWORK_OPTIONS = [
	{
		value: "auto",
		label: "Auto (Let Querino choose)",
		description: "Querino will pick a suitable framework based on your goal and inputs."
	},
	{
		value: "crispe",
		label: "CRISPE",
		description: "Highly structured prompts with clear role, intent, style, and examples. Great for complex tasks."
	},
	{
		value: "race",
		label: "RACE",
		description: "Compact but powerful structure ideal for task-oriented instructions."
	},
	{
		value: "oracle",
		label: "ORACLE",
		description: "Strict, rule-heavy prompts where constraints and examples matter."
	},
	{
		value: "simple",
		label: "Simple Instruction",
		description: "Short, direct prompts without a lot of scaffolding."
	}
];
function getFrameworkDisplayName(framework) {
	return FRAMEWORK_OPTIONS.find((f) => f.value === framework)?.label || framework.toUpperCase();
}
/**
* Formats wizard form data into a structured text for the n8n API.
* Only includes non-empty fields.
*/
function formatWizardInputForApi(data) {
	const llm = data.targetLlm === "other" ? data.customLlm || "General LLM" : data.targetLlm;
	const frameworkLabel = getFrameworkDisplayName(data.framework);
	const lines = [];
	lines.push(`GOAL: ${data.goal}`);
	lines.push(`FRAMEWORK: ${frameworkLabel}${data.framework === "auto" ? " (choose the most suitable)" : ""}`);
	lines.push(`TARGET LLM: ${llm}`);
	if (data.audience?.trim()) lines.push(`AUDIENCE: ${data.audience.trim()}`);
	if (data.toneStyle?.trim()) lines.push(`TONE & STYLE: ${data.toneStyle.trim()}`);
	if (data.inputs?.trim()) lines.push(`EXPECTED INPUT: ${data.inputs.trim()}`);
	if (data.outputFormat?.trim()) lines.push(`DESIRED OUTPUT: ${data.outputFormat.trim()}`);
	if (data.constraints?.trim()) lines.push(`CONSTRAINTS: ${data.constraints.trim()}`);
	if (data.additionalNotes?.trim()) lines.push(`ADDITIONAL NOTES: ${data.additionalNotes.trim()}`);
	return lines.join("\n");
}
//#endregion
export { formatWizardInputForApi as n, FRAMEWORK_OPTIONS as t };
