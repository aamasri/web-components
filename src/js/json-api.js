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

    Eg. remove('timesheets', [3342, 5098])
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
import {delay} from "./date-utils.js";



export async function get(url, filters={}) {
    let queryString = '';
    for (let filter in filters)
        queryString += `&${filter}=${encodeURIComponent(filters[filter])}`;

    queryString = queryString.replace(/^&/, '?');

    try {
        return await request(url + queryString, 'GET');
    }
    catch(response) {
        throw response;
    }
}



export async function post(tableOrEndpoint, payload, notifyUser=false) {
    const url = tableOrEndpoint.includes('/') ? `${tableOrEndpoint}` : `/api/${tableOrEndpoint}`;

    try {
        const response = await request(url, 'POST', payload)
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
export async function patch(tableOrEndpoint, idOrFilter, payload, notifyUser=false) {
    if (typeof idOrFilter === 'object') {
        let queryString = '';
        for (let filter in idOrFilter)
            queryString += `&${filter}=${encodeURIComponent(idOrFilter[filter])}`;

        idOrFilter = queryString.replace(/^&/, '?');
    }

    // support both single (table/id) and bulk (endpoint/querystring) style updates
    const url = tableOrEndpoint.includes('/') ? `${tableOrEndpoint}${idOrFilter}` : `/api/${tableOrEndpoint}/${idOrFilter}`;

    try {
        const response = await request(url, 'PATCH', payload)
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



export async function remove(tableOrEndpoint, ids, notifyUser=false) {
    // handle multiple ids in a single request
    if (Array.isArray(ids))
        ids = '?ids=' + encodeURIComponent(ids.join(','));

    // support both single (table/id) and bulk (endpoint/querystring) style updates
    const url = tableOrEndpoint.includes('/') ? `${tableOrEndpoint}${ids}` : `/api/${tableOrEndpoint}/${ids}`;

    try {
        const response = request(url, 'DELETE');
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



// low level fetch wrapper
export async function request(url, method='GET', payload={}) {
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
        growl(options).then();
    })
    .catch(error => {
        throw `loading growl failed with: ${error.message}`;
    });
}




// This function makes a request to a (JSONL formatted) streaming API.
// It processes the groups the stream on JSONL chunks, and 'yielding' them back as a 'generator'
export async function* stream(method='POST', url, payload={}) {
    if (![ 'GET', 'POST' ].includes(method))
        throw `fn stream expects the method to be GET or POST`;

    try {
        const options = {
            method: method,
            headers: { 'Accept': 'application/jsonl' }
        }
        const body = (typeof payload === 'string') ? payload : JSON.stringify(payload);
        if (body !== '{}')
            options.body = body;

        const response = await fetch(url, options);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let time = Date.now();

        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;

            buffer += decoder.decode(value, { stream: true });

            // Process JSON chunks
            let boundary;
            while ((boundary = buffer.indexOf('\n')) > -1) {
                const jsonLChunk = buffer.slice(0, boundary).trim();
                buffer = buffer.slice(boundary + 1);    // buffer is now the remainder

                if (jsonLChunk.trim()) {
                    try {
                        if (debug) console.log('JSONL chunk', jsonLChunk);

                        // create a classic throttle effect
                        const timeNow = Date.now();
                        if (timeNow - time < 1000) {
                            time = timeNow;
                            await delay(1);     // 1mS
                        }

                        yield JSON.parse(jsonLChunk);
                    } catch (error) {
                        throw `Parsing JSON chunk failed with: ${error}`;
                    }
                }
            }
        }

        // Process leftovers in the buffer (if any)
        if (buffer.trim()) {
            try {
                yield JSON.parse(buffer);
            } catch (error) {
                throw `The stream may have been truncated as parsing the last chunk failed with: ${error}`;
            }
        }

    } catch(error) {
        console.error(`Streaming from ${url} failed with`, error);
    }
}
