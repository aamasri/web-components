const debug = false;
const phoneLib = require('libphonenumber-js/max');



const errorMessages = {
    name: 'Please enter your full name.',
    email: 'Please provide a valid email.',
    cell: 'Please provide a valid phone number with international code.',
    username: 'Please provide your phone number or email.',
    organization: 'Please provide the name of your organization.',
    domain: "Please choose a different domain.",
    password: 'Please provide a stronger password.'
}



/**
 * Validates any supported input form type (see below).
 *
 * @param {string} type
 * @param {string} value
 * @returns {boolean}
 */
const isValid = function(type, value) {
    switch (type) {
        case 'name':
            return isValidName(value);

        case 'username':
            return isValidUsername(value);

        case 'email':
            return isValidEmail(value);

        case 'phone':
            return isValidPhone(value);

        case 'password':
            return isValidPassword(value);

        case 'url':
            return isValidUrl(value);

        case 'alphaNumeric':
            return isAlphaNumeric(value);

        case 'subdomain':
            return isValidSubdomain(value);

        case 'timezone':
            return isValidTimezone(value);

        default:
            throw Error(`validation type "${type}" wasn't recognized!`);
    }
};





/**
 * Validates names.
 *
 * @param {string} name
 * @returns {boolean}
 */
const isValidName = function(name) {
    return name.length > 2
};




/**
 * Validates usernames as email or phone.
 *
 * @param {string} username
 * @returns {boolean}
 */
const isValidUsername = function(username) {
    switch (usernameType(username)) {
        case 'email':
            return isValidEmail(username);
        case 'cell':
            return isValidPhone(username);
    }

    return false;
};




// validate email
/**
 * Validates email addresses.
 *
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = function(email) {
    // require at least @
    if (!/@/.test(email))
        return false;

    // require at least 2 chars after the final dot
    if (!/.[a-z]{2,20}$/i.test(email))
        return false;

    const isEmail = require('sane-email-validation');
    return isEmail(email);
};




/**
 * Validates phone numbers.
 *
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = function(phone) {
    if (typeof phone !== 'string')
        return false;

    const parsedPhone = phoneLib.parsePhoneNumberFromString(phone);
    return typeof parsedPhone === 'object' && parsedPhone.isValid() === true;
};




/**
 * Validates passwords (minimum zxcvbn password strength score of 3).
 *
 * @param {string} password
 * @returns {boolean}
 */
const isValidPassword = function(password) {
    let passwordStrength = require('zxcvbn');
    passwordStrength = passwordStrength(password).score;    // returns 0-4
    return passwordStrength >= 1;
};





/**
 * Validates urls.
 *
 * @param {string} url
 * @returns {boolean}
 */
const isValidUrl = function(url) {
    const regex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url);
};





/**
 * Validates strings as being alpha-numeric.
 *
 * @param {string} value
 * @returns {boolean}
 */
const isAlphaNumeric = function(value) {
    if (value.length === 0)
        return true;    // we're not checking for a required field here

    if (/^[a-z0-9\-]+$/i.test(value) !== true)
        return false;

    // must start with alpha
    if (/^[a-z]+/i.test(value) !== true)
        return false;

    // must not end with "-"
    return /-$/.test(value) !== true;
};





/**
 * Validates a subdomain.
 *
 * @param {string} subdomain
 * @returns {boolean}
 */
const isValidSubdomain = function(subdomain) {
    if (!isAlphaNumeric(subdomain))
        return false;

    if (subdomain.length < 2)
        return false;

    if (subdomain.length > 20)
        return false;

    const reservedSubdomains = [ 'www', 'auth', 'dbm' ];
    for (let reserved of reservedSubdomains) {
        if (subdomain.toLowerCase() === reserved)
            return false;
    }

    const expletiveSubdomains = [ 'fuck', 'suck', 'bitch', 'cunt', 'suck', 'dick', 'pussy' ];
    for (let expletive of expletiveSubdomains) {
        if (subdomain.toLowerCase().includes(expletive))
            return false;
    }

    return true;
};






/**
 * Validates a timezone eg. 'America/Edmonton'.
 *
 * @param {string} timezone
 * @returns {boolean}
 */
const isValidTimezone = function(timezone) {
    const regex = /^[a-z\/_-]{8,}$/i;
    if (regex.test(timezone))
        return true;

    const countries = require('../constants/country-data');
    const $country = countries.find(country => country.timezones.includes(timezone));
    return $country !== undefined;
};





// schema validation
const Ajv = require('ajv').default;
const ajv = new Ajv({ allErrors: true, coerceTypes: true });    // allErrors and jsonPointers are required for custom error messages
require('ajv-errors')(ajv, { singleError: true });      // custom error messages ajv plugin

// built-in ajv types: number, integer, string, boolean, array, object or null
// built-in ajv formats: date, date-time, uri, email, hostname, ipv4, ipv6, regex
// custom formats:
ajv.addFormat('alphaNumeric', isAlphaNumeric);
ajv.addFormat('name', isValidName);
ajv.addFormat('username', isValidUsername);
ajv.addFormat('email', isValidEmail);
ajv.addFormat('phone', isValidPhone);
ajv.addFormat('password', isValidPassword);
ajv.addFormat('full-url', isValidUrl);
ajv.addFormat('timezone', isValidTimezone);
ajv.addFormat('subdomain', isValidSubdomain);


const schemaValidation = ajv;





/**
 * Validates any supported input form type (see below).
 *
 * @param {string} type
 * @param {string} value
 * @returns {string}
 */
const reformat = function(type, value) {
    switch (type) {
        case 'name':
            return reformatName(value);

        case 'username':
            return reformatUsername(value);

        case 'email':
            return reformatEmail(value);

        case 'phone':
            return reformatPhone(value);

        case 'url':
            return reformatUrl(value);

        case 'alphaNumeric':
            return reformatAlphaNumeric(value);

        case 'subdomain':
            return reformatSubdomain(value);

        default:
            throw Error(`validation type "${type}" wasn't recognized!`);
    }
};





/**
 * auto-correct full name as-you-type.
 *
 * @param {string} name
 * @returns {string}
 */
const reformatName = function(name) {
    if (!name)
        return '';

    name = name.replace(/^[\s]+|[\s]{2,}|[~0-9!@#$%^&*()_\-+=\[\]|\\;:"?/]+/g, '');
    name = name.replace(/[\s]{2,}/g, ' ');

    return name;
};




/**
 * auto-correct username (email or cell) as-you-type.
 *
 * @param {string} username
 * @returns {boolean}
 */
const reformatUsername = function(username) {
    console.debug('username', username);

    // autodetect email or cell
    let type = '';
    const emailScore = username.replace(/[^a-z@]*/gi, '').length;
    const cellScore = username.replace(/[^0-9+()\s]*/g, '').length;
    if (cellScore > emailScore)
        type = 'cell';
    else if (emailScore > cellScore)
        type = 'email';

    if (debug) console.debug('username type', type);

    switch (type) {
        case 'email':
            return reformatEmail(username);
        case 'cell':
            return reformatPhone(username);
    }

    return username;
};





/**
 * auto-correct email as-you-type.
 *
 * @param {string} email
 * @returns {boolean}
 */
const reformatEmail = function(email) {
    if (!email)
        return '';

    if (/[A-Z]+/g.test(email))
        email = email.toLowerCase();

    const emailDisallowed = /[\s!"#$%(),:;\\<>\[\]`{}/]+/g;
    if (emailDisallowed.test(email))
        email = email.replace(emailDisallowed, '');

    if (/@.*@/.test(email))
        email = email.replace(/(@.*)@/, "$1");  // remove any second @

    email = email.replace(/@ho$/, '@hotmail.com');
    email = email.replace(/@ou$/, '@outlook.com');
    email = email.replace(/@gm$/, '@gmail.com');
    email = email.replace(/\.com.+$/, '.com');

    return email;
};





/**
 * auto-correct phone as-you-type.
 *
 * @param {string} phone
 * @returns {boolean}
 */
const reformatPhone = function(phone) {
    if (!phone)
        return '';

    phone = new phoneLib.AsYouType().input(phone);   // format the phone number

    if ((phone.length > 0) && (/^\+/.test(phone) !== true)) {
        // get country dial code (browser only)
        if (typeof window === 'object') {
            const timezone = window.Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezone) {
                const countries = require('../constants/country-data');
                const $country = countries.find(country => country.timezones.includes(timezone));
                phone = $country.dial_code + phone;    // force insert international symbol
            }
        }
    }

    if (phone.replace(/[^+0-9]+/g, '').length > 10) {
        const parsedPhone = phoneLib.parsePhoneNumberFromString(phone);
        if (typeof parsedPhone === 'object' && parsedPhone.isValid() === true)
            return parsedPhone.formatInternational();
    }

    return phone;
};




/**
 * auto-correct url as-you-type.
 *
 * @param {string} url
 * @returns {boolean}
 */
const reformatUrl = function(url) {
    if (!url)
        return '';

    // protocol typo fix and auto-completion
    if (/^[htps:/]{5,}/i.test(url)) {
        const replacement = (/^[htp:/]{5,}/i.test(url)) ? 'http://' : 'https://';
        url = url.replace(/^[htps]+[:/]+[htps]{2,}[:/]{2,}/gi, replacement);
    }

    // insert missing protocol
    if (url.length > 5 && /^https?:\/\//i.test(url) === false)
        url = `https://${url}`;

    // remove hash fragments
    if (/#/.test(url))
        url = url.replace(/#.*/, '');

    // remove duplicate "https://https://"
    if (/^https?:\/\/https?:\/\//.test(url))
        url = url.replace(/^https?:\/\//, '');

    // remove duplicate and trailing "/"
    url = url
        .replace(/:\/\//, ':::')                           // remove leading :// temporarily
        .replace(/[\/]{2,}/g, '/')  // replace consecutive slashes with a single slash
        .replace(/:::/, '://');     // finally put back the ://

    // adjust incorrect quantity of www
    url = url.replace(/\.w{2}\//i, '.www/').replace(/\.w{4,}\//i, '.www/');

    // spaces not allowed
    const urlDisallowed = /\s*/g;
    if (urlDisallowed.test(url))
        url = url.replace(urlDisallowed, '');

    // lowercase protocol & domain
    if (/[A-Z]+/.test(url)) {
        const parts = url.split('/');
        if (parts.length > 2) {
            const domainIndex = (/^https?:/.test(parts[0])) ? 2 : 0;
            if (domainIndex)
                parts[0] = parts[0].toLowerCase();

            parts[domainIndex] = parts[domainIndex].toLowerCase();
            url = parts.join('/');  // un split
        }
    }

    return url;
};






// auto-correct url user input as-you-type
const shortUrl = function(url) {
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
};






/**
 * auto-correct alpha-numeric value as-you-type.
 *
 * @param {string} value
 * @returns {boolean}
 */
const reformatAlphaNumeric = function (value) {
    if (!value)
        return '';

    value = value.replace('_', '-');
    return value.replace(/[^a-z0-9\-]/gi, '').toLowerCase();
};





/**
 * auto-correct subdomain as-you-type.
 *
 * @param {string} value
 * @returns {boolean}
 */
const reformatSubdomain = function (value) {
    if (!value)
        return '';

    value = value.replace('_', '-').toLowerCase();
    return value.replace(/[^a-z0-9\-]/g, '');
};





/**
 * Auto-detects username type (email or cell)
 *
 * @param {string} username
 * @returns {('cell'|'email'|null)}
 */
const usernameType = function(username) {
    if (!username)
        return null;

    // autodetect email or cell
    let type = null;
    const emailScore = username.replace(/[^a-z@]*/gi, '').length;
    const cellScore = username.replace(/[^0-9+()\s]*/g, '').length;
    if (cellScore > emailScore)
        type = 'cell';
    else if (emailScore > cellScore)
        type = 'email';

    if (debug) console.debug('username type', type);
    return type;
};





module.exports = {
    schemaValidation,
    reformat,
    reformatUsername,
    reformatEmail,
    reformatUrl,
    reformatName,
    reformatPhone,
    reformatAlphaNumeric,
    isValid,
    errorMessages,
    isValidUrl,
    isValidSubdomain,
    isValidTimezone,
    isValidPhone,
    isValidEmail,
    isValidUsername,
    isValidName,
    isValidPassword,
    isAlphaNumeric,
    usernameType,
    shortUrl
};