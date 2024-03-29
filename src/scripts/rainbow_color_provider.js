/**
 * @fileoverview This file provides a continous rainbow color provider.
 */

/**
 * @typedef {[number, number, number]} RGBColor
 */
/**
 * @callback Unsubscriber
 * @returns {void}
 */
/**
 * @callback ColorCallback
 * @param {RGBColor} color
 * @returns {void}
 */

/**
 * @type {ColorCallback[]}
 */
const callbacks = [];

/**
 * Add a color callback to the list of callbacks.
 * @param {ColorCallback} callback
 * @returns {Unsubscriber}
 */
export const onColorChange = (callback) => {
  callbacks.push(callback);

  return () => {
    const index = callbacks.indexOf(callback);
    if (index >= 0) {
      callbacks.splice(index, 1);
    }
  };
};

/**
 * Set the current rainbow color.
 * @param {RGBColor} color
 */
export const setColor = (color) => {
  rainbowEnabled = false;
  notify(color);
};

/**
 * Notify all callbacks with the given color.
 * @param {boolean} enabled
 */
export const setRainbowEnabled = (enabled) => {
  rainbowEnabled = enabled;

  if (!enabled) {
    currentColor = [100, 0, 255];
    index = 0;
  }
};

const notify = (color) => {
  callbacks.forEach((callback) => callback(color));
};

const saveMod = (m, n) => ((m % n) + n) % n;

let rainbowEnabled = true;
let currentColor = [100, 0, 255];
let index = 0;

setInterval(() => {
  if (!rainbowEnabled) return;
  const previousIndex = saveMod(index - 1, 3);

  if (currentColor[index] >= 255) {
    currentColor[index] = 255;
    currentColor[previousIndex] -= 1;
    if (currentColor[previousIndex] <= 0) {
      currentColor[previousIndex] = 0;
      index = saveMod(index + 1, 3);
      delta *= -1;
    }
  } else {
    currentColor[index] += 1;
  }

  notify(currentColor);
}, 50);
