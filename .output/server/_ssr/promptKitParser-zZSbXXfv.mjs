//#region node_modules/.nitro/vite/services/ssr/assets/promptKitParser-zZSbXXfv.js
var HEADING_RE = /^##\s*Prompt:\s*(.*)$/i;
function parsePromptKitItems(markdown) {
	if (!markdown) return [];
	const lines = markdown.split("\n");
	const items = [];
	let current = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const m = line.match(HEADING_RE);
		if (m) {
			if (current) items.push({
				index: items.length + 1,
				title: current.title || "Untitled",
				body: current.bodyLines.join("\n").trim(),
				headingLine: current.headingLine
			});
			current = {
				title: (m[1] || "").trim(),
				bodyLines: [],
				headingLine: i
			};
		} else if (current) current.bodyLines.push(line);
	}
	if (current) items.push({
		index: items.length + 1,
		title: current.title || "Untitled",
		body: current.bodyLines.join("\n").trim(),
		headingLine: current.headingLine
	});
	return items;
}
function countPromptItems(markdown) {
	return parsePromptKitItems(markdown).length;
}
/**
* Parse the full kit document into an ordered list of prose and prompt
* segments. Used to render an article-style detail view where free
* commentary appears between prompt cards.
*/
function parsePromptKitDocument(markdown) {
	if (!markdown) return [];
	const lines = markdown.split("\n");
	const segments = [];
	let proseBuf = [];
	let current = null;
	let promptCount = 0;
	const flushProse = () => {
		const md = proseBuf.join("\n").trim();
		if (md) segments.push({
			type: "prose",
			markdown: md
		});
		proseBuf = [];
	};
	const flushPrompt = () => {
		if (!current) return;
		promptCount += 1;
		segments.push({
			type: "prompt",
			index: promptCount,
			title: current.title || "Untitled",
			body: current.bodyLines.join("\n").trim()
		});
		current = null;
	};
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const m = line.match(HEADING_RE);
		if (m) {
			if (current) flushPrompt();
			else flushProse();
			current = {
				title: (m[1] || "").trim(),
				bodyLines: []
			};
		} else if (current) current.bodyLines.push(line);
		else proseBuf.push(line);
	}
	if (current) flushPrompt();
	else flushProse();
	return segments;
}
//#endregion
export { parsePromptKitDocument as n, parsePromptKitItems as r, countPromptItems as t };
