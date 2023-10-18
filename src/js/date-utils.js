/**
 * @fileOverview useful date functions
 */


const debug = false;

// Constants for timestamp
const SECOND = 1000;
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;


/**
 * produces an array of dates in format [yyyymmdd, ]
 *
 * @param {Date} startDate
 * @param {('day'|'week'|'month')} span
 * @return Array
 */
export function getDatesInRange(startDate, span='day') {
	let daySpan;
	switch (span) {
		case 'day':
			daySpan = [0];
			break;

		case 'week':
			daySpan = [...Array(7).keys()]; // i.e. [0,1,2,3,4,5,6];
			break;

		case 'month':
			daySpan = [...Array(28).keys()]; // i.e. [0,1 ... 27,28];
			break;

		default:
			throw Error(`getDatesInRange expects span to be one of: day, week, or month! Provided: ${span}`);
	}

	const datesInRange = [];
	const startUnix = getTimestamp(startDate);
	for (const days of daySpan)
        datesInRange.push(yyyymmdd(new Date(startUnix + (days * DAY))));

	if (debug) console.log(`getDatesInRange(${yyyymmdd(startDate)})`, datesInRange);
	return datesInRange;
}


/**
 * converts decimal hours to an hours:minutes string (e.g. 2.5 --> "2:30")
 *
 * @param {number} hoursDecimal
 * @param {object} options
 * @return string
 */
export function toHoursMinutes(hoursDecimal, options={
	minutesPrecision: 1,
	padding: '\xa0',
	includeSeconds: false,
}) {
	options.minutesPrecision = options.minutesPrecision || 1;
	options.padding = (typeof options.padding === 'string') ? options.padding : '\xa0';
	options.includeSeconds = options.includeSeconds || false;

	let hours = Math.floor(hoursDecimal);
	let minutes = Math.floor((hoursDecimal - hours) * 60);
	let	seconds = Math.round((((hoursDecimal - hours) * 60) - minutes) * 60);
	if (seconds === 60) {
		seconds = 0;
		minutes++;
	}

	// seconds (if present) must be 2 digits e.g. 2:15:03
	if (options.includeSeconds)
		seconds = seconds ? ':' + seconds.toString().padStart(2, '0') : options.padding.repeat(3);
	else {
		if (seconds >= 30)
			minutes++;

		seconds = '';
	}

	if (minutes === 60) {
		minutes = 0;
		hours++;
	}

	if (options.minutesPrecision > 1)
		minutes = Math.round(minutes / options.minutesPrecision) * options.minutesPrecision;

	if (debug) console.log('minutes:', minutes);

	// minutes (if present) must be 2 digits e.g. 2:05
	if (!minutes && !seconds)
		minutes = options.padding.repeat(3);
	else
		minutes = ':' + minutes.toString().padStart(2, '0');

	const result = hours + minutes + seconds;
	return /^[0\s]+$/.test(result) ? '' : result;
}



/**
 * returns the time in 12-hour format e.g. "5:30 pm" (from a Date object)
 *
 * @param {Date|string|number} date
 * @return string
 */
export function friendlyTime(date) {
	if ([ 'number', 'string', 'undefined' ].includes(typeof date))
		date = new Date(date);

	return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' });
}



/**
 * converts decimal hours (0-24) to a time in 12-hour format e.g. "5:30 pm"
 *
 * @param {number} hoursDecimal
 * @return string
 */
export function toTimeOfDay(hoursDecimal) {
	const hoursMins = toHoursMinutes(hoursDecimal, { padding: '' }).toString().split(':');

	let hour = hoursMins[0];
	const meridian = (hour < 12) ? 'am' : 'pm';
	if (hour > 12)
		hour -= 12;

	let mins = hoursMins[1] || '';
	if (mins)
		mins = ':' + mins;

	return `${hour}${mins} ${meridian}`;
}

/**
 * converts hours:minutes to decimal (e.g. "2:30" --> 2.5)
 *
 * @param {string} hoursMinutes
 * @param {number} precision
 * @return number
 */
export function toDecimalHours(hoursMinutes='', precision=2) {
	const hoursMinutesParts = hoursMinutes.split(':');
	let hours = parseInt(hoursMinutesParts[0] || 0);

	if (hoursMinutesParts.length > 1)
		hours += hoursMinutesParts[1] / 60;		// add minutes

	if (hoursMinutesParts.length > 2)
		hours += hoursMinutesParts[2] / 3600;	// add hours

	return parseFloat(hours.toFixed(precision));
}



/**
 * converts hours:minutes am/pm to decimal (e.g. "5:30 pm" --> 17.5)
 *
 * @param {string} hoursMinutesMeridian
 * @return number
 */
export function toDecimalTime(hoursMinutesMeridian='') {
	const pm = hoursMinutesMeridian.toLowerCase().includes('pm');
	hoursMinutesMeridian = hoursMinutesMeridian.replace(/\./, ':').replace(/[^0-9:]/g, '');
	const hoursMinutesParts = hoursMinutesMeridian.split(':');

	let hours = parseInt(hoursMinutesParts[0] || 0);

	if (hoursMinutesParts.length > 1)
		hours += hoursMinutesParts[1] / 60;		// add minutes

	if (hoursMinutesParts.length > 2)
		hours += hoursMinutesParts[2] / 3600;	// add hours

	if (pm && hours < 12)
		hours += 12;	// 24 hour time

	return hours;
}


// auto-detect unix timestamp units and convert it to milliseconds
export function convertToMs(unixTimestamp=Date.now()) {
	if (unixTimestamp.toString().length < 13)
		unixTimestamp *= 1000;	// convert to milliseconds

	return unixTimestamp;
}


/**
 * Accepts a user entered date string and returns a Date object of false
 *
 * @param {string} input
 * @return Date|boolean
 */
export function parseDateString(input) {
	// Date cannot parse a date with missing year
	if (!input.match(/(^|\W)\d{4}(\W|$)/))
		input += ', ' + new Date().getFullYear();

	const parsedDate = newDate(input);
	return (isNaN(parsedDate.getTime())) ? false : parsedDate;
}



/**
 * Accepts a javascript native Date object and returns a nice & concise text representation e.g. Aug 20
 *
 * @param {Date} dateObject - javascript Date object
 * @return string
 */
export function monthDay(dateObject) {
	const currentYear = new Date().getFullYear().toString();
	let friendlyDateString = dateObject.toLocaleDateString('en-US', {  day: 'numeric', month: 'short', year: 'numeric' });
	return friendlyDateString.replace(`, ${currentYear}`, '').trim();
}



/**
 * Presentational representation of date or date range
 *
 * @param {Date} startDate - javascript Date object
 * @param {string} timeSpan - day/month/year
 * @return string
 */
export function friendlyDateRange(startDate, timeSpan='day') {
	let start = monthDay(startDate);
	let endDate;

	if (debug) console.log(`friendlyDateRange(${yyyymmdd(startDate)}, ${timeSpan})`);

	if (timeSpan === 'day') {
		const day = dayFromIndex(startDate.getDay()).slice(0, 3);
		return `${day}, ${start}`;
	} else if (['week', 'month'].includes(timeSpan))
		endDate = stepDate(startDate, timeSpan, false, false, true);
	else
		return 'unrecognized date or time span';

	const startYear = startDate.getFullYear().toString();
	const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
	start = start.replace(`, ${startYear}`, '').trim();
	const end = monthDay(endDate).replace(startMonth, '').trim();
	return `${start} - ${end}`;
}




/**
 * Does TODAY fall on the start date or within the specified date range
 *
 * @param {Date} startDate - javascript Date object
 * @param {string} timeSpan - day/week/month
 * @return boolean
 */
export function isCurrent(startDate, timeSpan='day') {
	if (!startDate instanceof Date)
		return false;

	let now = getTimestamp();
	let start = getTimestamp(startDate);

	if (timeSpan === 'day')
		return now === start;
	else {
		let end = stepDate(startDate, timeSpan, false, false, true);
		return now >= start && now <= end;
	}
}




/**
 * Accepts a javascript Date object and returns the start of that week (default start of week is Monday)
 *
 * @param {Date} dateObject
 * @param {string|int|undefined} stepSize - day/week/month OR number of days (default day)
 * @param {string|boolean|int} alignToDay - e.g. Monday or 1
 * @param {boolean} previous - step back or forward (default)
 * @param {boolean} getEndDate - if true then we're getting the end date for the timespan (i.e. the day before)
 * @return Date
 */
export function stepDate(dateObject, stepSize='day', alignToDay=false, previous=false, getEndDate=false) {
	let timestamp = getTimestamp(dateObject);

    const step = (previous ? -1 : 1) * DAY;   // +/- 1 day
	let days;

	switch (stepSize) {
		case 'week':
			days = getEndDate ? 6 : 7;
			break;
		case 'month':
			days = getEndDate ? 27 : 28;
			break;
		case 'day':
			days = 1
			break;
		default:
			days = parseInt(stepSize)
			if (isNaN(days))
				days = 1;	// i.e. 1 day
	}

	timestamp += step * days;
	dateObject = new Date(timestamp);

	if (alignToDay && !getEndDate)
		return alignToStartOfWeek(dateObject, alignToDay);

	if (debug) console.log(`stepDate by ${days} days (${stepSize}) is NOT aligned to:${alignToDay} results in ${monthDay(dateObject)}`);
	return dateObject;
}



/**
 * Accepts a javascript Date object and returns the start of that week (default start of week is Monday)
 *
 * @param {Date} dateObject
 * @param {int|string|undefined} startOfWeek -- 0-6 or day of week (defaults to 'Monday')
 * @return Date
 */
export function alignToStartOfWeek(dateObject, startOfWeek='Monday') {
	// getDay is zero indexed on Sunday
	let dayDifference = dayIndexOf(startOfWeek) - dateObject.getDay();
	if (dayDifference > 0)
		dayDifference = dayDifference - 7;

    let unixStartOfWeek = dateObject.getTime() + (dayDifference * DAY);
	const alignedDateObject = new Date(unixStartOfWeek);

	if (debug) console.log(`${dateObject.toLocaleDateString('en-GB')} has day index ${dateObject.getUTCDay()} (day diff from ${startOfWeek} is ${dayDifference})
            corrected to ${alignedDateObject.toLocaleDateString('en-GB')}`);

	return alignedDateObject;
}


/**	Is the specified date today?
 *
 * @param {Date|string} date
 * @return boolean
 */
export function isToday(date) {
	// shortcut - already a string in correct format
	if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/))
		return date === yyyymmdd();

	return yyyymmdd(date) === yyyymmdd();
}



/**	Is the specified date in the week starting on the startOfWeekDay?
 *
 * @param {Date} date
 * @param {string|int} weekStartDay
 */
export function isInWeek(date, weekStartDay='Monday') {
	let startOfWeek = alignToStartOfWeek(new Date(), weekStartDay);
	let endOfWeek = stepDate(startOfWeek, 'week', false, false, true);

	const dateInteger = parseInt(yyyymmdd(date).replace(/-/g, ''));
	startOfWeek = parseInt(yyyymmdd(startOfWeek).replace(/-/g, ''));
	endOfWeek = parseInt(yyyymmdd(endOfWeek).replace(/-/g, ''));
	console.log(`isInWeek(date:${dateInteger} startOfWeek: ${startOfWeek} endOfWeek:${endOfWeek})`, dateInteger >= startOfWeek && dateInteger <= endOfWeek);
	return dateInteger >= startOfWeek && dateInteger <= endOfWeek;
}



export function getDaysInRange(startDate, span) {
	const daysInRange = [];
	let dayOfWeek;
	let isToday = false;

	const datesInRange = getDatesInRange(startDate, span);
	for (let date of datesInRange) {
		dayOfWeek = dayFromIndex(newDate(date).getDay()).slice(0, 1);	// the T12:00:00 fixes Date not parsing yyyy-mm-dd correctly in negative timezones
		isToday = date === yyyymmdd();
		daysInRange.push({ day: dayOfWeek, today: isToday });
	}

	return daysInRange;
}



/**
 * Accepts a zero indexed day-of-week and returns the text day of week
 *
 * @param {int|string} dayIndex - zero indexed day-of-week
 * @return string
 */
export function dayFromIndex(dayIndex) {
	switch (parseInt(dayIndex)) {
		case 0:
			return 'Sunday';
		case 1:
			return 'Monday';
		case 2:
			return 'Tuesday';
		case 3:
			return 'Wednesday';
		case 4:
			return 'Thursday';
		case 5:
			return 'Friday';
		case 6:
			return 'Saturday';
		default:
			return '';
	}
}


/**
 * Accepts a zero indexed or textual day-of-week and returns a zero indexed javascript Date:day
 * Defaults to Monday (1) if not recognized
 *
 * @param {int|string} day - e.g. 'Sunday'
 * @return int
 */
export function dayIndexOf(day) {
	switch (day.toString().toLowerCase().slice(0, 3)) {
		case '0':
		case 'sun':
			return 0;
		case '1':
		case 'mon':
			return 1;
		case '2':
		case 'tue':
			return 2;
		case '3':
		case 'wed':
			return 3;
		case '4':
		case 'thu':
			return 4;
		case '5':
		case 'fri':
			return 5;
		case '6':
		case 'sat':
			return 6;
		default:
			return 1;
	}
}



/**
 * Normalizes the specified date (Date, text, or unix timestamp) to a day (without the time component),
 * thus facilitating date comparisons.
 *
 * @param {Date|string|number} date - a date in any format
 * @return Number - unix timestamp of the date (stripped of any hh:mm:ss component)
 */
export function getTimestamp(date=new Date()) {
	return newDate(date).getTime();
}


/**
 * Normalizes a date (in any form) to the same date (at noon).
 * Fixes native Date's inability to parse yyyy-mm-dd correctly in negative timezones
 *
 * @param {Date|string|number} date - a date in any format
 * @return Date - date (stripped of any hh:mm:ss component)
 */
export function newDate(date=new Date()) {
	// appending T12:00:00 fixes Date not parsing yyyy-mm-dd correctly in negative timezones
	if (typeof date === 'string' && /^\d+-\d+-\d+$/.test(date))
		return new Date(date + 'T12:00:00');

	if ([ 'number', 'string', 'undefined' ].includes(typeof date))
		date = new Date(date);

	return new Date(yyyymmdd(date) + 'T12:00:00');	// appending T12:00:00 enables Date to parse yyyy-mm-dd correctly in negative timezones
}



/**
 * convert a date (in any form) to the string format: yyyy-mm-dd
 *
 * @param {Date|string|number} date - a date in any format
 * @return string
 */
export function yyyymmdd(date=new Date()) {
	if ([ 'number', 'string', 'undefined' ].includes(typeof date))
		date = newDate(date);

	// add leading zeros as needed
	const yyyy = date.getFullYear();
	const mm = ('0' + (date.getMonth() + 1)).slice(-2);
	const dd = ('0' + date.getDate()).slice(-2);

	return `${yyyy}-${mm}-${dd}`;
}



/**
 * compare any 2 dates (ignoring any time component)
 *
 * @param {Date|string|number} date1 - a date in any format
 * @param {Date|string|number} date2 - a date in any format
 * @return boolean
 */
export function sameDate(date1, date2) {
	return yyyymmdd(date1) === yyyymmdd(date2);
}





/**
 * Converts a unix timestamp to relative date
 *
 * @param {number} timestamp - a unix timestamp (in seconds or milliseconds)
 * @return string
 */
export function relativeDate(timestamp){
    timestamp = convertToMs(timestamp);	// convert to milliseconds

	console.log(`relativeDate(${timestamp}) Ms`);

	let currentTime = Date.now();
    let delta = (currentTime - timestamp); // converted milliseconds to seconds

    console.log(`  delta ${delta / DAY} days`);

	let prefix, postfix, future;

    if (delta > 0) {
        prefix = '';
        postfix = ' ago';
        future = false;
    } else {
        delta = -delta;
        prefix = 'in ';
        postfix = '';
        future = true;
    }

    // Convert the time accordingly
    switch (true) {
        case (delta < MINUTE):
            return (delta === SECOND) ? `${prefix}one second${postfix}` : `${prefix}${Math.round(delta/SECOND)} seconds${postfix}`;
        case (delta < 2 * MINUTE):
            return `${prefix}a minute${postfix}`;
        case (delta < 45 * MINUTE):
            return `${prefix}${Math.round(delta/MINUTE)} minutes${postfix}`;
        case (delta < 90 * MINUTE):
            return `${prefix}an hour${postfix}`;
        case (delta < DAY):
            return `${prefix}${Math.round(delta/HOUR)} hours${postfix}`;
        case (delta < 2 * DAY):
            return future ? 'tomorrow' : 'yesterday';
        case (delta < 28 * DAY):
            return `${prefix}${Math.round(delta/DAY)} days${postfix}`;
        case (delta < 11 * MONTH):
            let months = Math.round(delta/MONTH);
            return (months <= 1) ? `${prefix}one month${postfix}` : `${prefix}${months} months${postfix}`;
        default:
            let years = Math.round(delta/YEAR);
            return (years <= 1) ? `${prefix}one year${postfix}` : `${prefix}${years} years${postfix}`;
    }
}
