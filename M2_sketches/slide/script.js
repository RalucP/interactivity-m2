import { Points } from '../../ixfx/geometry.js';
import * as Things from './thing.js';
import * as Util from './util.js';

// Settings for sketch
const settings = Object.freeze({
  thingUpdateSpeedMs: 10,
});

/** 
 * @typedef {{
 *  thing: Things.Thing
 *  widthMax: number
 * }} State
 */

/**
 * @type {State}
 */
let state = Object.freeze({
  thing: Things.create(1),
  widthMax: 0,
});

/**
 * Makes use of the data contained in `state`
 */
const use = () => {};

const update = () => {
  // 1. Recalcuate state
  // 2. Save state
  // saveState({ ... });
  // 3. Use it
  use();

  // Loop!
  setTimeout(update, 10);
};

/**
 * Triggered on 'pointerdown' on a 'thing' HTML element
 * @param {PointerEvent} event 
 */
const onDragStart = (event) => {

  const pointerMove = (event) => {
    const pointerPosition = Util.relativePoint(event.clientX, event.clientY);

    const finalThing = updateThingInState( {width: pointerPosition.x * state.widthMax} );

    console.log(pointerPosition.x * state.widthMax, state.thing.width)
    

    if (finalThing) {
      // Visually update
      Things.use(finalThing);
    }
  };

  // Dragging...
  document.addEventListener(`pointermove`, pointerMove);

  document.addEventListener(`pointerup`, () => {

    document.removeEventListener('pointermove', pointerMove)
  }, {once: true});

};

const onPointerDown = (event) => {
  const { thing } = state;

  // Was on a Thing!
  onDragStart(event);
};

function setup() {

  const computedStyle = getComputedStyle(/** @type HTMLElement */(document.querySelector(".fill")))
  const widthMax = parseFloat(computedStyle.getPropertyValue('width'))

  document.addEventListener(`pointerdown`, onPointerDown);

  saveState({ widthMax })

  // Update things at a fixed rate
  setInterval(() => {
    let { thing } = state;

    // Update all the things
    thing = Things.update(thing, state);

    // Save updated things into state
    saveState({ thing });

    // Visually update based on new state
    Things.use(thing);
  }, settings.thingUpdateSpeedMs);

  // Update state of sketch and use state
  // at full speed
  update();
};

setup();

/**
 * Save state
 * @param {Partial<State>} s 
 */
function saveState (s) {
  state = Object.freeze({
    ...state,
    ...s
  });
}

/**
 * Update a given thing by its id. The
 * updated thing is returned,  or _undefined_
 * if it wasn't found.
 * @param {Partial<Things.Thing>} updatedThing 
 * @returns {Things.Thing|undefined}
 */
function updateThingInState(updatedThing) {
  let completedThing;

  const thing = completedThing = {
      ...state.thing,
      ...updatedThing
    };

  // Save changed things
  saveState({thing: thing});
  return completedThing;
}