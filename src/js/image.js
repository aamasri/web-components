/**
 * @fileOverview image manipulation functions
 * @author Ananda Masri
 */

const debug = false;


/**
 * Converts an SVG HTML string to a <symbol> element with the specified ID.
 *
 * Usage e.g. svelte:
 * <svg xmlns="http://www.w3.org/2000/svg" style="display: none">
 *     {@html svgToSymbol(expandIcon, 'expandIcon')}
 *     {@html svgToSymbol(uploadIcon, 'uploadIcon')}
 *     {@html svgToSymbol(errorIcon, 'errorIcon')}
 * </svg>
 *
 * <use xlink:href="#expandIcon" />
 *
 * @param {string} svgHtml - The SVG HTML string to convert.
 * @param {string} name - The ID for the resulting <symbol> element.
 * @returns {string} - The modified SVG HTML string with <svg> replaced by <symbol>.
 */
export function svgToSymbol(svgHtml, name) {
    if (typeof svgHtml !== 'string' || typeof name !== 'string')
        console.error(`incorrect invocation of svgToSymbol(svgHtml:${svgHtml}, name:${name})`)
    return svgHtml.replace('<svg', `<symbol id="${name}"`).replace('</svg>', '</symbol>');
}



// webp responsive images are being rolled out in the srcset attribute.
// Unfortunately, there are a few browsers out there that support srcset - but not webp.
// This function will strip webp image from the srcset attribute
export function stripWebp() {
    const responsiveImages = document.querySelectorAll('img[srcset]');
    if (!responsiveImages) {
        if (debug) console.log(`No webp images found in srcset.`);
        return;
    }

    let count = 0;
    responsiveImages.forEach(responsiveImg => {
        const srcset = responsiveImg.getAttribute('srcset');
        const strippedSrcset = srcset.replace(/ ?[^ ,"]+\.webp [0-9]+w[ ,]?/gi, '');   // strip webp images

        if (strippedSrcset !== srcset) {
            responsiveImg.setAttribute('srcset', strippedSrcset);
            count++
        }
    });

    if (debug) console.log(`Stripped responsive webp images from the srcset of ${count} images.`);
}





// replace any low quality (marked with "upgradeMe") with its hi quality counterpart
export async function upgradeThumbnails() {
    if (typeof window === 'undefined')
        return; // prevent SvelteKit server-side rendering from breaking

    // find any upgradeable images
    const upgradeableImages = document.querySelectorAll('.upgradeMe');
    if (!upgradeableImages.length)
        return;

    let webpSupported = false;
    try {
        const { webpSupport } = await import('@aamasri/dom-utils');
        await webpSupport();
        webpSupported = true;
    } catch {}

    const { getRootUrl } = await import('./file-utils.js');

    let imageCount = 0;
    upgradeableImages.forEach(img => {
        const sourceUrl = img.nodeName === 'IMG'
            ? img.src
            : getComputedStyle(img).backgroundImage.replace('url("', '').replace('")', '');

        // upgrade if the thumbnail is not big enough (or if we don't know yet)
        const width = img.nodeName === 'IMG' ? img.width : img.offsetWidth;
        if (width && (width <= 320))
            return; // don't upgrade a thumbnail confined to a small size

        const replacementUrl = getRootUrl(sourceUrl); // determine the url of the high-quality image
        if (sourceUrl === replacementUrl)
            return; // already high-res - next image

        if (img.hasAttribute('srcset') && webpSupported)
            return; // when there's a srcset the browser should ignore the src attribute - next image

        img.classList.add(`backgroundLoadingImage-${++imageCount}`); // mark the lo-res image

        // create a tiny temporary hi-res image with a load handler to replace the initial lo-res image
        const tempImg = new Image();
        tempImg.id = `backgroundLoadingImage-${imageCount}`;
        tempImg.src = replacementUrl;
        tempImg.style.width = '1px';
        tempImg.style.visibility = 'hidden';
        tempImg.alt = '';

        // use the image load event to upgrade the lo-res image
        tempImg.addEventListener('load', function() {
            const targetImg = document.querySelector(`.upgradeMe.${this.id}`);
            if (targetImg.nodeName === 'IMG')
                targetImg.src = this.src;
            else
                targetImg.style.backgroundImage = `url(${this.src})`;

            // cleanup, remove .backgroundLoadingImage-*, upgradeMe classes
            targetImg.classList.remove(...Array.from(targetImg.classList).filter(className => className.match(/backgroundLoadingImage\S+|upgradeMe/gi)));
            this.remove(); // remove temp image
        });

        document.body.appendChild(tempImg);
    });
}




/* given an image element, e.g.
    <img src="/uploads/auro/portfolio/670/image-for-web5_thumb.jpg"
        srcset="/uploads/auro/portfolio/670/image-for-web5_320w.webp 320w,
            /uploads/auro/portfolio/670/image-for-web5_640w.webp 640w,
            /uploads/auro/portfolio/670/image-for-web5_960w.webp 960w,
            /uploads/auro/portfolio/670/image-for-web5_1200w.webp 1200w,
            /uploads/auro/portfolio/670/image-for-web5_1800w.webp 1800w,
            /uploads/auro/portfolio/670/image-for-web5.webp 2400w">

    return the image's max or existing natural width
 */
export function getImageMaxResolution(img) {
    const currentWidth = img.naturalWidth;
    if (img.srcset) {
        const availableWidths = [ ...img.srcset.matchAll(/(\d+)w/g) ].map(match => Number(match[1]));
        if (availableWidths.length) {
            return availableWidths.reduce((largest, current) => {
                return Math.max(largest, current);
            }, currentWidth);
        }
    }
    return currentWidth;
}



// Sometimes, we want images to be a certain size visually, regardless of their aspect ratio.
// We also want responsive images, meaning the image must either fill 100% of the space, or 50%, etc.
// This function returns the closest preferred width for the desired area
export function getImageWidth(imageUrl, desiredArea, container, preferredWidths=['100%', '50%', '30%', '25%']) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        // When the image loads, we can get its natural dimensions
        img.onload = function() {
            const desiredWidthPx = Math.sqrt(desiredArea * img.naturalWidth / img.naturalHeight);

            // allow container selector
            if (typeof container === 'string')
                container = document.querySelector(container);

            if (!container instanceof HTMLElement)
                reject('getImageWidth must be passed a container element or selector');

            // get the available width for content inside the container
            const style = window.getComputedStyle(container);
            const paddingLeft = parseFloat(style.paddingLeft);
            const paddingRight = parseFloat(style.paddingRight);
            const borderLeft = parseFloat(style.borderLeftWidth);
            const borderRight = parseFloat(style.borderRightWidth);
            const containerWidthPx = container.clientWidth - paddingLeft - paddingRight - borderLeft - borderRight;

            // get preferred widths in px
            const preferredWidthsPx = [];
            for (let preferredWidth of preferredWidths) {
                const preferredWidthPx = /%/.test(preferredWidth) ? containerWidthPx * parseInt(preferredWidth)/100 : parseInt(preferredWidth);
                preferredWidthsPx.push(preferredWidthPx);
            }

            // get the responsive width that is closest to our desired width (based on the desired area)
            const closestIndex = preferredWidthsPx.reduce((prevIndex, value, index) => {
                return Math.abs(value - desiredWidthPx) < Math.abs(preferredWidthsPx[prevIndex] - desiredWidthPx) ? index : prevIndex;
            }, 0);
            resolve(preferredWidths[closestIndex]);  // Return the closest responsive width for the desired image area
        };

        // In case there's an error loading the image
        img.onerror = function() {
            reject('getImageWidth failed to load the specified image');
        };

        img.src = imageUrl;     // load the image
    });
}




