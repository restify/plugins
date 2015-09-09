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


module.exports = {
    shallowCopy: shallowCopy
};
