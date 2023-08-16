const debug = true;

const observables = [];     // eg. { change: remove, node: HTMLInputElement, callback }


/**
 * registers a callback for a DOM change on a specific node
 *
 * @param {'remove' | 'add'} change - node inserted, removed, attributes changed, text chaages or any DOM change
 * @param {NodeList | HTMLElement | string} node - node(s) or selector
 * @param {function | string} callback
 * @returns {void}
 */
export function addDOMListener(change, node, callback) {
    // check for duplicate observable
    const exists = observables.some(entry => entry.change === change && entry.node === node);
    if (!exists)
        observables.push({ change: change, node: node, callback: callback });
}


// Create an observer instance linked to the callback function
const observer = new MutationObserver(mutationsList => {
    mutationsList.forEach(mutation => {
        mutation.removedNodes.forEach(node => {
            if (debug) console.debug('mutation observer detected element removal:', node);

            const matchingCallbacks = observables.filter(entry => entry.change === 'remove' && nodeIs(node, entry.node));
            matchingCallbacks.forEach(observable => {
                if (debug) console.debug(`  invoking ${observable.callback} callback for the removed node`);

                // execute the node removed callback
                if (typeof observable.callback === 'function')
                    observable.callback.apply(this, node);
                else if (typeof observable.callback === 'string')
                    observable.callback(node);

                // remove the observable entry if it was the removed node
                if (observable.node instanceof HTMLElement) {
                    const index = observables.indexOf(observable);
                    observables.splice(index, 1);
                }
            });
        });

        mutation.addedNodes.forEach(node => {
            if (debug) console.debug('mutation observer detected element addition:', node);

            const matchingCallbacks = observables.filter(entry => entry.change === 'add' && nodeIs(node, entry.node));
            matchingCallbacks.forEach(observable => {
                if (debug) console.debug(`  invoking ${observable.callback} callback for the added node`);

                // execute the node added callback
                if (typeof observable.callback === 'function')
                    observable.callback.apply(this, node);
                else if (typeof observable.callback === 'string')
                    observable.callback(node);
            });
        });
    });
});


// Start observing for any and all DOM changes
observer.observe(document.querySelector('body'), { childList: true, subtree: true });

if (debug) console.debug('installed a mutation observer to watch all nodes');




/**
 * Checks if a specific node:
 *   a. matches a selector,
 *   b. matches a node,
 *   c. is within a collection of nodes
 *
 * @param {HTMLElement} node - DOM element
 * @param {HTMLElement | NodeList | string} nodeOrSelector - node, collection of nodes, or selector
 * @returns {boolean}
 */
function nodeIs(node, nodeOrSelector) {
    if (typeof nodeOrSelector === 'string')
        return node.is(nodeOrSelector);

    if (nodeOrSelector instanceof HTMLElement)
        return node === nodeOrSelector;

    if (nodeOrSelector instanceof NodeList)
        return nodeOrSelector.contains(node);

    return false;
}