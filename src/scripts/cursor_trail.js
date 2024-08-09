import {roundToNearest} from "./util.js";

const background = document.querySelector("#background");

const CHARACTERS = ["0", "1"];
const TRAIL_SIZE = 15;
/**
 * @type {Record.<string, {character?: string, timeoutId?: number}>}
 */
const interactionCache = {};
let lastPosition = null;
const queue = [];
let queueRunning = false;

/**
 * @param {number} x
 * @param {number} y
 * @param {number} lastX
 * @param {number} lastY
 * @returns {[number, number][]}
 */
const getTrailPositions = (x, y, lastX, lastY) => {
    const startX = roundToNearest(lastX, TRAIL_SIZE);
    const startY = roundToNearest(lastY, TRAIL_SIZE);

    const positions = [];

    let currentX = startX;
    let currentY = startY;

    while (currentX !== x || currentY !== y) {
        positions.push([currentX, currentY]);

        if (currentX < x) {
            currentX += TRAIL_SIZE;
        } else if (currentX > x) {
            currentX -= TRAIL_SIZE;
        }

        if (currentY < y) {
            currentY += TRAIL_SIZE;
        } else if (currentY > y) {
            currentY -= TRAIL_SIZE;
        }
    }

    return positions;
}

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

const processNextQueue = () => {
    if (queue.length === 0) {
        queueRunning = false;
        return;
    }

    const numToProcess = queue.length / 5;

    for (let i = 0; i < numToProcess; i++) {
        const [x, y] = queue.shift();
        addTrail(x, y);
    }
}

const addToQueue = (x, y) => {
    queue.push([x, y]);

    const animationFrame = () => {
        if (!queueRunning) return;
        processNextQueue();
        requestAnimationFrame(animationFrame);
    }
    if (!queueRunning) {
        queueRunning = true;
        requestAnimationFrame(animationFrame);
    }
}


document.addEventListener("mousemove", (e) => {
    const x = roundToNearest(e.clientX, TRAIL_SIZE);
    const y = roundToNearest(e.clientY, TRAIL_SIZE);

    if (lastPosition) {
        const [lastX, lastY] = lastPosition;
        const trailPositions = getTrailPositions(x, y, lastX, lastY);

        for(const [x, y] of trailPositions) {
            addToQueue(x, y);
        }
    } else {
        addToQueue(x, y);
    }

    lastPosition = [x,y]
});
