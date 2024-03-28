import { onColorChange } from "./rainbow_color_provider.js";

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

let history = [];
let whatCounter = 0;

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
      and backend applicaitons with <span class='highlight node'>Node.js</span>, <span class='highlight python'>Python</span>, 
      and a bit <span class='highlight java'>Java</span> and <span class='highlight cs'>C#</span>`;
  },
  what: () => {
    whatCounter++;
    if (whatCounter === 1) {
      return "I'm a terminal, what do you expect me to do? Try again.";
    } else if (whatCounter === 2) {
      return "I already told you, I'm a terminal. Try something else.";
    } else {
      const cmds = Object.keys(commands).filter(
        (c) => !["what", "help"].includes(c)
      );
      const randomCommand = cmds[Math.floor(Math.random() * cmds.length)];
      return (
        "Are you looking for the <span class='highlight'>" +
        randomCommand +
        "</span> command?"
      );
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
    return "You can contact me via mail at <a href='mailto:matthias.harzer03@gmail.com'>matthias.harzer03@gmail.com</a>";
  },
  help: () => {
    return `Available commands: ${Object.keys(commands)
      .map((c) => `<span class='highlight'>${c}</span>`)
      .join(", ")}`;
  },
};
const helpSuggestions = Object.keys(commands);
let previouseSuggestion = "";

const handleCommand = (command) => {
  if (command in commands) {
    return commands[command]();
  } else {
    return `<span class='highlight error'>Unknown command:</span> ${command}`;
  }
};

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

  const responseElement = document.createElement("div");
  responseElement.classList.add("response");
  responseElement.innerHTML = response;

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
