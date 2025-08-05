import {
	setColor,
	setRainbowEnabled,
} from "./rainbow_color_provider.js";
import cssColors from "./css_colors.js";
import { escapeHtml, getFunctionParameters } from "./util.js";

let whoamiCounter = 0;
const terminalInput = document.querySelector("#terminal-input");
const terminalOutput = document.querySelector("#terminal-command-output");

/**
 * @param {string} color
 * @returns {[number, number, number] | null}
 */
const parseColor = (color) => {
	const rgb = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
	if (rgb) return rgb.slice(1).map((c) => parseInt(c));

	const hex = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
	if (hex) return hex.slice(1).map((c) => parseInt(c, 16));

	/**
	 *
	 * @param {string} hex
	 * @returns {[number, number, number]}
	 */
	const hexToColor = (hex) => {
		const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
		return [
			parseInt(normalized.slice(0, 2), 16),
			parseInt(normalized.slice(2, 4), 16),
			parseInt(normalized.slice(4, 6), 16),
		];
	};

	const cssColor = cssColors[color.toLowerCase()];
	if (cssColor) return hexToColor(cssColor);

	return null;
};

/** */

/**
 * @typedef Command
 * @property {(args: string[]) => string | HTMLElement} fn
 * @property {boolean} [isHidden]
 * @property {boolean} [noHelp]
 */
/**
 * @typedef {Record<string, Command>} Commands
 */

/**
 * @type {Commands}
 */
export const commands = {
	who: {
		fn: () => {
			const birthday = new Date(2002, 10, 3);
			const now = new Date();
			let age = now.getFullYear() - birthday.getFullYear();
			if (
				now.getMonth() < birthday.getMonth() ||
				(now.getMonth() === birthday.getMonth() &&
					now.getDate() < birthday.getDate())
			) {
				age--;
			}

			return `Hi, I'm <span class='highlight'>Matthias</span>, a ${age} y/o software engineering student from <a href='https://www.google.com/maps/place/Karlsruhe/' class='highlight'>Karlsruhe</a>, Germany. 
						I'm passionate about <span class='highlight'>web development and design</span>.`;
		},
	},
	tech: {
		fn: () => {
			return `I have experience in building frontend applications with <a href='https://lit.dev/' class='highlight lit'>Lit</a>, <a href='https://svelte.dev/' class='highlight svelte'>Svelte</a>, 
						<a href='https://vuejs.org/' class='highlight vue'>Vue</a> and <a href='https://flutter.dev/' class='highlight flutter'>Flutter</a> 
						and backend applications with <a href='https://go.dev/' class='highlight go'>Go</a>, <a href='https://nodejs.org/' class='highlight node'>Node.js</a>, <a href='https://www.python.org/' class='highlight python'>Python</a>, 
						and a bit <a href='https://www.java.com/' class='highlight java'>Java</a> and <a href='https://dotnet.microsoft.com/en-us/languages/csharp/' class='highlight cs'>C#</a>`;
		},
	},
	career: {
		fn: () => {
			return `I'm a student at the <a href='https://www.h-ka.de/' class='highlight hka'>Hochschule Karlsruhe</a> and have been active as a working student:
						<ul class='career-list'>
							<li>
								<span class='career-title'>
									<a href='https://thenativeweb.io/' class='highlight thenativeweb'>the native web GmbH</a>
									<span class='career-dates'>(May 2024 - Jul 2025)</span>
								</span>
								<p class='career-passage'>
									Working student for back- & frontend development using <a href='https://lit.dev/' class='highlight lit'>Lit</a> and 
									<a href='https://go.dev/' class='highlight go'>Go</a> with a focus on Event Sourcing, CQRS and Domain-Driven Design.
								</p>
								<p class='career-passage'>
									I was the primary engineer behind <a href='https://docs.eventsourcingdb.io/reference/eventql/' class='highlight eventql'>EventQL</a>, a query language built into the <a href='https://eventsourcingdb.io/' class='highlight eventsourcingdb'>EventSourcingDB</a>.
								</p>
							</li>
							<li>
								<span class='career-title'>
									<a href='https://www.kit.edu/' class='highlight kit'>Karlsruhe Institute of Technology</a>
									<span class='career-dates'>(Jun 2023 - Feb 2024)</span>
								</span>
								<p class='career-passage'>
									Student assistant at the <a href='https://www.tmb.kit.edu/' class='highlight tmb'>Institute of Technology and Management in Construction</a>.
								</p>
								<p class='career-passage'>
									Development of the <a href='https://smartreadinessindicator.com/' class='highlight smartreadinessindicator'>Smart Readiness Indicator</a> web platform using <a href='https://vuejs.org/' class='highlight vue'>Vue</a> and <a href='https://nodejs.org/' class='highlight node'>Node.js</a>.
								</p>
							</li>
						</ul>
						
	`
		},
	},
	github: {
		fn: () => {
			return "You can find my projects at <a href='https://github.com/MatthiasHarzer' target='_blank'>github.com/MatthiasHarzer</a>";
		},
	},
	contact: {
		fn: () => {
			return "You can contact me via mail at <a href='mailto:mail@matthiasharzer.de' target='_blank'>mail@matthiasharzer.de</a>";
		},
	},
	clear: {
		fn: () => {
			terminalOutput.innerHTML = "";
			return null;
		},
	},
	setcolor: {
		isHidden: true,
		fn: (color) => {
			color = color.trim();
			if (!color) {
				return `<span class='highlight error'>Please provide a color using 'setcolor &lt;color&gt; | rainbow | help'</span>`;
			}
			const colorName = color.toLowerCase();

			const colorToRgb = (color) => `rgb(${color[0]}, ${color[1]}, ${color[2]})'`;

			if (colorName === "rainbow") {
				setRainbowEnabled(true);
				return "Rainbow mode <span class='highlight rainbow'>enabled</span>";
			} else if (colorName === "help") {
				const container = document.createElement("div");
				const info = document.createElement("span");
				info.innerHTML = "Available colors:";
				container.appendChild(info);
				container.appendChild(document.createElement("br"));

				const cssColorsSorted = Object.keys(cssColors).sort((a, b) =>
					cssColors[a].localeCompare(cssColors[b])
				);

				for (const color of cssColorsSorted) {
					const colorElement = document.createElement("button");
					colorElement.classList.add("clear", "set-color-button");
					colorElement.innerHTML = `<span style='color: ${color}'>${color}</span>, `;
					colorElement.addEventListener("click", () => {
						terminalInput.value = `setcolor ${color}`;
					});
					container.appendChild(colorElement);
				}
				const customColorsElement = document.createElement("span");
				customColorsElement.innerHTML = "#rrggbb, rgb(r, g, b), ";
				container.appendChild(customColorsElement);

				const rainbowElement = document.createElement("button");
				rainbowElement.classList.add("clear", "set-color-button");
				rainbowElement.innerHTML =
					"<span class='highlight rainbow'>rainbow</span>";
				rainbowElement.addEventListener("click", () => {
					terminalInput.value = "setcolor rainbow";
				});
				container.appendChild(rainbowElement);

				return container;
			}

			const colorParsed = parseColor(colorName);

			if (!colorParsed) {
				return `<span class='highlight error'>Invalid color:</span> ${escapeHtml(colorName)}`;
			}

			setColor(colorParsed);

			return `Color changed to <span style='color: ${colorToRgb(
				colorParsed
			)}'>${colorName}</span>`;
		},
	},
	whoami: {
		fn: () => {
			whoamiCounter++;
			if (whoamiCounter === 1) {
				return "I'm a terminal, what do you expect me to do? Try again.";
			} else if (whoamiCounter === 2) {
				return "I already told you, I'm a terminal. Try something else.";
			} else if (whoamiCounter === 3) {
				const filtered_commands = Object.keys(commands).filter(
					(c) => !["whoami", "help"].includes(c)
				);
				const randomCommand = filtered_commands[Math.floor(Math.random() * filtered_commands.length)];
				return (
					"Are you looking for the <span class='highlight'>" +
					randomCommand +
					"</span> command?"
				);
			} else {
				return `Alright, alright. You can find my source code at <a href='https://github.com/MatthiasHarzer/matthias.harzer.dev' target='_blank'>github.com/MatthiasHarzer/matthias.harzer.dev</a>`;
			}
		},
	},
	mh: {
		isHidden: true,
		noHelp: true,
		fn: () => {
			return `You found the secret command <img class='pixel-emoji' src='/assets/celeb.webp'>, but I haven't implemented it yet.`
		}
	},

	help: {
		fn: () => {
			const start = document.createElement("span");
			start.innerHTML = "Available commands: ";

			const container = document.createElement("div");
			container.appendChild(start);

			const useCommand = (command) => {
				terminalInput.value = command;
			};

			for (const commandName in commands) {
				const index = Object.keys(commands).indexOf(commandName);
				const command = commands[commandName];
				if (command.noHelp) continue;

				const commandFn = command.fn;
				const params = getFunctionParameters(commandFn);
				const paramsString = params.reduce((acc, [param, hasDefault]) => {
					if (hasDefault) {
						return acc + ` [${param}]`;
					} else {
						return acc + ` &lt;${param}&gt;`;
					}
				}, "");

				const commandElement = document.createElement("button");
				commandElement.innerHTML = `<button class='highlight'>${commandName}${paramsString}</button>`;
				commandElement.classList.add("clear", "command-button");
				commandElement.addEventListener("click", () => useCommand(commandName));

				if (index < Object.keys(commands).length - 1) {
					commandElement.innerHTML += ", ";
				}
				container.appendChild(commandElement);
			}
			return container;
		},
	},
};
