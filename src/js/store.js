const debug = true;
const store = {};

const tempInitial = {              // ephemeral data
    password: null,
};

const appInitial = {       // app initial state
    username: '',           // cell or email
    password: null,
    jwt: null,
    plan: '',
    industry: '',
    organization: '',
    otherIndustry: '',
    subDomain: ''
};

const userInitial = {       // store (initial) state
    name: '',
    email: '',
    cell: '',
    accounts: []        // related account ids
}

const accountsInitial = {       // store (initial) state
    accounts: [
        /* {
            id: '',     // unique eg. park
            plan: '',
            industry: '',
            organization: '',
            otherIndustry: '',
            app: 'stagepay',
            accountBalance: '',
            billingStatus: '',
            autoPay: '',
        } */
    ]
};



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
function init() {
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
    init();   // reinitialize store data
};


init();   // initialize store data

export default store;