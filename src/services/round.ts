/**
 * Rounds a number to the nearest multiple of another number
 * @param {number} value
 * @param {number} nearest
 * @return {number}
 */
export const roundToNearest = (value: number, nearest: number) => {
	return Math.round(value / nearest) * nearest;
};

export const escapeHtml = (str: string) => {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
};
