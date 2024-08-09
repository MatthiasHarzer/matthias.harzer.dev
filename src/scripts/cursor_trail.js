import {roundToNearest} from "./util.js";

const background = document.querySelector("#background");

const CHARACTERS = ["0", "1"];
const TRAIL_SIZE = 15;
/**
 * @type {Record.<string, {character?: string, timeoutId?: number}>}
 */
const interactionCache = {};

const addTrail = (x, y) => {
    const id = `${x}-${y}`;

    if (!interactionCache[id]) {
        interactionCache[id] = {};
    }
    const cache = interactionCache[id];

    if (!cache.character){
        cache.character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    }

    const cursorTrail = document.createElement("div");
    cursorTrail.classList.add("cursor-trail");
    cursorTrail.innerText = cache.character;
    cursorTrail.style.left = `${x}px`;
    cursorTrail.style.top = `${y}px`;
    background.appendChild(cursorTrail);

    clearTimeout(cache.timeoutId);
    cache.timeoutId = setTimeout(() => {
        background.removeChild(cursorTrail);
        delete cache.character
    }, 1500);
}

document.addEventListener("mousemove", (e) => {
    const x = roundToNearest(e.clientX, TRAIL_SIZE);
    const y = roundToNearest(e.clientY, TRAIL_SIZE);

    addTrail(x, y);
});
