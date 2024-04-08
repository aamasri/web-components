const debug = false;

import store from "./store";


export async function authenticate(userInput) {
    try {
        const superagent = (await import(/* webpackChunkName: "superagent" */ 'superagent')).default;
        const { body } = await superagent('post', store.data.app.api + 'authenticate').send(userInput).timeout(9000);

        if (debug) console.debug('authenticate returned header', header);

        if (body.token) {
            store.app.password = undefined;
            storeClientData(body);
            applyAuthStatus();
        }

        return body;

    } catch (error) {
        // error.timeout
        // error.status
        // error.code
        // error.hostname
        // error.response

        store.app.jwt = undefined;

        if (debug) console.debug('caught authentication error', error);

        let errorMessage;

        if (error.timeout)
            errorMessage = `Sorry, the server didn't respond, please try to authenticate again`;
        else if (error.message)
            errorMessage = `Authentication failed with: ${error.message}`;
        else if (error.status) {               // server responded with http error code eg. 30x, 40x, 50x
            const HTTP = (await import(/* webpackChunkName: "http-codes" */ '../constants/http-codes')).default;
            errorMessage = `Authentication failed with ${HTTP[error.status]} (HTTP code ${error.status})`;
        }
        else
            errorMessage = `Authentication failed because the server is unreachable or unresponsive.`;

        console.error(errorMessage);
        return { message: errorMessage, status: 'error' };
    }
}




window.logout = () => {
    store.clear();
    if (!/\/login$/.test(window.location.href))
        window.location.href = '/login';
}





function storeClientData(result) {
    const data = { app: { jwt: result.token }, user: {} };

    for (let field of [ 'name', 'email', 'cell', 'accounts' ]) {
        data.user[field] = result.user[field];
    }

    store.save(data);
}




export function loggedIn() {
    applyAuthStatus();
    return store.app.jwt ?? false;
}




export function applyAuthStatus() {
    if (store.app.jwt) {
        document.querySelector('body').classList.add('loggedIn');
        document.querySelectorAll('.disabled-when-logged-in').forEach(el => el.disabled = true);
        document.querySelectorAll('[href$="/login"]').forEach(el => {
            el.innerHTML = 'Logout';
            el.setAttribute('onclick', 'window.logout(); return false;');
        });
    } else {
        document.querySelector('body').classList.remove('loggedIn');
        document.querySelectorAll('.disabled-when-logged-in').forEach(el => el.disabled = false);
        document.querySelectorAll('[href$="/login"]').forEach(el => {
            el.innerHTML = 'Sign In';
            el.onclick = '';
        });
    }
}