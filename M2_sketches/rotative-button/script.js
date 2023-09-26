import { Points, radianToDegree, Triangles } from "../../ixfx/geometry.js";
import { reconcileChildren, DataTable } from '../../ixfx/dom.js';
import { numberTracker, pointsTracker, pointTracker, TrackedPointMap, clamp, scale } from "../../ixfx/data.js";
import { setText, pc, value } from "./util.js";
const settings = Object.freeze({
    currentPointsEl: /** @type {HTMLElement} */(document.querySelector(`#current-points`)),
    startPointsEl: /** @type {HTMLElement} */(document.querySelector(`#start-points`)),
    thingSize: 100,
    distanceThreshold: 0.8,
    hue: 330,
    saturation: 64,
    
});
let state = {
    /** @type {TrackedPointMap} */
    pointers: pointsTracker({ storeIntermediate: false }),
    twoFinger: {
        rotation: numberTracker(),
        distance: numberTracker()
    },
    lightness: 87,
    initialLightness: 87,
    startRotation: -1000, //default value for no rotation
    isObjectGripped: false,
};
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
    const { pointers, twoFinger, isObjectGripped, startRotation, lightness, initialLightness } = state;
    const { distanceThreshold } = settings;

    //twoFinger.distance.relativeDifference()
    const distance = /** @type {Number} */ (twoFinger.distance.relativeDifference());
    if (distance < distanceThreshold){
        //"object" gripped
        if (!isObjectGripped) 
            updateState({ startRotation: twoFinger.rotation.difference(), isObjectGripped: true })
        else {
            const currentRotation = /** @type {Number}*/(twoFinger.rotation.difference());
            let newLightness = initialLightness + (currentRotation * 100);
            if (newLightness > 100)
                newLightness = 100;
            else if (newLightness < 0)
                newLightness = 0;
            updateState({ lightness: newLightness });
            setText('console', `lightness: ${lightness}`);
        }

    }
    else {
        //"object" no gripped
        if (isObjectGripped) {
            updateState({ startRotation: 0, isObjectGripped: false })
        }   
    }
};

const update = () => {
    const { pointers, lightness } = state;
    const { hue, saturation} = settings;
    // Pointers sorted by age, oldest first
    const byAge = [...pointers.trackedByAge()];
    if (byAge.length >= 2) {
        // Got at least two touches
        gestureTwoFinger(byAge[0].last, byAge[1].last);
    }
    else {
        // Reset state regarding two-finger gestures
        state.twoFinger.distance.reset();
        state.twoFinger.rotation.reset();
        updateState({ initialLightness: lightness });
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
    document.body.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    // @ts-ignore
    //setText('console', `pointers: ${[JSON.stringify(...pointers.trackedByAge())]}`);
};
const draw = () => {
    const { thingSize, currentPointsEl, startPointsEl } = settings;
    const { pointers } = state;
    const { twoFinger } = state;
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
    setText(`twoPtrDistance`, pc(twoFinger.distance.relativeDifference()));
    setText(`twoPtrRotation`, pc(twoFinger.rotation.difference()));
};
const stopTrackingPoint = (event) => {
    state.pointers.delete(event.pointerId.toString());
    update();
};
const trackPoint = (event) => {
    if (event.pointerType === `mouse`) return;
    event.preventDefault();
    const { pointers } = state;
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
    document.addEventListener(`pointerup`, event => stopTrackingPoint(event));
    document.addEventListener(`pointerleave`, event => stopTrackingPoint(event));
    document.addEventListener(`pointerdown`, event => trackPoint(event));
    document.addEventListener(`pointermove`, event => trackPoint(event));
    document.addEventListener(`contextmenu`, event => event.preventDefault());
};
setup();
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