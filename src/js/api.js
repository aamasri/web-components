const debug = false;

import growl from 'growl-js';



/**
 *  set/clear dirty class on inputs that have been updated
 *  // TODO refactor this for mdb controls
 **/
/*
export function highlightDirtyUI(inputs) {
    if (debug) console.debug('highlightDirtyUI', inputs);

    switch (typeof inputs) {
        case 'object':          // element(s)
            break;

        case 'string':          // input data path
            inputs = document.querySelectorAll(`input[data-path='${inputs}']`);
            break;

        case 'undefined':
        default:
            inputs = document.querySelectorAll(`input[data-path]`);
    }

    if (debug) console.debug('  found input[data-path]', inputs.length);

    inputs.forEach(input => {
        let dataPath = input.getAttribute('data-path');

        if (dataPath) {
            let inputVal = input.value();
            let storeVal = objValueFromPath(vuexStore.state, dataPath);

            if (!inputVal || inputVal === storeVal)
                input.classList.remove('dirty');
            else {
                input.classList.add('dirty');
                if (debug) console.debug(`  input ${dataPath} value ${inputVal} <> store value ${storeVal}`);
            }
        }
    });
}
*/






/**
 * Transmit changes to the backend database.
 *
 * @param {Object} payload - entity: { properties }.
 *
 * @returns {Object}
 **/
export async function update(payload) {
    const entity = Object.keys(payload).join('');   // user/account

    const response = await transmit('update', entity, payload);

    if (response.status === 'success') {
        // TODO populate local store


    } else {
        console.error('updateServer() returned', response.message);
        if (response.message)
            growl({ message: response.message, type: 'error' }).then();
    }

    return response
}





/**
 * AJAX api call
 *
 * @param {'create' | 'read' | 'update' | 'delete'} type
 * @param {string} entity - eg. 'user'.
 * @param {Object} payload - document patch.
 *
 * @returns {Object}
 */
async function transmit(type, entity, payload = {}) {
    // insert auth token
    const store = await import(/* webpackChunkName: "store" */ './store');
    if (store.app.jwt)
        payload.token = store.app.jwt;
    else
        return { message: `Sorry, you've been logged out. Please login`, status: 'error' };   // edge case

    if (![ 'user', 'account', 'all' ].includes(entity))
        return { message: `System error: ${entity} is not a recognized entity`, status: 'error' };

    let method, methodDescription;
    switch (type) {
        case 'create':
            method = 'POST';
            methodDescription = 'Creating';
            payload = JSON.stringify(payload);
            break;
        case 'read':
            method = 'GET';
            methodDescription = 'Loading';
            break;
        case 'update':
            method = 'PUT';
            methodDescription = 'Updating';
            payload = JSON.stringify(payload);
            break;
        case 'delete':
            method = 'DELETE';
            methodDescription = 'Deleting';
            break;
        default:
            return { message: `System error: ${type} is not a recognized type`, status: 'error' };
    }

    try {
        const superagent = (await import(/* webpackChunkName: "superagent" */ 'superagent')).default;
        const { body } = await superagent(method, `/api/${entity}`).send(payload).timeout(9000);

        if (body)
            return { message: `${methodDescription} ${entity} succeeded.`, status: 'success', data: body };

        return { message: `${methodDescription} ${entity} failed!`, status: 'error' }

    } catch (error) {
        // error.timeout
        // error.status
        // error.code
        // error.hostname
        // error.response

        if (debug) console.debug('caught http request error', error);

        let errorMessage = `Sorry, ${methodDescription} ${entity} `;

        if (error.timeout) {
            errorMessage += 'timed out';
            console.error(errorMessage);
            return { message: errorMessage, status: 'error' };
        }

        if (error.status === 401) {
            window.dialog = await import(/* webpackChunkName: "dialog" */ '@aamasri/dialog');
            dialog.open({ title: 'Please Re-authorize', source:'/reauthorize', iframe: true });
            return {};
        }

        if (error.status) {               // server responded with http error code eg. 30x, 40x, 50x
            const HTTP = await import(/* webpackChunkName: "http-codes" */ '../constants/http-codes');
            errorMessage += `failed with ${HTTP[error.status]} (HTTP code ${error.status})`;
            return { message: errorMessage, status: 'error' };
        }

        errorMessage += `failed. The server is unreachable or unresponsive.`;
        return { message:errorMessage, status: 'error' };
    }
}
