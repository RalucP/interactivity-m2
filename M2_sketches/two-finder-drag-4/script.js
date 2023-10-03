import { Points, radianToDegree, Triangles } from "../../ixfx/geometry.js";
import { reconcileChildren, DataTable } from '../../ixfx/dom.js';
import { numberTracker, pointsTracker, pointTracker, TrackedPointMap, clamp, scale } from "../../ixfx/data.js";
import { setText, pc, value, toRelativePoint } from "./util.js";
import * as Things from './thing.js';

const settings = Object.freeze({
    currentPointsEl: /** @type {HTMLElement} */(document.querySelector(`#current-points`)),
    startPointsEl: /** @type {HTMLElement} */(document.querySelector(`#start-points`)),
    centroidEl: document.querySelector(`#centroid`),
    startCentroidEl: document.querySelector(`#startCentroid`),
    thingSize: 100,
    distanceThreshold: 10,
    heightTreshold: 150,
});

let state = {
    /** @type {TrackedPointMap} */
    pointers: pointsTracker({ storeIntermediate: false }),
    twoFinger: {
        rotation: numberTracker(),
        distance: numberTracker()
    },
    threeFinger: {
        area: numberTracker()
    },
    centroid: pointTracker(),
    /** @type number */
    centroidAngle: 0,
    isObjectGripped: false,
    /** @type Things.Thing | undefined */
    thing: undefined,
    /** @type {number} */
    offsetDistance: 0
};

const gestureCentroid = (pointers) => {
    if (pointers.size < 2) {
        state.centroid.reset();
        return;
    }
    const centroid = Points.centroid(...pointers.last());
    state.centroid.seen(centroid);
    updateState({
        centroidAngle: radianToDegree(Points.angle(centroid, state.centroid.initial))
    });
};

const gestureThreeFinger = (a, b, c) => {
    if (a === undefined)
        throw new Error(`point a undefined`);
    if (b === undefined)
        throw new Error(`point b undefined`);
    if (c === undefined)
        throw new Error(`point c undefined`);
    const tri = Triangles.fromPoints([a, b, c]);
    state.threeFinger.area.seen(Triangles.area(tri));
    setText(`threePtrArea`, pc(state.threeFinger.area.relativeDifference()));
}

const gestureTwoFinger = (a, b) => {
    if (a === undefined)
        throw new Error(`point a undefined`);
    if (b === undefined)
        throw new Error(`point b undefined`);
    const { twoFinger } = state;
    // Absolute distance between points
    const distanceAbs = Points.distance(a, b); 
    twoFinger.distance.seen(distanceAbs);
    // Calculate rotation
    const rotationAbs = radianToDegree(Points.angle(a, b));
    twoFinger.rotation.seen(rotationAbs / 180);
};

const use = () => {
    const { thing, centroid, twoFinger, isObjectGripped, offsetDistance} = state;
    const { distanceThreshold, heightTreshold } = settings;
    
    const thingPosX = /** @type number */(thing?.position.x) * window.innerWidth;
    const thingPosY = /** @type number */(thing?.position.y) * window.innerHeight - (parseInt(/** @type string */ (thing?.el.style.height)) / 2);
    
    const thingIntervalXMin = /** @type number */(thing?.position.x) * window.innerWidth - (parseInt(/** @type string */ (thing?.el.style.width)) / 2);
    const thingIntervalXMax = /** @type number */(thing?.position.x) * window.innerWidth + (parseInt(/** @type string */ (thing?.el.style.width)) / 2);

    const distance = /** @type {Number} */ (twoFinger.distance.values[1]);

    if (thingIntervalXMin < centroid.last.x &&
        thingIntervalXMax > centroid.last.x && 
        Math.abs(thingPosY - centroid.last.y) < distanceThreshold &&
        Math.abs(distance) < heightTreshold) {
            
            // Add this offset to the thing's original 
            // position to get the new position.
            let finalThing;
            let updatedPosition
            if (isObjectGripped) {
                const updatedPosX = (centroid.last.x + (offsetDistance))/window.innerWidth;
                const updatedPosY = (centroid.last.y/window.innerHeight) + (( parseInt(/** @type string */ (thing?.el.style.height)) / 2) / window.innerHeight );
                updatedPosition = {x: updatedPosX, y: updatedPosY};
            } else {
                const updatedPosX = (centroid.last.x - (thingPosX - centroid.last.x))/window.innerWidth;
                const updatedPosY = (centroid.last.y/window.innerHeight) + (( parseInt(/** @type string */ (thing?.el.style.height)) / 2) / window.innerHeight );
                updatedPosition = {x: updatedPosX, y: updatedPosY};
            }
            
            // Update the thing in state.things according to its id
            finalThing = updateThingInState({ position: updatedPosition });           
            
            if (finalThing) {
            // Visually update
            Things.use(finalThing);
            }

            //"object" gripped
            if (!isObjectGripped) {
                updateState({ isObjectGripped: true, offsetDistance: thingPosX - centroid.last.x})
            }
    }
    else {
        //"object" no gripped
        if (isObjectGripped) {
            updateState({ isObjectGripped: false })
        }  
    }

};

const update = () => {
    const { pointers } = state;
    gestureCentroid(pointers);

    // Pointers sorted by age, oldest first
    const byAge = [...pointers.trackedByAge()];

    /*if(byAge.length === 5) {
        setText('console', "Five fingers")
    }
    if(byAge.length === 4) {
        gestureThreeFinger(byAge[0].last, byAge[1].last, byAge[2].last);
        setText('console', "Four fingers")
    }*/

    if(byAge.length === 3) {
        gestureThreeFinger(byAge[0].last, byAge[1].last, byAge[2].last);
    }
    else{
        state.threeFinger.area.reset();
    }

    if (byAge.length === 2) {
        // Got at least two touches
        gestureTwoFinger(byAge[0].last, byAge[1].last);
    }
    else {
        // Reset state regarding two-finger gestures
        state.twoFinger.distance.reset();
        state.twoFinger.rotation.reset();
    }
    const displayMap = new Map();

    for (const v of byAge) {
        if (v === undefined)
            continue;
        const latestPoint = v.last;
        displayMap.set(v.id, {
            id: v.id,
            length: Math.round(v.length),
            angle: Math.round(latestPoint ? radianToDegree(Points.angle(latestPoint, v.initial)) : Number.NaN)
        });
    }

    DataTable.fromList(`#pointers`, displayMap);
    // Update visuals
    draw();
};
const draw = () => {
    const { centroidEl, startCentroidEl, thingSize, currentPointsEl, startPointsEl } = settings;
    const { pointers } = state;
    const { centroid, twoFinger } = state;
    // Create or remove elements based on tracked points

    if (!currentPointsEl) return;
    reconcileChildren(currentPointsEl, pointers.store, (trackedPoint, element) => {
        if (element === null) {
            element = document.createElement(`div`);
            element.textContent = trackedPoint.id;
        }
        positionElement(element, trackedPoint, thingSize);
        return element;
    });

    if (!startPointsEl) return;
    reconcileChildren(startPointsEl, pointers.store, (trackedPoint, element) => {
        if (element === null) {
            element = document.createElement(`div`);
            element.textContent = trackedPoint.id;
        }
        const initial = trackedPoint.initial;
        if (initial)
            positionElement(element, initial, thingSize);
        return element;
    });

    // Update centroid circle
    const centroidTravelElement = document.querySelector(`#centroidTravel`);
    if (centroidTravelElement)
        centroidTravelElement.textContent = value(centroid.distanceFromStart());
    if (centroid.initial === undefined) {
        positionElement(startCentroidEl, { x: -1000, y: -1000 }, thingSize);
    }
    else {
        positionElement(startCentroidEl, centroid.initial, thingSize);
    }
    if (centroid.last === undefined) {
        positionElement(centroidEl, { x: -1000, y: -1000 }, thingSize);
    }
    else {
        positionElement(centroidEl, centroid.last, thingSize);
    }

    setText(`twoPtrDistance`, pc(twoFinger.distance.relativeDifference()));
    setText(`twoPtrRotation`, pc(twoFinger.rotation.difference()));
    setText(`centroidAngle`, value(state.centroidAngle));

};
const stopTrackingPoint = (event) => {
    state.pointers.delete(event.pointerId.toString());
    update();
};

const trackPoint = (event) => {
    if (event.pointerType === `mouse`) return;
    event.preventDefault();
    const { pointers } = state;
    if ([...pointers.trackedByAge()].length > 5) return;
    // Track point, associated with pointerId
    pointers.seen(event.pointerId.toString(), { x: event.x, y: event.y });
    update();
    use();
};
/**
 * Position element
 */
const positionElement = (element, point, size) => {
    if (!element) return;
    element.style.left = (point.x - size / 2) + `px`;
    element.style.top = (point.y - size / 2) + `px`;
};

const setup = () => {

    const thing = Things.create(1);
    updateState({thing});

    // Update things at a fixed rate
    setInterval(() => {
        let { thing } = state;

        // Update all the things
        thing = Things.update(/** @type Things.Thing */(thing));

        // Save updated things into state
        updateState({ thing });

        Things.use(thing);

    }, 10);

    document.addEventListener(`pointerup`, event => stopTrackingPoint(event));
    document.addEventListener(`pointerleave`, event => stopTrackingPoint(event));
    document.addEventListener(`pointerdown`, event => trackPoint(event));
    document.addEventListener(`pointermove`, event => trackPoint(event));
    document.addEventListener(`contextmenu`, event => event.preventDefault());
};
setup();

/**
 * Update a given thing by its id. The
 * updated thing is returned,  or _undefined_
 * if it wasn't found.
 * @param {Partial<Things.Thing>} updatedThing 
 */
function updateThingInState(updatedThing) {
    let completedThing;
  
    completedThing = {
        ...state.thing,
        ...updatedThing
      };
  
    // Save changed things
    updateState({ thing: completedThing });
    return state.thing;
  }

/**
 * Update state
 */
function updateState(s) {
    state = Object.freeze({
        ...state,
        ...s
    });
}
//# sourceMappingURL=script.js.map