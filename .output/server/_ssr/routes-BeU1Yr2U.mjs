import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { Bn as ArrowRight, Ct as Library, F as Shield, L as Share2, P as Sparkles, Tt as Layers, a as Users, cn as Copy, i as WandSparkles, mn as Code, t as Zap } from "../_libs/lucide-react.mjs";
import { a as useAuthContext, n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { t as PromptsSection } from "./PromptsSection-p4LD28rZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BeU1Yr2U.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AnimatedNumber({ value, duration = 1e3 }) {
	const [displayValue, setDisplayValue] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (value <= 10) {
			const steps = 20;
			const increment = value / steps;
			const stepDuration = duration / steps;
			let current = 0;
			const timer = setInterval(() => {
				current += increment;
				if (current >= value) {
					setDisplayValue(value);
					clearInterval(timer);
				} else setDisplayValue(Math.floor(current));
			}, stepDuration);
			return () => clearInterval(timer);
		} else setDisplayValue(value);
	}, [value, duration]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: displayValue });
}
function HomeStats() {
	const [stats, setStats] = (0, import_react.useState)({
		publicPrompts: null,
		totalArtifacts: null
	});
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		async function fetchStats() {
			try {
				const [promptsResult, skillsResult, workflowsResult] = await Promise.all([
					supabase.from("prompts").select("id", {
						count: "exact",
						head: true
					}).eq("is_public", true),
					supabase.from("skills").select("id", {
						count: "exact",
						head: true
					}).eq("published", true),
					supabase.from("workflows").select("id", {
						count: "exact",
						head: true
					}).eq("published", true)
				]);
				const promptsCount = promptsResult.count ?? 0;
				const skillsCount = skillsResult.count ?? 0;
				const workflowsCount = workflowsResult.count ?? 0;
				setStats({
					publicPrompts: promptsCount,
					totalArtifacts: promptsCount + skillsCount + workflowsCount
				});
			} catch (error) {
				console.error("Error fetching homepage stats:", error);
			} finally {
				setLoading(false);
			}
		}
		fetchStats();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-12 grid grid-cols-3 gap-6 animate-fade-in-up",
		style: { animationDelay: "0.4s" },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center lg:text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-5 w-5 text-primary" }), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-7 w-12" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedNumber, { value: stats.publicPrompts ?? 0 })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Public Prompts"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center lg:text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "h-5 w-5 text-warning" }), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-7 w-16" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedNumber, { value: stats.totalArtifacts ?? 0 })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Total Artifacts"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center lg:text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Code, { className: "h-5 w-5 text-success" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "https://github.com/MichaelZelbel/querino",
						target: "_blank",
						rel: "noopener noreferrer",
						className: "hover:text-primary transition-colors",
						children: "AGPL-3.0"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Open Source"
				})]
			})
		]
	});
}
function Quentin({ size = 320, glasses = false, dark = false }) {
	const id = "querio";
	const c0 = "#E5E5FF";
	const c1 = dark ? "#A5A4FF" : "#9594FF";
	const c2 = dark ? "#7C7BFF" : "#5C5BE6";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			width: size,
			height: size,
			position: "relative",
			filter: dark ? "drop-shadow(0 12px 30px rgba(124,123,255,0.55))" : "drop-shadow(0 12px 30px rgba(92,91,230,0.45))"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			width: size,
			height: size,
			viewBox: "0 0 240 240",
			style: {
				overflow: "visible",
				display: "block"
			},
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
						id: `${id}-body`,
						cx: ".4",
						cy: ".3",
						r: ".75",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0%",
								stopColor: c0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "50%",
								stopColor: c1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "100%",
								stopColor: c2
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
						id: `${id}-shine`,
						cx: ".35",
						cy: ".25",
						r: ".5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: "#FFFFFF",
							stopOpacity: ".9"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: "#FFFFFF",
							stopOpacity: "0"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
						id: `${id}-halo`,
						cx: ".5",
						cy: ".5",
						r: ".5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: c2,
							stopOpacity: dark ? "0.45" : "0.35"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: c2,
							stopOpacity: "0"
						})]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "120",
					cy: "125",
					r: "105",
					fill: `url(#${id}-halo)`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					style: {
						animation: "querioSparkle 2.4s ease-in-out infinite",
						transformOrigin: "47px 68px"
					},
					fontFamily: "JetBrains Mono, monospace",
					fontWeight: 700,
					fill: c1,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "40",
						y: "74",
						fontSize: "18",
						children: ">"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					style: {
						animation: "querioSparkle 2.4s ease-in-out infinite",
						animationDelay: "0.6s",
						transformOrigin: "197px 86px"
					},
					fontFamily: "JetBrains Mono, monospace",
					fontWeight: 700,
					fill: c1,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "190",
						y: "92",
						fontSize: "16",
						children: "{"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "200",
						y: "92",
						fontSize: "16",
						children: "}"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					style: {
						animation: "querioSparkle 2.4s ease-in-out infinite",
						animationDelay: "1.2s",
						transformOrigin: "57px 168px"
					},
					fontFamily: "JetBrains Mono, monospace",
					fontWeight: 700,
					fill: c1,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "50",
						y: "174",
						fontSize: "16",
						children: ">"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					style: {
						animation: "querioSparkle 2.4s ease-in-out infinite",
						animationDelay: "1.8s",
						transformOrigin: "189px 160px"
					},
					fontFamily: "JetBrains Mono, monospace",
					fontWeight: 700,
					fill: c1,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "186",
						y: "166",
						fontSize: "14",
						children: "/"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
					cx: "120",
					cy: "218",
					rx: "48",
					ry: "6",
					fill: "#06121F",
					opacity: dark ? "0.55" : "0.35",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("animate", {
						attributeName: "rx",
						values: "48;38;48",
						dur: "3.5s",
						repeatCount: "indefinite"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					style: {
						animation: "querioBob 4s ease-in-out infinite",
						transformOrigin: "50% 100%"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M75 110\r\n               C 75 70, 165 70, 165 110\r\n               L 165 180\r\n               Q 152 190, 145 180\r\n               Q 138 195, 125 180\r\n               Q 118 195, 105 180\r\n               Q 95 195, 85 180\r\n               L 75 180 Z",
							fill: `url(#${id}-body)`,
							stroke: c0,
							strokeWidth: "1.5"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
							cx: "98",
							cy: "92",
							rx: "22",
							ry: "14",
							fill: `url(#${id}-shine)`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							style: {
								animation: "querioBlink 5s steps(1) infinite",
								transformOrigin: "50% 50%"
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "103",
									cy: "125",
									rx: "6",
									ry: "9",
									fill: "#0E121B"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "137",
									cy: "125",
									rx: "6",
									ry: "9",
									fill: "#0E121B"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "105",
									cy: "121",
									r: "2.2",
									fill: "#FFFFFF"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "139",
									cy: "121",
									r: "2.2",
									fill: "#FFFFFF"
								})
							]
						}),
						glasses && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							fill: "none",
							stroke: "#1A1830",
							strokeWidth: "2.4",
							strokeLinecap: "round",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "103",
									cy: "125",
									r: "13",
									fill: "#FFFFFF",
									fillOpacity: "0.18"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "137",
									cy: "125",
									r: "13",
									fill: "#FFFFFF",
									fillOpacity: "0.18"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M116 125 Q 120 122 124 125" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M90 124 L 84 122" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M150 124 L 156 122" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "99",
									cy: "120",
									r: "1.6",
									fill: "#FFFFFF",
									stroke: "none",
									opacity: "0.9"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "133",
									cy: "120",
									r: "1.6",
									fill: "#FFFFFF",
									stroke: "none",
									opacity: "0.9"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M114 145 Q 120 150 126 145",
							stroke: "#0E121B",
							strokeWidth: "2.5",
							fill: "none",
							strokeLinecap: "round"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
							cx: "93",
							cy: "142",
							rx: "5",
							ry: "3",
							fill: "#FFFFFF",
							opacity: ".7"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
							cx: "147",
							cy: "142",
							rx: "5",
							ry: "3",
							fill: "#FFFFFF",
							opacity: ".7"
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				position: "absolute",
				left: "50%",
				bottom: 4,
				transform: "translateX(-50%)",
				fontSize: 11,
				color: c1,
				letterSpacing: "0.15em",
				textTransform: "lowercase",
				fontFamily: "\"JetBrains Mono\", monospace",
				background: dark ? "rgba(20,18,40,0.6)" : "rgba(245,244,255,0.85)",
				padding: "3px 10px",
				borderRadius: 999,
				border: `1px solid ${c1}55`
			},
			children: "quentin"
		})]
	});
}
/**
* TypingPrompt — typewriter card that sits below Quentin and types
* example prompts character-by-character on a loop.
*
* Phase machine: typing → hold → erasing → next-line → typing.
* This is the centerpiece of the hero — do NOT remove.
*
* Reduced-motion: the loop still runs (carries content) but ~2× slower.
*/
var LINES = [
	"Write a sci-fi short story about...",
	"Refactor this React component to...",
	"Plan a 3-day trip to Lisbon for...",
	"Generate a SQL query that joins..."
];
function TypingPrompt({ dark = false }) {
	const [idx, setIdx] = (0, import_react.useState)(0);
	const [text, setText] = (0, import_react.useState)("");
	const [phase, setPhase] = (0, import_react.useState)("typing");
	(0, import_react.useEffect)(() => {
		const slow = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 2 : 1;
		const cur = LINES[idx];
		let t;
		if (phase === "typing") if (text.length < cur.length) t = setTimeout(() => setText(cur.slice(0, text.length + 1)), (45 + Math.random() * 40) * slow);
		else t = setTimeout(() => setPhase("hold"), 1400 * slow);
		else if (phase === "hold") t = setTimeout(() => setPhase("erasing"), 800 * slow);
		else if (text.length > 0) t = setTimeout(() => setText(text.slice(0, -1)), 18 * slow);
		else t = setTimeout(() => {
			setIdx((i) => (i + 1) % LINES.length);
			setPhase("typing");
		}, 0);
		return () => clearTimeout(t);
	}, [
		text,
		phase,
		idx
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "status",
		"aria-live": "polite",
		style: {
			position: "absolute",
			bottom: -52,
			left: "50%",
			transform: "translateX(-50%)",
			background: dark ? "rgba(26,28,46,0.95)" : "rgba(255,255,255,0.96)",
			border: `1px solid ${dark ? "rgba(124,123,255,0.3)" : "rgba(92,91,230,0.2)"}`,
			borderRadius: 14,
			padding: "10px 14px",
			fontFamily: "\"JetBrains Mono\", monospace",
			fontSize: 12,
			color: dark ? "#A5A4FF" : "#5C5BE6",
			boxShadow: dark ? "0 12px 32px rgba(0,0,0,0.5)" : "0 12px 32px rgba(92,91,230,0.18)",
			whiteSpace: "nowrap",
			backdropFilter: "blur(10px)",
			WebkitBackdropFilter: "blur(10px)",
			zIndex: 5
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: {
					opacity: .6,
					marginRight: 6
				},
				children: ">"
			}),
			text,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "typing-caret",
				style: {
					animation: "blinkCaret 1s step-end infinite",
					marginLeft: 1
				},
				children: "▌"
			})
		]
	});
}
var CARDS = [
	{
		x: -180,
		y: -110,
		rot: -12,
		delay: 0,
		w: 150,
		label: "Coding",
		tag: "react",
		accent: "#5C5BE6"
	},
	{
		x: 180,
		y: -90,
		rot: 9,
		delay: .5,
		w: 140,
		label: "Writing",
		tag: "blog",
		accent: "#FF9B7A"
	},
	{
		x: -200,
		y: 90,
		rot: 7,
		delay: 1,
		w: 145,
		label: "Research",
		tag: "data",
		accent: "#22C55E"
	},
	{
		x: 190,
		y: 110,
		rot: -10,
		delay: 1.5,
		w: 150,
		label: "Creative",
		tag: "story",
		accent: "#A855F7"
	},
	{
		x: 0,
		y: -200,
		rot: 0,
		delay: .8,
		w: 130,
		label: "Business",
		tag: "ops",
		accent: "#F59E0B"
	}
];
function FloatingCards({ dark = false }) {
	const cardBg = dark ? "rgba(26,28,46,0.92)" : "rgba(255,255,255,0.95)";
	const cardBorder = dark ? "rgba(124,123,255,0.25)" : "rgba(92,91,230,0.18)";
	const titleColor = dark ? "#F4F5FA" : "#1a1c30";
	const lineColor = dark ? "rgba(244,245,250,0.18)" : "rgba(26,28,48,0.14)";
	const tagBg = dark ? "rgba(124,123,255,0.18)" : "rgba(92,91,230,0.10)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		style: {
			position: "absolute",
			inset: 0,
			pointerEvents: "none",
			zIndex: 1
		},
		children: CARDS.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				position: "absolute",
				left: "50%",
				top: "50%",
				width: c.w,
				transform: `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px)) rotate(${c.rot}deg)`,
				animation: `floatCard${i} ${5 + i * .5}s ease-in-out ${c.delay}s infinite`
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					background: cardBg,
					border: `1px solid ${cardBorder}`,
					borderRadius: 12,
					padding: "11px 13px",
					boxShadow: dark ? "0 12px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)" : "0 12px 28px rgba(26,28,48,0.10), 0 2px 6px rgba(26,28,48,0.06)",
					backdropFilter: "blur(10px)",
					WebkitBackdropFilter: "blur(10px)"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 6,
							marginBottom: 8
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							width: 6,
							height: 6,
							borderRadius: 99,
							background: c.accent
						} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 11,
								fontWeight: 600,
								color: titleColor,
								fontFamily: "Inter, sans-serif",
								letterSpacing: "-0.01em"
							},
							children: c.label
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: 4
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
								height: 3,
								width: "85%",
								background: lineColor,
								borderRadius: 2
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
								height: 3,
								width: "65%",
								background: lineColor,
								borderRadius: 2
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
								height: 3,
								width: "75%",
								background: lineColor,
								borderRadius: 2
							} })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							marginTop: 9,
							display: "inline-flex"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							style: {
								fontSize: 9,
								fontFamily: "\"JetBrains Mono\", monospace",
								background: tagBg,
								color: c.accent,
								padding: "2px 7px",
								borderRadius: 99,
								fontWeight: 500
							},
							children: ["#", c.tag]
						})
					})
				]
			})
		}, i))
	});
}
/**
* HeroStage — the right-column "stage" behind Quentin:
* indigo→coral gradient plate + 32×32 dot grid (center-fade mask)
* + 5 floating cards + Quentin (with glasses) + TypingPrompt + speech bubble.
*
* The gradient + grid live in src/index.css (.stage-bg / .stage-grid)
* because they need color-mix-equivalent tokens that respond to dark mode.
*/
function HeroStage() {
	const [isDark, setIsDark] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (typeof document === "undefined") return;
		const root = document.documentElement;
		const update = () => setIsDark(root.classList.contains("dark"));
		update();
		const obs = new MutationObserver(update);
		obs.observe(root, {
			attributes: true,
			attributeFilter: ["class"]
		});
		return () => obs.disconnect();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hero-stage",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stage-bg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stage-grid" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingCards, { dark: isDark }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "relative",
					zIndex: 2
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quentin, {
					size: 320,
					glasses: true,
					dark: isDark
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingPrompt, { dark: isDark })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "speech-bubble",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Hi! I'm Quentin." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					style: {
						opacity: .6,
						fontSize: 11
					},
					children: "I wrangle prompts."
				})]
			})
		]
	});
}
function HeroSection() {
	const { user } = useAuthContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative overflow-hidden py-16 md:py-20 lg:py-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"aria-hidden": "true",
			className: "absolute inset-0 -z-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-[150px] rounded-full blur-3xl",
				style: { background: "hsl(var(--primary) / 0.07)" }
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute right-[-10%] top-[30%] h-[500px] w-[500px] rounded-full blur-3xl",
				style: { background: "hsl(var(--accent-warm) / 0.10)" }
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "container mx-auto px-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center lg:text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-primary animate-fade-in",
							style: {
								background: "hsl(var(--primary) / 0.08)",
								borderColor: "hsl(var(--primary) / 0.25)"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "The AI Prompt Library"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mb-6 font-display font-bold text-foreground animate-fade-in-up",
							style: {
								fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
								lineHeight: 1.05,
								letterSpacing: "-0.035em",
								animationDelay: "0.1s",
								textWrap: "balance"
							},
							children: [
								"Discover, Create &",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"Master ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "querino-grad-text",
									children: "AI Prompts"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 max-w-xl text-lg text-muted-foreground md:text-[17px] animate-fade-in-up mx-auto lg:mx-0",
							style: {
								animationDelay: "0.2s",
								lineHeight: 1.55
							},
							children: "Thousands of curated prompts, your personal library, and a tiny mascot who genuinely cares whether your prompts are good."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start animate-fade-in-up",
							style: { animationDelay: "0.3s" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/discover",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "hero",
									size: "xl",
									className: "gap-2",
									children: ["Start Exploring", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-5 w-5" })]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: user ? "/library" : "/auth?redirect=/library",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "hero-outline",
									size: "xl",
									children: "View Your Library"
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeStats, {})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden animate-fade-in-up lg:block",
					style: { animationDelay: "0.3s" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStage, {})
				})]
			})
		})]
	});
}
var features = [
	{
		icon: Library,
		title: "Organized Library",
		description: "Keep all your prompts in one place with smart tagging, categories, and powerful search."
	},
	{
		icon: WandSparkles,
		title: "AI Refinement",
		description: "Use intelligent tools to improve, expand, and debug your prompts for better results."
	},
	{
		icon: Share2,
		title: "Community Sharing",
		description: "Publish your best prompts and discover high-quality prompts from other creators."
	},
	{
		icon: Shield,
		title: "Version Control",
		description: "Track changes, compare versions, and optionally sync with GitHub for backup."
	},
	{
		icon: Zap,
		title: "Instant Copy",
		description: "One-click copy for any prompt. Start using it immediately in your AI workflow."
	},
	{
		icon: Users,
		title: "Team Collaboration",
		description: "Share prompt libraries with your team and maintain consistent AI outputs."
	}
];
function FeaturesSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "features",
		className: "py-20 md:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mb-12 max-w-2xl text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-display-md font-bold text-foreground md:text-display-lg",
					children: "Everything You Need"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg text-muted-foreground",
					children: "From prompt discovery to advanced refinement, Querino has you covered."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
				children: features.map((feature, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					variant: "elevated",
					className: "animate-fade-in-up",
					style: { animationDelay: `${index * .1}s` },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(feature.icon, { className: "h-6 w-6 text-primary" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-lg",
						children: feature.title
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: feature.description
					}) })]
				}, feature.title))
			})]
		})
	});
}
var Index = () => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptsSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeaturesSection, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
};
var SplitComponent = Index;
//#endregion
export { SplitComponent as component };
