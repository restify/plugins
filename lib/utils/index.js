'use strict';


/**
 * Return a shallow copy of the given object;
 * @public
 * @method  shallowCopy
 * @param   {Object} obj the object to copy
 * @returns {Object}     the new copy of the object
 */
function shallowCopy(obj) {
    if (!obj) {
        return obj;
    }

    var copy = {};
    Object.keys(obj).forEach(function (k) {
        copy[k] = obj[k];
    });

    return copy;
}

/**
 * takes an instance of a date object, formats it UTC
 *     e.g., Wed, 17 Jun 2015 01:30:26 GMT
 * @public
 * @function httpDate
 * @param    {Object} now a date object
 * @returns  {String}     formatted dated object
 */
function httpDate(now) {
    var d = now || new Date();

    return d.toUTCString();
}


module.exports = {
    shallowCopy: shallowCopy,
    httpDate: httpDate
};

