import { Points, radianToDegree, Triangles } from "../../ixfx/geometry.js";
import { reconcileChildren, DataTable } from '../../ixfx/dom.js';
import { numberTracker, pointsTracker, pointTracker, TrackedPointMap, clamp } from "../../ixfx/data.js";
import { setText, pc, value, changeLightness } from "./util.js";
const settings = Object.freeze({
    /** @type HTMLElement | null */
    currentPointsEl: document.querySelector(`#current-points`),
    /** @type HTMLElement | null */
    startPointsEl: document.querySelector(`#start-points`),
    /** @type HTMLElement | null */
    centroidEl: document.querySelector(`#centroid`),
    /** @type HTMLElement | null */
    startCentroidEl: document.querySelector(`#startCentroid`),
    thingSize: 100,
    threshold: 0.6,
});
let state = {
    /** @type {TrackedPointMap} */
    pointers: pointsTracker({ storeIntermediate: false }),
    twoFinger: {
        distance: numberTracker()
    },
    centroid: pointTracker(),
    isPinched: false,
    lightness: 0,
};
const gestureTwoFinger = (a, b) => {
    if (a === undefined)
        throw new Error(`point a undefined`);
    if (b === undefined)
        throw new Error(`point b undefined`);
    const { twoFinger } = state;
    // Absolute distance between points
    const distanceAbs = Points.distance(a, b); // clamp(Points.distance(a, b) / maxDimension)
    twoFinger.distance.seen(distanceAbs);
};
const gestureCentroid = (pointers) => {
    if (pointers.size < 2) {
        state.centroid.reset();
        return;
    }
    const centroid = Points.centroid(...pointers.last());
    state.centroid.seen(centroid);
};

const use = () => {
    const { twoFinger, centroid } = state;
    const { threshold } = settings;
      
    const distance = /** @type number */ (twoFinger.distance.relativeDifference());

}

const update = () => {
    const { pointers, lightness } = state;
    gestureCentroid(pointers);
    // Pointers sorted by age, oldest first
    const byAge = [...pointers.trackedByAge()];
    if (byAge.length >= 2) {
        // Got at least two touches
        gestureTwoFinger(byAge[0].last, byAge[1].last);
    }
    else {
        // Reset state regarding two-finger gestures
        state.twoFinger.distance.reset();
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
};
const draw = () => {
    const { centroidEl, startCentroidEl, thingSize, currentPointsEl, startPointsEl, threshold } = settings;
    const { pointers } = state;
    const { centroid, twoFinger, initialLightness, lightness } = state;
    // Create or remove elements based on tracked points
    if (!currentPointsEl)
        return;
    reconcileChildren(currentPointsEl, pointers.store, (trackedPoint, element) => {
        if (element === null) {
            element = document.createElement(`div`);
            element.textContent = trackedPoint.id;
        }
        positionElement(element, trackedPoint, thingSize);
        return element;
    });
    if (!startPointsEl)
        return;
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
        centroidTravelElement.textContent = `(${centroid.initial?.x}, ${centroid.x})`;
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

    const distance = /** @type number */ (twoFinger.distance.relativeDifference());

    if(distance <= threshold){
        updateState({isPinched: true})

        const centroidX = /** @type {Number}*/(centroid.x);
        const clampedCentroidX = clamp(centroidX, 0, 900);
        let newLightness = 0;
            newLightness = clampedCentroidX / 10;
        if (newLightness > 100)
            newLightness = 100;
        else if (newLightness < 0)
            newLightness = 0;
        updateState({ lightness: newLightness });
        changeLightness(lightness);
    }
    else {
        updateState({isPinched: false})
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
    if (event.pointerType === `mouse`)
        return;
    event.preventDefault();
    const { pointers } = state;
    // Track point, associated with pointerId
    pointers.seen(event.pointerId.toString(), { x: event.x, y: event.y });
    update();
};
/**
 * Position element
 */
const positionElement = (element, point, size) => {
    if (!element)
        return;
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