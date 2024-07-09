import {
  onColorChange,
  setColor,
  setRainbowEnabled,
} from "./rainbow_color_provider.js";
import cssColors from "./css_colors.js";

const terminal = document.querySelector("#terminal");
const terminalInput = document.querySelector("#terminal-input");
const terminalOutput = document.querySelector("#terminal-command-output");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

onColorChange((color) => {
  terminal.style.setProperty(
    "--glow-color",
    `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  );
});

terminal.addEventListener("click", () => {
  terminalInput.focus();
});
terminalInput.focus();

const makeSuggestion = async (text) => {
  previouseSuggestion = text;
  const writeOut = (text, delay) =>
    new Promise((resolve) => {
      let id = setInterval(() => {
        terminalInput.placeholder += text[0];

        text = text.slice(1);

        if (text.length === 0 || terminalInput.value.length > 0) {
          clearInterval(id);
          resolve();
        }
      }, delay);
    });
  const clear = (delay) =>
    new Promise((resolve) => {
      let id = setInterval(() => {
        terminalInput.placeholder = terminalInput.placeholder.slice(0, -1);

        if (
          terminalInput.placeholder.length === 0 ||
          terminalInput.value.length > 0
        ) {
          clearInterval(id);
          resolve();
        }
      }, delay);
    });

  await writeOut(text, 120 + Math.random() * 50);
  await sleep(1500);
  await clear(50);
};

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
 * @param {Function} func
 * @returns {[string, boolean][]}
 * @source https://stackoverflow.com/a/9924463
 */
const getParamNames = (func) => {
  const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
  const fnStr = func.toString().replace(STRIP_COMMENTS, "");
  const paramsStr = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .trim();

  if (paramsStr.length === 0) return [];

  const params = paramsStr.split(",").map((p) => p.trim());

  return params.map((p) => {
    const parts = p.split("=");
    const hasDefault = parts.length > 1;
    return [parts[0], hasDefault];
  });
};

let history = [];
let whoamiCounter = 0;

/**
 * @type {Object.<string, (...args: string) => string | HTMLElement>}
 */
const commands = {
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

    return `Hi, I'm <span class='highlight'>Matthias</span>, a ${age} y/o software engineering student from <span class='highlight'>Karlsruhe</span>, Germany. I'm passionate about <span class='highlight'>web development and design</span>. I'm currently working part time as a frontend developer at a small company.`;
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
      const cmds = Object.keys(commands).filter(
        (c) => !["whoami", "help"].includes(c)
      );
      const randomCommand = cmds[Math.floor(Math.random() * cmds.length)];
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
    return "You can contact me via mail at <a href='mailto:mail@matthiasharzer.de'>mail@matthiasharzer.de</a>";
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
      const params = getParamNames(commandFn);
      const paramsString = params.reduce((acc, [param, hasDefault], i) => {
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
const helpSuggestions = Object.keys(commands);
let previouseSuggestion = "";

const handleCommand = (_command) => {
  const [command, ...args] = _command.split(" ");

  if (command in commands) {
    return commands[command](args.join(" "));
  } else {
    return `<span class='highlight error'>Unknown command:</span> ${command}`;
  }
};

/**
 * @param {string} command
 * @param {string | HTMLElement} response
 */
const printResponse = (command, response) => {
  const prompt = document.createElement("span");
  prompt.innerText = ">_";
  prompt.classList.add("prompt");

  const input = document.createElement("span");
  input.innerHTML = command;
  input.classList.add("input");

  const promptLine = document.createElement("div");
  promptLine.classList.add("command-line");
  promptLine.appendChild(prompt);
  promptLine.appendChild(input);

  const isHtmlElement = response instanceof HTMLElement;

  let responseElement;

  if (isHtmlElement) {
    responseElement = response;
  } else {
    responseElement = document.createElement("div");
    responseElement.innerHTML = response;
  }

  responseElement.classList.add("response");

  terminalOutput.appendChild(promptLine);
  terminalOutput.appendChild(responseElement);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
};

const onCommandEntered = async (command) => {
  const response = handleCommand(command);
  if (response) {
    printResponse(command, response);
  }
};

terminalInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const command = terminalInput.value;
    terminalInput.value = "";
    terminalInput.placeholder = "";
    onCommandEntered(command);
  }
});

const checkAndMakeSuggestions = async () => {
  const hasValue = terminalInput.value.length > 0;
  const hasPlaceholder = terminalInput.placeholder.length > 0;

  if (!hasValue && !hasPlaceholder) {
    const suggestion = helpSuggestions.filter((s) => s !== previouseSuggestion)[
      Math.floor(Math.random() * helpSuggestions.length)
    ];
    await makeSuggestion(suggestion);
  }
};

setInterval(checkAndMakeSuggestions, 15000);
setTimeout(() => makeSuggestion("help"), 4000);
