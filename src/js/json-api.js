/*
    Provides an intuitive client-side CRUD that uses native fetch under the hood to make JSON REST API calls.

    Advantages over native fetch are:
        - a promise API that throws on 4xx/5xx errors (not just connection failures)
        - handles JSON encoding/decoding
        - can optionally growl on failure and/or success
        - uniform return object shape (on success or fail):
            {
                status: string (HTTP status code)
                message: string
                data: object
            }

    Eg. apiDelete('timesheets', [3342, 5098])
            .then(response => {
                console.log(response);
            }).catch((response) => {
                console.log(response);
            });
*/


const debug = false;

import {
    incrementLoadingComplete,
    incrementLoadingCount
} from '../svelte/components/PageProgress/pageProgressStore.js';


export async function apiRead(url, filters={}) {
    let queryString = '';
    for (let filter in filters)
        queryString += `&${filter}=${encodeURIComponent(filters[filter])}`;

    queryString = queryString.replace(/^&/, '?');

    try {
        return await jsonFetchApi(url + queryString, 'GET');
    }
    catch(response) {
        throw response;
    }
}



export async function apiCreate(tableOrEndpoint, payload, notifyUser=false) {
    const url = tableOrEndpoint.includes('/') ? `${tableOrEndpoint}` : `/api/${tableOrEndpoint}`;

    try {
        const response = await jsonFetchApi(url, 'POST', payload)
        if (notifyUser)
            notify(response.message || `Saved`, 'success');
        else
            return response;
    }
    catch(response) {
        if (notifyUser)
            notify(response.message ? `Saving failed with ${response.message}` : 'for some unknown reason', 'error');
        else
            throw response;
    }
}


// the default endpoint is /api/table/id,
// but we may specify a bulk entity update with a custom endpoint and filter
export async function apiUpdate(tableOrEndpoint, idOrFilter, payload, notifyUser=false) {
    if (typeof idOrFilter === 'object') {
        let queryString = '';
        for (let filter in idOrFilter)
            queryString += `&${filter}=${encodeURIComponent(idOrFilter[filter])}`;

        idOrFilter = queryString.replace(/^&/, '?');
    }

    // support both single (table/id) and bulk (endpoint/querystring) style updates
    const url = tableOrEndpoint.includes('/') ? `${tableOrEndpoint}${idOrFilter}` : `/api/${tableOrEndpoint}/${idOrFilter}`;

    try {
        const response = await jsonFetchApi(url, 'PATCH', payload)
        if (notifyUser)
            notify(response.message || `Saved`, 'success');

        return response;
    } catch(response) {
        if (notifyUser)
            notify(response.message ? `Saving failed with ${response.message}` : 'for some unknown reason', 'error');
        else
            throw response;
    }
}



export async function apiDelete(tableOrEndpoint, ids, notifyUser=false) {
    // handle multiple ids in a single request
    if (Array.isArray(ids))
        ids = '?ids=' + encodeURIComponent(ids.join(','));

    // support both single (table/id) and bulk (endpoint/querystring) style updates
    const url = tableOrEndpoint.includes('/') ? `${tableOrEndpoint}${ids}` : `/api/${tableOrEndpoint}/${ids}`;

    try {
        const response = jsonFetchApi(url, 'DELETE');
        if (notifyUser)
            notify(response.message || `Deleted`, 'success');
        else
            return response;
    }
    catch(response) {
        if (notifyUser)
            notify(response.message ? `Deletion failed with ${response.message}` : 'for some unknown reason', 'error');
        else
            throw response;
    }
}



export async function jsonFetchApi(url, method='GET', payload={}) {
    incrementLoadingCount();

    const acceptableMethods = ['HEAD', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
    if (!acceptableMethods.includes(method))
        throw `fn betterFetch expects method to be one of ${acceptableMethods.join(', ')}`;

    const requestIsJson = !(payload instanceof FormData);
    const fetchOptions = { method: method};
    if (requestIsJson)
        fetchOptions.headers =  { 'Content-Type': 'application/json' };

    // HEAD/GET are not allowed to have a body
    if ([ 'POST', 'PATCH', 'PUT' ].includes(method))
        fetchOptions.body = requestIsJson ? JSON.stringify(payload) : payload;

    try {
        const response = await fetch(url, fetchOptions);
        const contentType = response.headers.get('content-type') || '';
        const responseIsJson = contentType.includes('application/json') && response.status !== 204; // status 204 means no response will be sent
        const data = responseIsJson ? await response.json() : null;
        incrementLoadingComplete();

        if (response.ok) {       // HTTP 2xx type server response
            if (debug) console.log(`${method} ${url} ${response.status} returned`, data);
            return {
                status: response.status,
                message: (data && data.message) || '',
                data: data
            };
        } else {                  // HTTP 4xx, 5xx type server response
            if (debug) console.warn(`${method} ${url} returned ${response.status}`, data);

            throw {
                status: response.status,
                message: data ? `${data.message || ''} ${data.detail || ''}` : `${method} ${url} returned ${response.status}`,
                data: {}
            }
        }
    } catch(error) {
        if (debug) console.error(`${method} ${url} failed with ${error.message || error.status || ''}`);
        incrementLoadingComplete();
        throw {
            status: error.status,
            message: error.message.trim(),
            data: {}
        }
    }
}



// growl wrapper
export function notify(message, type, target=undefined, duration=undefined) {
    import(/* webpackChunkName: "growl" */ 'growl-js').then((module) => {
        const growl = module.default;
        const options = {
            message: message,
            type: type,
            duration: duration,
            target: target
        };
        growl(options);
    })
    .catch(error => { throw `loading growl failed with: ${error.message}`; });
}