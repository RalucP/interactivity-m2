import { Points } from '../../ixfx/geometry.js';
import { interpolate, clamp } from '../../ixfx/data.js';
import * as Util from './util.js';

const settings = Object.freeze({
  agitationDecay: 0.99
});

/**
 * Define our thing
 * @typedef {{
 *  position: Points.Point
 *  width: number
 *  el: HTMLElement
 * }} Thing
 */

/**
 * @typedef {{ 
 *  dragging: boolean
 *  position: Points.Point
 *  el: HTMLElement
 * }} Draggable
 */


/**
 * Make use of data from `thing` somehow...
 * @param {Thing} thing 
 */
export const use = (thing) => {
  const { el, position } = thing;

  // Calculate top-left pos from relative center position
  Util.positionFromMiddle(el, position);
};

/**
 * Updates a given thing based on state
 * @param {Thing} thing
 * @param {import('./script.js').State} ambientState
 * @returns {Thing}
 */
export const update = (thing, ambientState) => {
  const { agitationDecay } = settings;
  let { width } = thing;


  thing.el.style.width = `${thing.width}px`

  // Return new Thing
  return Object.freeze({
    ...thing,
    width
  });
};

/**
 * Creates a new thing
 * @param {number} id
 * @returns {Thing}
 */
export const create = (id) => {
  const element = document.createElement(`div`);
  element.classList.add(`fill`);
  const border = /** @type HTMLElement */ (document.querySelector(".border"));
  border.append(element);

  console.log(border.getBoundingClientRect().x / window.outerWidth);

  return {
    position: { x: 0, y: 0.0165 },
    width: 10,
    el: element
  };
};