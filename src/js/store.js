const store = { data: {} };



/** persist store.data to localStorage */
store.save = function (data) {
    if (typeof data.temp === 'object')
        window.sessionStorage.setItem('tempStore', JSON.stringify(data.temp));

    if (typeof data.app === 'object')
        window.localStorage.setItem('appStore', JSON.stringify(data.app));

    if (typeof data.user === 'object')
        window.localStorage.setItem('userStore', JSON.stringify(data.user));

    if (typeof data.accounts === 'object')
        window.localStorage.setItem('accountsStore', JSON.stringify(data.accounts));
};




/** (re)initialize store */
store.init = function (schema) {
    // load any existing store from localStorage
    store.data = window.localStorage.store ? JSON.parse(window.localStorage.store) : {};

    // add any missing schema items and default data
    for (const [key1, value1] of Object.entries(schema)) {
        console.log(`${key1}: ${value1}`);

        if (!store.data[key1]) {
            store.data[key1] = value1;
            continue;
        }

        // patch the store from the schema
        if (isIterable(value1)) {
            for (const [ key2, value2 ] of value1) {

            }
        }


    }

    window.localStorage.store = JSON.stringify(store.data);
    console.log(store.data);
    return;

    store.temp = window.sessionStorage.tempStore ? JSON.parse(window.sessionStorage.tempStore) : tempInitial;
    store.app = window.localStorage.appStore ? JSON.parse(window.localStorage.appStore) : appInitial;
    store.user = window.localStorage.userStore ? JSON.parse(window.localStorage.userStore) : userInitial;
    store.accounts = window.localStorage.accountsStore ? JSON.parse(window.localStorage.accountsStore) : accountsInitial;

    // JSON.parse is shallow. Reconstruct encoded arrays
    if (typeof store.accounts === 'string')
        store.accounts = JSON.parse(store.accounts);
}




/** wipe the store, localStorage, & sessionStorage */
store.clear = function () {
    window.localStorage.clear();
    window.sessionStorage.clear();
};



function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}



export default store;