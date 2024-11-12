/**
 * @fileOverview A collection of DOM utils to add syntactic sugar and supplement jQuery.
 */



/**
 * Defer execution until after document ready.
 *
 * Usage:
 *     import { ready } from 'dom-utils';
 *     ready().then(function() { ... });
 */
export const ready = () => new Promise((resolve) => {
	if (document.readyState !== 'loading')
		resolve($cache());
	else
		document.addEventListener('DOMContentLoaded', () => {
			resolve($cache());
		});
});


/**
 * Defer execution until after window has fully loaded (including images).
 *
 * Usage:
 * 	   import { loaded } from 'dom-utils';
 *     loaded().then(function() { ... });
 */
export const loaded = () => new Promise((resolve) => {
	if (document.readyState === 'complete')
		resolve($cache());
	else
		window.addEventListener('load', () => {
			resolve($cache());
		});
});




// jQuery selector cache
/**
 * Caches the jQuery window, document, & body elements.
 *
 * @returns {Object}
 */
const selectorCache = {};
export function $cache() {
	if (selectorCache.hasOwnProperty('$body') && selectorCache.$body.length)
		return selectorCache;

	selectorCache.$window = jQuery(window);
	selectorCache.$document = jQuery(document);
	selectorCache.$body = jQuery('body');

	return selectorCache;
}



/**
 * Whether the current window is actually a child window (contained in an iframe).
 *
 * @returns {boolean}
 */
export function isInIframe() {
	return window.location !== window.parent.location;
}


/**
 * Whether this device has a touch screen.
 *
 * @returns {boolean}
 */
let cachedIsTouchDevice;
export function isTouchDevice() {
	if (typeof cachedIsTouchDevice === 'boolean')
		return cachedIsTouchDevice;

	if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
		cachedIsTouchDevice = true;
		return cachedIsTouchDevice;
	}

	// include the 'heartz' as a way to have a non-matching MQ to help terminate the join
	// https://git.io/vznFH
	const mq = function (query) {
		cachedIsTouchDevice = window.matchMedia(query).matches;
		return cachedIsTouchDevice;
	};

	const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
	const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
	cachedIsTouchDevice = !!mq(query);
	return cachedIsTouchDevice;
}





/**
 * Whether this device is a recognized mobile device.
 *
 * @returns {boolean}
 */
export function isMobile() {
	return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
}





/**
 * Whether the specified element is visible (i.e. css display/visibility/opacity and viewport scroll position).
 *
 * @param {Element | Node | ParentNode | jQuery} el
 * @returns {boolean}
 */
export function isVisible(el) {
    if (!el instanceof Object)
        return false;

	if (typeof jQuery !== 'undefined' && el instanceof jQuery)
		el = el[0];

	//is object hidden
	if (getAppliedStyle(el, 'display') === 'none' || getAppliedStyle(el, 'visibility') === 'hidden' || parseFloat(getAppliedStyle(el, 'opacity')) < 0.1)
		return false;

    try {
		const rect = el.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);

	} catch (error) {
        console.warn('dom-utils.isVisible(el) threw error', error);
        return false;
    }
}



// modern more accurate alternative to isVisible(el) but async
async function isInView(el) {
	return new Promise((resolve) => {
		const observer = new IntersectionObserver(
			(entries, observerItself) => {
				observerItself.disconnect();
				resolve(entries[0].intersectionRatio === 1);
			}
		);
		observer.observe(el);
	});
}



/**
 * @typedef {Object} Offsets - The top/right/bottom/left element offsets.
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 * @property {number} left
 */

/** Returns the specified element's offset from the visible viewport.
 *
 * @param {Element | Node | ParentNode | jQuery} $element
 * @returns {Offsets | undefined}
 */
export function getViewportOffset($element) {
	$element = jQuery($element);	// convert all element types to jQuery
	if (!$element.length) {
		console.error('function getViewportOffset(element) expects a DOM element, jQuery object, or CSS selector!');
		return undefined;
	}

	let offset;
	try {
		offset = $element.offset();
	} catch (error) {
		console.error('function getViewportOffset(element) could not determine the element offset!');
		return undefined;
	}

	const $win = jQuery(window);

	const left = offset.left - $win.scrollLeft();
	const top = offset.top - $win.scrollTop();
	const right = $win.width() - left - $element.outerWidth();
	const bottom = $win.height() - top - $element.outerHeight();

	return { top, right, bottom, left };
}



/** Returns the specified element's offset from the entire document.
 *
 * @param {Element | Node | ParentNode | jQuery} $element
 * @returns {Offsets | undefined}
 */
export function getDocumentOffset($element) {
	$element = jQuery($element);	// convert all element types to jQuery
	if (!$element.length) {
		console.error('function getDocumentOffset(element) expects a DOM element, jQuery object, or CSS selector!');
		return undefined;
	}

	let offset;
	try {
		offset = $element.offset();
	} catch (error) {
		console.error('function getViewportOffset(element) could not determine the element offset!');
		return undefined;
	}

	const $win = jQuery(window);

	const left = offset.left;
	const top = offset.top;
	const right = $win.width() + $win.scrollLeft() - left - $element.outerWidth();
	// jQuery(window).width() + jQuery(window).scrollLeft() - jQuery('#popup4').offset().left - jQuery('#popup4').outerWidth();
	const bottom = $win.height() + $win.scrollTop() - top - $element.outerHeight();

	return { top, right, bottom, left };
}







/** Get the highest z-index in the document.
 *
 * @returns {number}
 */
export function onTopZIndex() {
	let zTop = 0;
	const elements = document.getElementsByTagName('*');

	for (let i = 0; i < elements.length; i++) {
		let zIndex = window.getComputedStyle(elements[i]).getPropertyValue('z-index');
		zIndex = isNaN(zIndex) ? 0 : parseInt(zIndex);
		if (zIndex && zIndex > zTop)
			zTop = zIndex;
	}

	return zTop;
}





/**
 * Get the z-index of the specified element.
 * The recursive option will traverse the parent tree (z-index includes descendents)
 *
 * @param {Element | Node | ParentNode} element
 * @param {boolean} [recursive=false] - whether to traverse parents in search of z-index
 * @returns {number} - the z-index
 */
export function getZIndex(element, recursive=false) {
	let zIndex = getAppliedStyle(element, 'z-Index') || 0;	// z-index can be "auto"
	zIndex = (isNaN(zIndex) || zIndex === 2147483647) ? 0 : parseInt(zIndex);	// solve an earlier bug which caused zIndex to be 2147483647
	return (recursive && zIndex === 0 && element !== document.documentElement) ? getZIndex(element.parentNode, true) : zIndex;
}




/**
 * Get the computed style of the specified element and style.
 *
 * @param {Element | Node | ParentNode} el
 * @param {string} style - e.g. 'z-index' or 'margin'
 * @returns {string} - the style value
 */
export function getAppliedStyle(el, style) {
	if (typeof jQuery !== 'undefined' && el instanceof jQuery)
        el = el[0];

    if (!el instanceof Object)
        return '';

    try {
        return window.getComputedStyle(el).getPropertyValue(style);
    } catch (error) {
        console.warn(`dom-utils.getAppliedStyle(el, ${style}) threw error on element:`, el, error);
        return '';
    }
}




/**
 * Check for webp feature support. Some browsers initially introduced partial support i.e. for lossy images
 * (i.e. compression), then added lossless & alpha support, finally adding support for animation.
 *
 * Usage: webpSupport('animated').then(() => console.log(`webp supported`)).catch(errMsg => console.log(errMsg) )
 *
 * @param {('lossy'|'lossless'|'alpha'|'animation')} feature
 * @return {Promise}
 */
export function webpSupport(feature='alpha') {
	return new Promise((resolve, reject) => {
		const testImages = {
			lossy: "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
			lossless: "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
			alpha: "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==",
			animation: "UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"
		};
		const img = new Image();

		img.onload = () => {
			if ((img.width > 0) && (img.height > 0))
				resolve(`This browser supports webp images with ${feature}.`);
			else
				reject(`This browser does NOT fully support webp images with ${feature}.`);
		};
		img.onerror = () => {
			reject(`This browser does NOT fully support webp images with ${feature}`);
		};

		img.src = "data:image/webp;base64," + testImages[feature];
	});
}




/**
 * Part of a system to determine the best image resolution for a given device.
 *
 * @returns {string} - lo|med|hi
 */
export function screenResolution() {
	const pixelDensity = window.outerWidth * window.outerHeight;
	// iPhone SE:  320 x 568	 182k	lo
	// iPhone 8:   375 x 667     250k   lo
	// iPhone 8+:  414 x 736     305k   lo
	// iPad":      768 x 1024    786k   med
	// iPad Pro+:  1024 x 1365   1.4M   med
	// my desktop: 1024 x 1920   2M     hi
	// my 4k:      3200 x 1800   5.8M   hi

	if (pixelDensity > 1500000)
		return 'hi';

	else if (pixelDensity > 500000)
		return 'med';

	return 'lo';
}


/**
 * A simple, fast (faster than md5 etc.) hash code generator.
 *
 * @param {string} content  - string to hash
 * @returns {string}		- the unique hash code
 */
export function hash(content) {
	let hash = '';

	if (content.length === 0)
		return hash;

	for (let i = 0; i < content.length; i++) {
		let char = content.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}

	return hash;
}



/** An alternative to element.scrollIntoView()
 1. It handles selectors and Elements
 2. It's svelte friendly, handling components that are still rendering

 * @param {(Element|string)} elementOrSelector - element or CSS selector
 * @returns {void}
 */
export function scrollTo(elementOrSelector) {
	let element;
	if (elementOrSelector instanceof Element)
		element = elementOrSelector;
	else if (typeof elementOrSelector === 'string') {
		console.log('scroll to string', elementOrSelector);
		element = document.querySelector(elementOrSelector);
		if (!element) {
			window.setTimeout(() => {
				let element = document.querySelector(elementOrSelector);   // try again in case element creation is delayed
				if (element)
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 1500);
			return;
		}
	}

	if (element instanceof Element)
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}