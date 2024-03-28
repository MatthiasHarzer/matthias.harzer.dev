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

const notify = (color) => {
  callbacks.forEach((callback) => callback(color));
};

const saveMod = (m, n) => ((m % n) + n) % n;

const current_color = [100, 0, 255];
let index = 0;
let delta = 1;

setInterval(() => {
  const previous_index = saveMod(index - 1, 3);

  if (current_color[index] >= 255) {
    current_color[index] = 255;
    current_color[previous_index] -= delta;
    if (current_color[previous_index] <= 0) {
      current_color[previous_index] = 0;
      index = saveMod(index + 1, 3);
      delta *= -1;
    }
  } else {
    current_color[index] += delta;
  }

  notify(current_color);
}, 50);
