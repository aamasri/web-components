/**
 * @fileOverview useful string manipulation prototypes and functions
 * @author Ananda Masri
 */



String.prototype.isWhitespace = function() {
    const el = document.createElement('div');
    el.innerHTML = this;

    if (el.querySelector('img, audio, video, source, track, picture, figure, canvas, iframe'))
        return false;

    return !el.textContent.trim();
}


// convert HTML entities like &amp; to their actual characters but preserve html tags
// use this when you want to sanitize a string to display in a textarea element
String.prototype.toTextarea = function() {
    const txt = document.createElement("textarea");
    txt.innerHTML = this;
    return txt.value;
};


// this function is compatible with php's rawurldecode
String.prototype.myEncode = function() {
    return encodeURIComponent(this);
};


// this function is compatible with php's urlencode (use this instead of decodeURIComponent)
String.prototype.myDecode = function() {
    return decodeURIComponent(this.replace(/%2526/g, '&').replace(/%2520/g, ' ').replace(/%252520/g, ' '));
};


// convert string to title case uppercase-first char of words & lowercase the rest
String.prototype.toTitleCase = function() {
    return this.replace(/([^\W_]+[^\s-'`]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();});
};


// remove multiple spaces from string
String.prototype.compactSpaces = function() {
    return this.replace(/ +/g, ' ');
};


String.prototype.ucFirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


String.prototype.ucWords = function() {
    return (this + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
    });
};


// this isn't perfect but covers most cases
String.prototype.pluralize = function(number) {
    if (isNaN(number) || parseInt(number) < 2)
        return this;

    const uppercase = this === this.toUpperCase();

    const irregular = {
        'gas': 'gasses',
        'chef': 'chefs',
        'child': 'children',
        'person': 'people',
        'man': 'men',
        'woman': 'women',
        'tooth': 'teeth',
        'foot': 'feet',
        'mouse': 'mice',
        'goose': 'geese',
        'ox': 'oxen',
        'basis': 'bases',
        'radius': 'radii',
        'syllabus': 'syllabi',
        'sheep': 'sheep',
        'fish': 'fish',
        'means': 'means',
        'species': 'species',
        'series': 'series',
        'ice': 'ice',
        'deer': 'deer',
    }

    for (const key in irregular) {
        const match = new RegExp(`/${key}$/i`);
        if (match.test(this))
            return this.replace(match, uppercase ? irregular[key].toUpperCase() : irregular[key]);
    }

    // word ends in ss, x, ch, or sh: append ‘es’ e.g. dress –> dresses
    if (/(ss|x|ch|sh)$/i.test(this))
        return this + (uppercase ? 'ES' : 'es');

    // word ends in ro, to: append ‘es’ e.g. veto –> vetoes
    if (/[rt]o$/i.test(this))
        return this + (uppercase ? 'ES' : 'es');

    // word ends in ey, ay, oy: append ‘s’ e.g. day –> days
    else if (/[eao]y$/i.test(this))
        return this + (uppercase ? 'S' : 's');

    // word ends in ff: append ‘s’ e.g. cliff –> cliffs
    else if (/ff$/i.test(this))
        return this + (uppercase ? 'S' : 's');

    // word ends in f or fe: append ‘ves’ e.g. knife -> knives
    else if (/(f|fe)$/i.test(this))
        return this.replace(/(f|fe)$/i, uppercase ? 'VES' : 'ves');

    return this + 's';
};