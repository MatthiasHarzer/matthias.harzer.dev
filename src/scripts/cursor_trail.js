import {roundToNearest} from "./util.js";

const background = document.querySelector("#background");

const CHARACTERS = ["0", "1"];
const TRAIL_SIZE = 15;
const mapCache = {};

document.addEventListener("mousemove", (e) => {
    const cursorTrail = document.createElement("div");
    const x = roundToNearest(e.clientX, TRAIL_SIZE);
    const y = roundToNearest(e.clientY, TRAIL_SIZE);

    const cacheX = mapCache[x] || {};
    const character = cacheX[y] || CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

    cacheX[y] = character;
    mapCache[x] = cacheX;

    cursorTrail.classList.add("cursor-trail");
    cursorTrail.innerText = character;
    cursorTrail.style.left = `${x}px`;
    cursorTrail.style.top = `${y}px`;
    background.appendChild(cursorTrail);

    setTimeout(() => {
        background.removeChild(cursorTrail);
    }, 1500);
});
