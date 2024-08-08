/**
 * @param {Function} func
 * @returns {[string, boolean][]} - An array of tuples containing the parameter name and a boolean indicating if the parameter has a default value
 * @source https://stackoverflow.com/a/9924463 (modified)
 */
export const getFunctionParameters = (func) => {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
    const fnStr = func.toString().replace(STRIP_COMMENTS, "");
    const paramsStr = fnStr
        .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
        .trim();

    if (paramsStr.length === 0) return [];

    const params = paramsStr.split(",").map((p) => p.trim());

    return params.map((p) => {
        const parts = p.split("=");
        const hasDefault = parts.length > 1;
        return [parts[0], hasDefault];
    });
};

/**
 * Rounds a number to the nearest multiple of another number
 * @param {number} value
 * @param {number} nearest
 * @return {number}
 */
export const roundToNearest = (value, nearest) => {
    return Math.round(value / nearest) * nearest;
}
