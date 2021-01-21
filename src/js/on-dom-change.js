const debug = true;

const observables = [];     // eg. { change: remove, node: HTMLInputElement, callback }


/**
 * registers a callback for a DOM change on a specific node
 *
 * @param {'remove' | 'insert' | 'all' } change - node inserted, removed or any DOM change
 * @param {HTMLElement | undefined} node - specific node or any
 * @returns {void}
 */

export function addDOMListener(change, node=false, callback) {
    // check for duplicate observable
    const exists = observables.some(entry => entry.change === change && entry.node === node);
    if (!exists)
        observables.push({ change: change, node: node, callback: callback });
}


// Create an observer instance linked to the callback function
const observer = new MutationObserver(mutationsList => {
    mutationsList.forEach(mutation => {
        mutation.removedNodes.forEach((node) => {
            // removal of node detected
            if (debug) console.debug('element removed:', node);

            const matchingCallbacks = observables.filter(entry => entry.change === 'remove' && (entry.node === node));
            matchingCallbacks.forEach(observable => {
                if (debug) console.debug('element removed:', node);
            });
            if (node === nodeInObservablesList) {

                executeCallback(callback);
            }
        });
    });
});

// Start observing for any and all DOM changes
observer.observe(document.querySelector('body'), { childList: true });
