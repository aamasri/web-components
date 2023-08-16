const debug = false;

import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js/max";
import Ajv from "ajv";  // schema validation
import ajv_errors from "ajv-errors";
import isEmail from "sane-email-validation";
import passwordStrength from "zxcvbn";
import countries from "../constants/country-data.js";



export const errorMessages = {
    name: 'Please enter your full name.',
    email: 'Please provide a valid email.',
    cell: 'Please provide a valid phone number with international code.',
    tel: 'Please provide a valid phone number with international code.',
    username: 'Please provide your phone number or email.',
    organization: 'Please provide the name of your organization.',
    domain: "Please choose a different domain.",
    subdomain: "Please choose a different subdomain.",
    password: 'Please provide a stronger password.'
};



/**
 * Validates any supported input form type (see below).
 *
 * @param {string} type
 * @param {string} value
 * @returns {boolean}
 */
export const isValid = function(type, value) {
    switch (type) {
        case 'name':
            return isValidName(value);

        case 'username':
            return isValidUsername(value);

        case 'email':
            return isValidEmail(value);

        case 'phone':
        case 'tel':
            return isValidPhone(value);

        case 'password':
            return isValidPassword(value);

        case 'url':
            return isValidUrl(value);

        case 'alphaNumeric':
            return isAlphaNumeric(value);

        case 'organization':
            return isValidOrganization(value);

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
export const isValidName = function(name) {
    return name.length > 2
};




/**
 * Validates usernames as email or phone.
 *
 * @param {string} username
 * @returns {boolean}
 */
export const isValidUsername = function(username) {
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
export const isValidEmail = function(email) {
    // require at least @
    if (!/@/.test(email))
        return false;

    // require at least 2 chars after the final dot
    if (!/.[a-z]{2,20}$/i.test(email))
        return false;

    return isEmail(email);
};




/**
 * Validates phone numbers.
 *
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = function(phone) {
    if (typeof phone !== 'string')
        return false;

    const parsedPhone = parsePhoneNumberFromString(phone);
    return typeof parsedPhone === 'object' && parsedPhone.isValid() === true;
};




/**
 * Validates passwords (minimum zxcvbn password strength score of 3).
 *
 * @param {string} password
 * @returns {boolean}
 */
export const isValidPassword = function(password) {
    const passwordStrengthScore = passwordStrength(password).score;    // returns 0-4
    return passwordStrengthScore >= 1;
};





/**
 * Validates urls.
 *
 * @param {string} url
 * @returns {boolean}
 */
export const isValidUrl = function(url) {
    const regex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url);
};





/**
 * Validates strings as being alphanumeric.
 *
 * @param {string} value
 * @returns {boolean}
 */
export const isAlphaNumeric = function(value) {
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
 * Validates strings as being alphanumeric, spaces, and apostrophes.
 *
 * @param {string} organization
 * @returns {boolean}
 */
export const isValidOrganization = function(organization) {
    if (organization.length < 3)
        return false;

    if (organization.length > 50)
        return false;

    if (/^[a-z0-9 ,.:'\-]+$/i.test(organization) !== true)
        return false;

    // must start with alpha
    if (/^[a-z]+/i.test(organization) !== true)
        return false;

    // must not end with "-"
    return /-$/.test(organization) !== true;
};





/**
 * Validates a subdomain.
 *
 * @param {string} subdomain
 * @returns {boolean}
 */
export const isValidSubdomain = function(subdomain) {
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
export const isValidTimezone = function(timezone) {
    const regex = /^[a-z\/_-]{8,}$/i;
    if (regex.test(timezone))
        return true;

    const $country = countries.find(country => country.timezones.includes(timezone));
    return $country !== undefined;
};
const ajv = new Ajv({ allErrors: true, coerceTypes: true });    // allErrors and jsonPointers are required for custom error messages
ajv_errors(ajv, { singleError: true });      // custom error messages ajv plugin

// built-in ajv types: number, integer, string, boolean, array, object or null
// built-in ajv formats: date, date-time, uri, email, hostname, ipv4, ipv6, regex
// custom formats:
ajv.addFormat('alphaNumeric', isAlphaNumeric);
ajv.addFormat('name', isValidName);
ajv.addFormat('username', isValidUsername);
ajv.addFormat('email', isValidEmail);
ajv.addFormat('phone', isValidPhone);
ajv.addFormat('tel', isValidPhone);
ajv.addFormat('password', isValidPassword);
ajv.addFormat('full-url', isValidUrl);
ajv.addFormat('timezone', isValidTimezone);
ajv.addFormat('organization', isValidOrganization);
ajv.addFormat('subdomain', isValidSubdomain);


export const schemaValidation = ajv;





/**
 * Validates any supported input form type (see below).
 *
 * @param {string} type
 * @param {string} value
 * @returns {string}
 */
export const reformat = function(type, value) {
    switch (type) {
        case 'name':
            return reformatName(value);

        case 'username':
            return reformatUsername(value);

        case 'email':
            return reformatEmail(value);

        case 'phone':
        case 'tel':
            return reformatPhone(value);

        case 'url':
            return reformatUrl(value);

        case 'alphaNumeric':
            return reformatAlphaNumeric(value);

        case 'organization':
            return reformatOrganization(value);

        case 'subdomain':
            return reformatSubdomain(value);

        case 'password':
            return value;   // don't reformat passwords

        default:
            throw Error(`validation type "${type}" wasn't recognized!`);
    }
};





/**
 * autocorrect full name as-you-type.
 *
 * @param {string} name
 * @returns {string}
 */
export const reformatName = function(name) {
    if (!name)
        return '';

    name = name.replace(/^\s+|\s{2,}|[~0-9!@#$%^&*()_\-+=\[\]|\\;:"?/]+/g, '');
    name = name.replace(/\s{2,}/g, ' ');

    return name;
};




/**
 * autocorrect username (email or cell) as-you-type.
 *
 * @param {string} username
 * @returns {string}
 */
export const reformatUsername = function(username) {
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
 * @returns {string}
 */
export const reformatEmail = function(email) {
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
 * @returns {string}
 */
export const reformatPhone = function(phone) {
    if (!phone)
        return '';

    phone = new AsYouType().input(phone);   // format the phone number

    if ((phone.length > 0) && (/^\+/.test(phone) !== true)) {
        // get country dial code (browser only)
        if (typeof window === 'object') {
            const timezone = window.Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezone) {
                const $country = countries.find(country => country.timezones.includes(timezone));
                phone = $country.dial_code + phone;    // force insert international symbol
            }
        }
    }

    if (phone.replace(/[^+0-9]+/g, '').length > 10) {
        const parsedPhone = parsePhoneNumberFromString(phone);
        if (typeof parsedPhone === 'object' && parsedPhone.isValid() === true)
            return parsedPhone.formatInternational();
    }

    return phone;
};




/**
 * auto-correct url as-you-type.
 *
 * @param {string} url
 * @returns {string}
 */
export const reformatUrl = function(url) {
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






// autocorrect url user input as-you-type
export const shortUrl = function(url) {
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
};






/**
 * autocorrect alpha-numeric value as-you-type.
 *
 * @param {string} value
 * @returns {string}
 */
export const reformatAlphaNumeric = function (value) {
    if (!value)
        return '';

    value = value.replace('_', '-');
    return value.replace(/[^a-z0-9-]/gi, '').toLowerCase();
};




/**
 * autocorrect organization as-you-type.
 *
 * @param {string} value
 * @returns {string}
 */
const reformatOrganization = function (value) {
    if (!value)
        return '';

    value = value.replace('_', '-');
    return value.replace(/[^a-z0-9 ,.:'\-]/gi, '');
};




/**
 * autocorrect subdomain as-you-type.
 *
 * @param {string} value
 * @returns {string}
 */
const reformatSubdomain = function (value) {
    if (!value)
        return '';

    value = value.replace('_', '-').toLowerCase();
    return value.replace(/[^a-z0-9-]/g, '');
};





/**
 * Auto-detects username type (email or cell)
 *
 * @param {string} username
 * @returns {('cell'|'email'|null)}
 */
export const usernameType = function(username) {
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