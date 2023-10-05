import { Points } from '../../ixfx/geometry.js';
import { interpolate, clamp } from '../../ixfx/data.js';
import * as Util from './util.js';

/**
 * Define our thing
 * @typedef {{
 *  position: Points.Point
 *  mass: number
 * transformOrigin: Points.Point
 *  agitation: number
 *  el: HTMLElement
 * }} Thing
 */


/**
 * Make use of data from `thing` somehow...
 * @param {Thing} thing 
 */
export const use = (thing) => {
  const { el, position, agitation, transformOrigin } = thing;

  // Calculate top-left pos from relative center position
  Util.positionFromMiddle(el,  position);

  // Calculate rotatation based on 'agitation'
  const rot = agitation * 45;
  el.style.rotate = `${rot}deg`;
  el.style.transformOrigin = `${transformOrigin.x}px ${transformOrigin.y}px`;
};

/**
 * Updates a given thing based on state
 * @param {Thing} thing
 * @returns {Thing}
 */
export const update = (thing) => {
  let { agitation} =  thing;
  
  // Return new Thing
  return Object.freeze({
    ...thing,
    agitation
  });
};

/**
 * Creates a new thing
 * @returns {Thing}
 */
export const create = () => {
  const element = document.createElement(`div`);
  element.classList.add(`thing-move`);
  document.body.append(element);

  const mass = 1.5;
  const size = mass * 100 + 100;
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  
  return {
    mass,
    agitation: 0,
    transformOrigin: {x: 0, y: 0},
    position: { x: Math.random(), y: Math.random() },
    el: element
  };
};