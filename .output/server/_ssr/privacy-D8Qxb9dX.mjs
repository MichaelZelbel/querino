import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { q as Printer } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-D8Qxb9dX.js
var import_jsx_runtime = require_jsx_runtime();
var Privacy = () => {
	const handlePrint = () => {
		window.print();
	};
	const scrollToSection = (id) => {
		const element = document.getElementById(id);
		if (element) element.scrollIntoView({ behavior: "smooth" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 overflow-hidden pointer-events-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-3xl" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "relative z-10 pt-32 pb-20 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-w-6xl mx-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col lg:flex-row gap-12",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
							className: "lg:w-64 flex-shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:sticky lg:top-32",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold text-foreground mb-4",
									children: "Table of Contents"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
									className: "space-y-2 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("interpretation"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Interpretation and Definitions"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("collecting"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Collecting and Using Your Personal Data"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("data-processors"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Third-Party Data Processors"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("children"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Children's Privacy"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("links"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Links to Other Websites"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("changes"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Changes to this Privacy Policy"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("contact"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Contact Us"
										})
									]
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 max-w-3xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between mb-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-4xl font-bold text-foreground mb-2",
									children: "Privacy Policy"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Last updated:" }), " December 6, 2025"]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: handlePrint,
									className: "flex items-center gap-2 print:hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-4 h-4" }), "Print / Save PDF"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "prose prose-invert max-w-none space-y-6 text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "interpretation",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Interpretation and Definitions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Interpretation"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Definitions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "For the purposes of this Privacy Policy:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Account"
													}), " means a unique account created for You to access our Service or parts of our Service."] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Affiliate"
														}),
														" ",
														"means an entity that controls, is controlled by or is under common control with a party, where \"control\" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Company"
														}),
														" ",
														"(referred to as either \"the Company\", \"We\", \"Us\" or \"Our\" in this Agreement) refers to Zelbel Ltd., 69 Great Hampton Street, Birmingham, B18 6EW, United Kingdom."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Cookies"
													}), " are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses."] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Country"
														}),
														" ",
														"refers to: United Kingdom"
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Device"
													}), " means any device that can access the Service such as a computer, a cellphone or a digital tablet."] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Personal Data"
														}),
														" ",
														"is any information that relates to an identified or identifiable individual."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Service"
														}),
														" ",
														"refers to the Website."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Service Provider"
														}),
														" ",
														"means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Third-party Social Media Service"
														}),
														" ",
														"refers to any website or any social network website through which a User can log in or create an account to use the Service."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Usage Data"
														}),
														" ",
														"refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit)."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Website"
														}),
														" ",
														"refers to Querino, accessible from https://querino.ai"
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "You"
													}), " means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable."] })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "collecting",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Collecting and Using Your Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Types of Data Collected"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-lg font-medium text-foreground mt-4 mb-2",
												children: "Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-1 mt-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Email address" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "First name and last name" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Usage Data" })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-lg font-medium text-foreground mt-4 mb-2",
												children: "Usage Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Usage Data is collected automatically when using the Service." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "We may also collect information that Your browser sends whenever You visit our Service or when You access the Service by or through a mobile device."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-lg font-medium text-foreground mt-4 mb-2",
												children: "Information from Third-Party Social Media Services"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The Company allows You to create an account and log in to use the Service through Third-party Social Media Services such as Google, Discord, or other providers." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "If You decide to register through or otherwise grant us access to a Third-Party Social Media Service, We may collect Personal data that is already associated with Your Third-Party Social Media Service's account, such as Your name, Your email address, Your activities or Your contact list associated with that account."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "You may also have the option of sharing additional information with the Company through Your Third-Party Social Media Service's account. If You choose to provide such information and Personal Data, during registration or otherwise, You are giving the Company permission to use, share, and store it in a manner consistent with this Privacy Policy."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Tracking Technologies and Cookies"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze Our Service. The technologies We use may include:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Cookies or Browser Cookies."
													}),
													" ",
													"A cookie is a small file placed on Your Device. You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is being sent. However, if You do not accept Cookies, You may not be able to use some parts of our Service. Unless you have adjusted Your browser setting so that it will refuse Cookies, our Service may use Cookies."
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Web Beacons."
													}),
													" ",
													"Certain sections of our Service and our emails may contain small electronic files known as web beacons (also referred to as clear gifs, pixel tags, and single-pixel gifs) that permit the Company, for example, to count users who have visited those pages or opened an email and for other related website statistics."
												] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-4",
												children: "Cookies can be \"Persistent\" or \"Session\" Cookies. Persistent Cookies remain on Your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close Your web browser."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "We use both Session and Persistent Cookies for the purposes set out below:"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-4 mt-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Necessary / Essential Cookies"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Type: Session Cookies",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Administered by: Us",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Purpose: These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Cookies Policy / Notice Acceptance Cookies"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Type: Persistent Cookies",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Administered by: Us",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Purpose: These Cookies identify if users have accepted the use of cookies on the Website."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Functionality Cookies"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Type: Persistent Cookies",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Administered by: Us",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														"Purpose: These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website."
													] })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Use of Your Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The Company may use Personal Data for the following purposes:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "To provide and maintain our Service"
													}), ", including to monitor the usage of our Service."] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "To manage Your Account:"
														}),
														" ",
														"to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "For the performance of a contract:"
														}),
														" ",
														"the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "To contact You:"
														}),
														" ",
														"To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "To provide You"
														}),
														" ",
														"with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless You have opted not to receive such information."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "To manage Your requests:"
														}),
														" ",
														"To attend and manage Your requests to Us."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "For business transfers:"
														}),
														" ",
														"We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets, whether as a going concern or as part of bankruptcy, liquidation, or similar proceeding, in which Personal Data held by Us about our Service users is among the assets transferred."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "For other purposes:"
														}),
														" ",
														"We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience."
													] })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-4",
												children: "We may share Your personal information in the following situations:"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "With Service Providers:"
														}),
														" ",
														"We may share Your personal information with Service Providers to monitor and analyze the use of our Service, to contact You."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "For business transfers:"
														}),
														" ",
														"We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "With Affiliates:"
														}),
														" ",
														"We may share Your information with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "With business partners:"
														}),
														" ",
														"We may share Your information with Our business partners to offer You certain products, services or promotions."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "With other users:"
														}),
														" ",
														"when You share personal information or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "With Your consent:"
														}),
														" ",
														"We may disclose Your personal information for any other purpose with Your consent."
													] })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Retention of Your Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer time periods."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Transfer of Your Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from Your jurisdiction." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Delete Your Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "Our Service may give You the ability to delete certain information about You from within the Service."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "You may update, amend, or delete Your information at any time by signing in to Your Account, if you have one, and visiting the account settings section that allows you to manage Your personal information. You may also contact Us to request access to, correct, or delete any personal information that You have provided to Us."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "Please note, however, that We may need to retain certain information when we have a legal obligation or lawful basis to do so."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Disclosure of Your Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-lg font-medium text-foreground mt-4 mb-2",
												children: "Business Transactions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-lg font-medium text-foreground mt-4 mb-2",
												children: "Law enforcement"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency)." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-lg font-medium text-foreground mt-4 mb-2",
												children: "Other legal requirements"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-1 mt-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Comply with a legal obligation" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Protect and defend the rights or property of the Company" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Prevent or investigate possible wrongdoing in connection with the Service" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Protect the personal safety of Users of the Service or the public" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Protect against legal liability" })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Security of Your Personal Data"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security." })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "data-processors",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Third-Party Data Processing / Data Processors"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "In order to provide and operate the Service, We engage certain third-party service providers (\"Data Processors\") who process Personal Data on Our behalf. In accordance with Article 28 of the General Data Protection Regulation (GDPR), We have entered into Data Processing Agreements (DPAs) with each of these processors to ensure that Your Personal Data is handled securely, lawfully, and in compliance with applicable data protection legislation." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "The following is a list of Our current Data Processors, their respective roles, and links to their data protection documentation:"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-6 space-y-6",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "Microsoft Azure (including Azure OpenAI Service)"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																	className: "text-foreground",
																	children: "Role:"
																}), " Cloud infrastructure, hosting, and AI inference (Azure OpenAI deployments)."]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "Microsoft acts as a Data Processor under GDPR Article 28 for data processed through its Azure cloud services. AI inference requests processed via Azure OpenAI are subject to Microsoft's data processing commitments and are not used to train or improve Microsoft's models."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "Microsoft Products and Services Data Protection Addendum (DPA)"
																	})
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "Supabase"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "Role:"
																	}),
																	" ",
																	"Database hosting, authentication, and backend-as-a-service infrastructure."
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "Supabase acts as a Data Processor under GDPR Article 28 for all user data stored in Our database, including account information, user-generated content, and authentication records."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://supabase.com/legal/dpa",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "Supabase GDPR Data Processing Addendum"
																	})
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "Lovable"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "Role:"
																	}),
																	" ",
																	"Website hosting and deployment platform."
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "Lovable acts as a Data Processor under GDPR Article 28 for data transmitted through its hosting infrastructure, including HTTP request metadata and deployment-related data."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://lovable.dev/data-processing-agreement",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "Lovable Data Processing Agreement"
																	})
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "Hostinger"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "Role:"
																	}),
																	" ",
																	"Domain registration and DNS management."
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "Hostinger acts as a Data Processor under GDPR Article 28 for domain-related data and DNS query metadata processed through its infrastructure."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://www.hostinger.com/legal/dpa",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "Hostinger Data Processing Agreement"
																	})
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "Resend"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "Role:"
																	}),
																	" ",
																	"Transactional email delivery service."
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "Resend acts as a Data Processor under GDPR Article 28 for Personal Data included in transactional emails sent on Our behalf, such as email addresses and message content."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://resend.com/legal/dpa",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "Resend Data Processing Agreement"
																	})
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "OpenAI"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																	className: "text-foreground",
																	children: "Role:"
																}), " AI inference provider (fallback for certain AI-powered features)."]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "Where OpenAI services are used as a fallback for AI inference, OpenAI acts as a Data Processor under GDPR Article 28. Data submitted via the OpenAI API is processed in accordance with OpenAI's enterprise data processing terms and is not used to train OpenAI's models."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://openai.com/policies/data-processing-addendum",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "OpenAI Data Processing Addendum"
																	})
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "OpenRouter"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																	className: "text-foreground",
																	children: "Role:"
																}), " AI inference routing provider (multi-model API gateway)."]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "OpenRouter acts as a Data Processor under GDPR Article 28 for data processed through its AI inference routing API. Data submitted via the OpenRouter API is processed in accordance with OpenRouter's data processing commitments and is routed to upstream model providers according to their respective data handling policies."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://trust.openrouter.ai/",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "OpenRouter Trust & Data Protection"
																	})
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "border border-border rounded-lg p-4",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "text-lg font-medium text-foreground mb-2",
																children: "n8n"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "Role:"
																	}),
																	" ",
																	"Workflow automation and AI orchestration platform."
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm mt-1",
																children: "n8n acts as a Data Processor under GDPR Article 28 for data processed through automated workflows, including AI inference orchestration, webhook payloads, and integration data flows."
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-sm mt-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																		className: "text-foreground",
																		children: "DPA:"
																	}),
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://n8n.io/legal/data-processing-agreement/",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "n8n Data Processing Agreement"
																	})
																]
															})
														]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-6",
												children: [
													"We regularly review the data protection practices of Our Data Processors and ensure that appropriate technical and organisational measures are in place to safeguard Your Personal Data. If You have any questions about Our use of Data Processors, please contact Us at",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: "mailto:support@querino.ai",
														className: "text-primary hover:underline",
														children: "support@querino.ai"
													}),
													"."
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "children",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Children's Privacy"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "If We need to rely on consent as a legal basis for processing Your information and Your country requires consent from a parent, We may require Your parent's consent before We collect and use that information."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "links",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Links to Other Websites"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "changes",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Changes to this Privacy Policy"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the \"Last updated\" date at the top of this Privacy Policy."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "contact",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Contact Us"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If you have any questions about this Privacy Policy, You can contact us:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "list-disc pl-6 mt-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"By email:",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: "mailto:support@querino.ai",
														className: "text-primary hover:underline",
														children: "support@querino.ai"
													})
												] })
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-10 pt-6 border-t border-border",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm",
											children: [
												"See also:",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
													to: "/terms",
													className: "text-primary hover:underline",
													children: "Terms of Service"
												}),
												" ",
												"|",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
													to: "/cookies",
													className: "text-primary hover:underline",
													children: "Cookies Policy"
												})
											]
										})
									})
								]
							})]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
};
var SplitComponent = Privacy;
//#endregion
export { SplitComponent as component };
