import { scalePercent, clamp } from '../../ixfx/data.js';

/**
 * Convert relative point to absolute.
 * @param {Point} relativePoint
 * @param {Rect} context
 * @returns {Point}
 */
export function toAbsolutePoint(relativePoint, context) {
  return {
    x: relativePoint.x * context.width,
    y: relativePoint.y * context.height
  };
}

/**
 * Convert to relative point, using screen size
 * @param {number} x 
 * @param {number} y 
 * @returns {Point}
 */
export function toRelativePoint(x, y) {
  return {
    x: clamp(x / window.innerWidth),
    y: clamp(y / window.innerHeight)
  };
}

export function setText(id, text, fallback) {
  const element = /** @type {HTMLElement} */(document.querySelector(`#${id}`));
  if (text) {
      element.textContent = text.toString();
  }
  else if (fallback) {
      element.textContent = fallback;
  }
}
export const setHtml = (id, text, fallback) => {
  const element = document.querySelector(`#${id}`);
  if (element !== null) {
      if (text) {
          element.innerHTML = text.toString();
      }
      else if (fallback) {
          element.innerHTML = fallback;
      }
  }
};
export const getContext = (id = `canvas`) => {
  const canvasElement = /** @type {HTMLCanvasElement} */(document.querySelector(`#canvas`));
  const context = canvasElement?.getContext(`2d`);
  if (!context || !canvasElement)
      return;
  return context;
};
/**
* Draws a line from a -> b
* @returns
*/
export const drawLine = (context, a, b) => {
  context.beginPath();
  context.strokeStyle = `black`;
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
};
export const drawDot = (context, a, fillStyle = `black`) => {
  context.fillStyle = fillStyle;
  context.save();
  context.translate(a.x, a.y);
  context.beginPath();
  context.arc(0, 0, 5, 0, Math.PI * 2);
  context.fill();
  context.restore();
};
export const pc = (v) => {
  if (v === undefined)
      return `?`;
  return Math.round(v * 100) + `%`;
};
export const value = (v) => typeof v === `undefined` ? `` : Math.round(v).toString();


//# sourceMappingURL=util.js.map

/** @typedef {{
 * width:number
 * height:number
 * center: Point
 * }} Bounds 
 */

/** @typedef {{
 * width:number
 * height:number
 * }} Rect 
 */

/** @typedef {{
 * x: number
 * y: number
 * }} Point */
