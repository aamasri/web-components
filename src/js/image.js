/**
 * @fileOverview image manipulation functions
 * @author Ananda Masri
 */

const debug = false;
import { getRootUrl } from './file-utils.js';


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
// TODO ideally should not depend on jQuery (for sveltekit apps)
export async function upgradeThumbnails() {
    if (typeof window === 'undefined')
        return; // prevent sveltekit server-side rendering from breaking

    // find any upgradeable images
    let upgradeableImages = document.querySelectorAll('.upgradeMe');
    if (!upgradeableImages.length)
        return;

    if (typeof window.jQuery === 'undefined')
        window.jQuery = await import('jquery').default;


    let replacementUrl;
    let imageCount = 0;
    upgradeableImages.forEach(img => {
        const $targetImg = jQuery(img);
        const sourceUrl = (img.nodeName === 'IMG') ? img.src : $targetImg.css('background-image').replace('url(', '').replace(')', '').replace('"', '');

        // upgrade if the thumbnail is not big enough (or if we don't know yet)
        let width = $targetImg.width();
        if (width && (width <= 320))
            return;     // don't upgrade a thumbnail that's already a great fit

        replacementUrl = getRootUrl(sourceUrl);	// determine the url of the high-quality image

        if (sourceUrl === replacementUrl)
            return;	    // already high-res - next image

        if ($targetImg.attr('srcset') && ('browserInfo' in window && 'webpSupport' in window.browserInfo) && window.browserInfo.webpSupport)
            return;	    // when there's a srcset the browser should ignore the src attribute - next image

        $targetImg.addClass(`backgroundLoadingImage-${++imageCount}`);	// mark the lo-res image so that we can replace it once the hi-res image has loaded

        // create a tiny temporary hi-res image with a load handler to replace the initial lo-res image
        // as soon as it's hi-res image finishes loading
        jQuery(`<img id="backgroundLoadingImage-${imageCount}" src="${replacementUrl}" style="width: 1px; visibility: hidden;" alt="">`)
            .appendTo('body')
            .on('load',  function() {
                const imgRef = this.id;
                const $targetImg = jQuery(`.upgradeMe.${imgRef}`);

                // upgrade the lo-res image
                if ($targetImg.is('img'))
                    $targetImg.attr('src', this.src);
                else
                    $targetImg.css('background-image', `url(${this.src})`);

                // cleanup, remove .backgroundLoadingImage-*, upgradeMe classes
                $targetImg.removeClass(function (index, className) {
                    return className.match(/backgroundLoadingImage\S+|upgradeMe/gi) || [];
                });
                this.remove();	// remove temp image
            });
    });
}




/* given an image element, e.g.
    <img src="/uploads/manascisaac/portfolio/670/elderesforweb5_thumb.jpg"
        srcset="/uploads/manascisaac/portfolio/670/elderesforweb5_320w.webp 320w,
            /uploads/manascisaac/portfolio/670/elderesforweb5_640w.webp 640w,
            /uploads/manascisaac/portfolio/670/elderesforweb5_960w.webp 960w,
            /uploads/manascisaac/portfolio/670/elderesforweb5_1200w.webp 1200w,
            /uploads/manascisaac/portfolio/670/elderesforweb5_1800w.webp 1800w,
            /uploads/manascisaac/portfolio/670/elderesforweb5.webp 2400w">

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
export function getImageWidth(imageUrl, desiredArea, containerElement, preferredWidths=['100%', '50%', '30%', '25%']) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        // When the image loads, we can get its natural dimensions
        img.onload = function() {
            const desiredWidthPx = Math.sqrt(desiredArea * img.naturalWidth / img.naturalHeight);

            // get the available width for content inside the container
            const style = window.getComputedStyle(containerElement);
            const paddingLeft = parseFloat(style.paddingLeft);
            const paddingRight = parseFloat(style.paddingRight);
            const borderLeft = parseFloat(style.borderLeftWidth);
            const borderRight = parseFloat(style.borderRightWidth);
            const containerWidthPx = containerElement.clientWidth - paddingLeft - paddingRight - borderLeft - borderRight;

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




