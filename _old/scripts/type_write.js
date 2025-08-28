const isWhitespace = char => {
	return char === ' ' || char === '\n' || char === '\t';
};

const typeWriteInplace = (element, charsPerSecond) =>
	new Promise(resolve => {
		let tokIndex = 0;

		/**
		 * @param {Node} node
		 */

		const tokenize = node => {
			const children = Array.from(node.childNodes);

			if (children.length != 0) {
				const tokenizedChildren = [];
				for (const childNode of children) {
					tokenizedChildren.push(tokenize(childNode));
				}

				node.replaceChildren(...tokenizedChildren);
				return node;
			}

			const tokenizedNode = document.createElement('span');

			const tokenizedChildren = [];
			for (const char of node.textContent) {
				if (char === '\n') {
					continue;
				}
				if (!isWhitespace(char)) {
					tokIndex++;
				}
				const element = document.createElement('span');
				element.classList.add('char');
				element.style.setProperty(
					'animation-delay',
					`${(tokIndex - 1) * (1000 / charsPerSecond)}ms`,
				);
				element.innerText = char;
				tokenizedChildren.push(element);
			}

			if (tokenizedChildren.length === 0 && node.nodeType !== Node.TEXT_NODE) {
				tokIndex++;
				node.classList.add('char');
				node.style.setProperty('animation-delay', `${(tokIndex - 1) * (1000 / charsPerSecond)}ms`);
				return node;
			}

			tokenizedNode.replaceChildren(...tokenizedChildren);

			return tokenizedNode;
		};

		tokenize(element);

		setTimeout(
			() => {
				resolve();
			},
			(tokIndex / charsPerSecond) * 1000,
		);
	});

/**
 *
 * @param {HTMLElement} element
 * @param {number} charsPerSecond
 */
export const typeWrite = async (element, charsPerSecond) => {
	const wrapper = document.createElement('div');
	wrapper.replaceChildren(...Array.from(element.childNodes));

	const clone = wrapper.cloneNode(true);
	element.replaceChildren(clone);

	await typeWriteInplace(clone, charsPerSecond);

	element.replaceChildren(wrapper);
};
