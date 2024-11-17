/**
 * @fileOverview useful file/url functions
 */


const responsiveImageSizes = [ 320, 640, 960, 1200, 1800, 2400 ];
const supportedImages = [ 'jpg', 'png', 'gif', 'webp', 'svg' ];
const responsiveImages = [ 'jpg', 'png', 'gif', 'webp' ];




/**
 * strips the https://domain.com from a url
 *
 * @param {string} absoluteUrl - e.g. https://dev.cloud49.net/uploads/cloud49_dev/proposals/36/c49.jpg
 * @return string - i.e. /uploads/cloud49_dev/proposals/36/c49.jpg
 */
export function relativeUrl(absoluteUrl) {
	const urlObject = new URL(absoluteUrl);
	return urlObject.href.replace(urlObject.origin, '');
}



/**
 * Returns all possible variants of the specified url
 *
 * @param {string} url - input url or file (may be a responsive image)
 * @return array
 */
export function getRelatedUrls(url) {
	url = getRootUrl(url);
	let derivatives = [ url ];

	const parts = pathParts(url);
	const extension = parts['extension'];
	const isImage = supportedImages.includes(extension);
	const isResponsiveImage = responsiveImages.includes(extension);

	if (isImage) {
		if (isResponsiveImage) {
			for (const size of responsiveImageSizes)
				derivatives.push(`${parts['path']}/${parts['name']}_${size}w.webp`);

			if (extension !== 'webp') {
				derivatives.push(`${parts['path']}/${parts['name']}_thumb.${extension}`);
				derivatives.push(`${parts['path']}/${parts['name']}.webp`);
			}
		}
	} else
		derivatives.push(`${parts['path']}/${parts['name']}.${extension}_mime.png`);

	return derivatives;
}




/**
 * returns the source (or root) file/url of a responsive image e.g. /img/picture_640w.webp
 *
 * @param {string} url - input url or file (may be a responsive image)
 * @return string
 */
export function getRootUrl(url) {
	url = stripQueryString(url);
	url = url.replace('_thumb', '').replace('_mime.png', '');

	for (const size of responsiveImageSizes)
		url = url.replace(`_${size}w.`, '.');

	return url;
}




/**
 * returns a php-inspired path-info object { path: ..., name: ..., extension: ..., query: ..., hash: ... }
 *
 * @param {string} url - input url or file
 * @param {(''|'path'|'name'|'extension'|'query'|'hash')} flag - when flag present return a string (i.e. just that path part)
 * @return array|string
 */
export function pathParts(url, flag='') {
	const parts = { path: '', name: '', extension: '', query: '', hash: '' };

	parts.query = url.split('?')[1] || '';
	parts.hash = url.split('#')[1] || '';
	url = stripQueryString(url);

	let split = url.split('.');
	if (split.length > 1)
		parts.extension = split.pop();

	split = split.join('.').split('/');
	parts.name = split.pop();

	if (split.length)
		parts.path = split.join('/');

	return flag ? parts[flag] : parts;
}




/**
 * returns the source/root file name
 *
 * @param {string} url - input url or file
 * @return string
 */
export function stripQueryString(url) {
	return url.split('?')[0].split('#')[0];	// strip query string or hash
}




/**
 * convert absolute to relative url (SHOULD ONLY BE APPLIED TO LOCAL PATHS)
 *
 * @param {string} url - input url or file
 * @return string
 */
export function getRelativeUrl(url) {
	return url.replace(/^https?:\/\/[^\/]+\//i, '/');
}



// prevent browser caching by appending a random query string
export function randomizeUrl(url) {
	let query;
	let hash;
	const randomQueryString = '_=' + Math.round(Math.random() * 10000);

	if (typeof url === 'undefined' || url === '_self') {
		hash = document.location.hash;
		query = window.location.search;
		url = window.location.href;
	} else {
		if (typeof url !== 'string')
			throw 'fn randomizeUrl() expects the url to be a string';

		hash = url.match(/#[^?#]+/);
		hash = hash ? hash[0] : '';

		query = url.match(/\?[^?#]+/);
		query = query ? query[0] : '';
	}

	// get url by stripping query string & hash part
	url = url.match(/^[^?#]+/);
	url = url ? url[0] : '';
	url = url.replace(/[\s\/]+$/, '');		// remove trailing / or whitespace

	// replace existing cache buster or insert fresh
	if (/[?&]_=/.test(query))
		query = query.replace(/([?&])_=\d+/, '$1' + randomQueryString);
	else
		query += (query ? '&' : '?') + randomQueryString;

	return url + query + hash;
}


/**
 * return just the root filename e.g. picture.jpg
 *
 * @param {string} url - input url or file
 * @return string
 */
export function getFilename(url) {
	const parts = pathParts(getRootUrl(url));
	return `${parts['name']}.${parts['extension']}`;
}


export function mediaType(url, short=false) {
	if (!url)
		return short ? 'doc' : 'document';

	const match = url.match(/\.([0-9a-z]+)$/i);
	const ext = match ? match[1] : '';

	if (!ext) {
		if (url.match(/\/projects\//))
			return 'project';

		return short ? 'doc' : 'document';
	} else if (ext === 'pdf')
		return short ? 'pdf' : 'PDF document';
	else if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'webp', 'gif', 'tiff', 'tif', 'bmp', 'ico', 'avif', 'heic', 'heif'].includes(ext))
		return 'image';
	else if (['weba', 'opus', 'ogg', 'mp3', 'aac', '.wav', '.flac', '.m4a', '.wma', '.opus', '.alac'].includes(ext))
		return short ? 'audio' : 'audio file';
	else if (['csv', 'json', 'xml', 'yml', 'sql', 'sqlite3', 'mdb'].includes(ext))
		return short ? 'data' : 'data file';
	else if (['doc', 'docx'].includes(ext))
		return short ? 'word' : 'word document';
	else if (['xls', 'xlsx', 'xlsm', 'xlsb'].includes(ext))
		return short ? 'excel' : 'Excel spreadsheet';
	else if (['ppt', 'pptx', 'pptm'].includes(ext))
		return short ? 'powerpoint' : 'powerpoint presentation';
	else if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'mpeg', 'mpg', '3gp', 'ogv', 'webm'].includes(ext))
		return 'video';

	console.log(`unknown file type: ${ext}`);
	return short ? 'unknown' : 'file';
}


/**
 * convert absolute to relative url (SHOULD ONLY BE APPLIED TO LOCAL PATHS)
 *
 * @param {string} url - input url or file
 * @param {int} maxLength - limit total num chars
 * @return string
 */
export function ellipsize(url, maxLength=30) {
	if (url.length <= maxLength)
		return url;

	const separator = '...';
	maxLength -= separator.length;

	const head = url.substring(0, Math.round(maxLength * 0.75)).replace(/[-_.]+$/, '');
	const tail = url.substring(url.length - Math.round(maxLength * 0.25)).replace(/^[-_.]+/, '');

	return head + separator + tail;
}




/**
 * Convert a filesize in bytes to a human-readable format
 *
 * @param {number} bytes - input url or file
 * @return string
 */
export function formatFileSize(bytes) {
	if (!bytes)
		return '';

	if (bytes < 1000)
		return bytes + ' bytes';

	bytes = Math.round(bytes/1000);
	if (bytes < 1000)
		return bytes + ' kB';

	bytes = Math.round(bytes/1000);
	if (bytes < 1000)
		return bytes + ' MB';

	return Math.round(bytes/1000) + ' GB';
}



/**
 * Get the filesize of a file by HEAD request (typically served directly by NGINX)
 *
 * @param {string} url - input url of file
 * @return string|null
 */
export async function getFileSize(url) {
	try {
		const response = await fetch(url, { method: 'HEAD' })
		if (response.ok) {
			const fileSize = response.headers.get('Content-Length');
			return fileSize ? formatFileSize(fileSize) : null;
		} else
			console.error(`getFileSize failed to access the filesize for ${url}`);
	} catch (error) {
		console.error(`getFileSize failed with:`, error);
		return null;
	}
}