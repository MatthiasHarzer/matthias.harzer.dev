import {
  setColor,
  setRainbowEnabled,
} from "./rainbow_color_provider.js";
import cssColors from "./css_colors.js";
import {getFunctionParameters} from "./util.js";

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

/**
 * @typedef {Record.<string, (...args: string) => string | HTMLElement>} Commands
 */

/**
 * @type {Commands}
 */
export const commands = {
  who: () => {
    const birthday = new Date(2002, 11, 3);
    const now = new Date();
    let age = now.getFullYear() - birthday.getFullYear();
    if (
      now.getMonth() < birthday.getMonth() ||
      (now.getMonth() === birthday.getMonth() &&
        now.getDate() < birthday.getDate())
    ) {
      age--;
    }

    return `Hi, I'm <span class='highlight'>Matthias</span>, a ${age} y/o software engineering student from <a href='https://www.google.com/maps/place/Karlsruhe/' class='highlight'>Karlsruhe</a>, Germany. I'm passionate about <span class='highlight'>web development and design</span>. I'm currently working part time as a frontend developer at a small company.`;
  },
  tech: () => {
    return `I have experience in building frontend applications with <span class='highlight svelte'>Svelte</span>, 
      <span class='highlight vue'>Vue</span> and <span class='highlight flutter'>Flutter</span> 
      and backend applications with <span class='highlight node'>Node.js</span>, <span class='highlight python'>Python</span>, 
      and a bit <span class='highlight java'>Java</span> and <span class='highlight cs'>C#</span>`;
  },
  whoami: () => {
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
  clear: () => {
    terminalOutput.innerHTML = "";
    return null;
  },
  github: () => {
    return "You can find my projects at <a href='https://github.com/MatthiasHarzer' target='_blank'>github.com/MatthiasHarzer</a>";
  },
  contact: () => {
    return "You can contact me via mail at <a href='mailto:mail@matthiasharzer.de' target='_blank'>mail@matthiasharzer.de</a>";
  },
  setcolor(color) {
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
      return `<span class='highlight error'>Invalid color:</span> ${colorName}`;
    }

    setColor(colorParsed);

    return `Color changed to <span style='color: ${colorToRgb(
      colorParsed
    )}'>${colorName}</span>`;
  },

  help: () => {
    const start = document.createElement("span");
    start.innerHTML = "Available commands: ";

    const container = document.createElement("div");
    container.appendChild(start);

    const useCommand = (command) => {
      terminalInput.value = command;
    };

    for (const command in commands) {
      const index = Object.keys(commands).indexOf(command);
      const commandFn = commands[command];
      const params = getFunctionParameters(commandFn);
      const paramsString = params.reduce((acc, [param, hasDefault]) => {
        if (hasDefault) {
          return acc + ` [${param}]`;
        } else {
          return acc + ` &lt;${param}&gt;`;
        }
      }, "");

      const commandElement = document.createElement("button");
      commandElement.innerHTML = `<span class='highlight'>${command}${paramsString}</span>`;
      commandElement.classList.add("clear", "command-button");
      commandElement.addEventListener("click", () => useCommand(command));

      if (index < Object.keys(commands).length - 1) {
        commandElement.innerHTML += ", ";
      }
      container.appendChild(commandElement);
    }
    return container;
  },
};
