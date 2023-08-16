import './js/input';
import store from './js/store';

// set store schema and default values
const storeSchema = {
    app: {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZmY4YzU3ZThkOTI2ZDIxOTViZmI3YWEiLCJpYXQiOjE2MTE5NTAyNzd9.lI5-N-Ur8tSzXDeh9WD1FRcMwNkIKCRR1pGj2rKW-QM',
        api: 'http://stagepay/api/'
    },
    user: {
        name: '',
        email: '',
        cell: '',
        accounts: []        // related account ids
    },
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

store.init(storeSchema);


