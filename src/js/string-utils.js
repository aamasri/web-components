/**
 * @fileOverview general utilities (that don't belong in any other specific category)
 */



/**
 * pads a number with trailing spaces to the required
 *
 * @param {string|number} number - number to be padded with trailing spaces
 * @param {int} precision - 2 decimal places by default
 * @param {string} paddingCharacter 
 * @return string
 */
export function decimalPad(number, precision=2, paddingCharacter='\xa0') {
    number = number.toString();

    if (!precision) return number;

    let dp = number.indexOf('.');
    dp = (dp !== -1) ? number.length - dp -1 : -1;

    for (let i=dp; i<precision; i++)
        number += paddingCharacter;

    return number;
}






/**
 * Join a string with a natural language conjunction at the end.
 *
 * @param list
 * @param conjunction
 * @return string
 */
export function friendlyJoin(list=[], conjunction='and') {
    const last = list.pop();
    if (list)
        return list.join(', ')+` ${conjunction} ${last}`;

    return last || '';
}





/**
 * Convert reserved HTML characters. E.g. "&" => &amp;, "<" => &lt; ">" => &gt; , " => &quot;
 * Uses the DOM to encode the string which only works for client-side js.
 *
 * @param {string} string
 * @return string
 */
export function htmlEncode(string) {
    const tempElement = document.createElement('div');
    tempElement.appendChild(document.createTextNode(string));
    console.log(`converted ${string} to ${tempElement.innerHTML}`)
    return tempElement.innerHTML.replace(/"/g, '&quot;');   // replace double quotes as well
}


