import {onColorChange,} from "./rainbow_color_provider.js";
import {commands} from "./commands.js";
import {getFunctionParameters} from "./util.js";

const terminal = document.querySelector("#terminal");
const terminalInput = document.querySelector("#terminal-input");
const terminalOutput = document.querySelector("#terminal-command-output");
const commandsList = document.querySelector("#commands-list")

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

onColorChange((color) => {
  terminal.style.setProperty(
    "--glow-color",
    `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  );
});

terminal.addEventListener("click", () => {
  if (window.getSelection().toString()) return;
  terminalInput.focus();
});
terminalInput.focus();

/**
 * @param {Commands} commands
 */
const loadCommands = (commands) => {
  /**
   * @param {string} commandName
   */
  const onCommandClick = (commandName) => {
    const commandFn = commands[commandName];
    const commandArgs = getFunctionParameters(commandFn);
    const nonOptionalArgs = commandArgs.filter(([_, hasDefault]) => !hasDefault);

    if (nonOptionalArgs.length > 0) {
      const commandArgsText = nonOptionalArgs.map(([name]) => `<${name}>`).join(" ");
      terminalInput.value = `${commandName} ${commandArgsText}`;
      terminalInput.focus();
      terminalInput.setSelectionRange(commandName.length + 1, terminalInput.value.length);


    } else {
      onCommandEntered(commandName);
    }
  }
  /**
   * @param {string} commandName
   */
  const buildCommandElement = (commandName) => {
    const textElement = document.createElement("span");
    const commandElement = document.createElement("div");

    textElement.innerText = commandName;
    commandElement.appendChild(textElement);
    commandElement.classList.add("command");
    commandElement.onclick = () => onCommandClick(commandName);

    return commandElement;
  }

  commandsList.innerHTML = "";
  for (const commandName in commands) {
    const commandElement = buildCommandElement(commandName);
    commandsList.appendChild(commandElement);
  }

}

const makeSuggestion = async (text) => {
  previousSuggestion = text;
  const writeOut = (text, baseDelay) =>
    new Promise((resolve) => {
      const next = () => {
        if (text.length === 0) {
          resolve();
          return;
        }
        terminalInput.placeholder += text[0];
        text = text.slice(1);

        setTimeout(next, baseDelay + Math.random() * 50);
      };
      next();
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

  await writeOut(text, 120);
  await sleep(2500);
  await clear(50);
};

const helpSuggestions = Object.keys(commands);
let previousSuggestion = "";

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
  input.classList.add("command");

  const promptLine = document.createElement("div");
  promptLine.classList.add("command-line", "past");
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
    const suggestion = helpSuggestions.filter((s) => s !== previousSuggestion)[
      Math.floor(Math.random() * helpSuggestions.length)
      ];
    await makeSuggestion(suggestion);
  }
};

setInterval(checkAndMakeSuggestions, 15000);
setTimeout(() => makeSuggestion("help"), 4000);
loadCommands(commands);
