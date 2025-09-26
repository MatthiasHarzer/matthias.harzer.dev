import type { Subscriber, Unsubscribe } from './reactive.ts';

const observeSize = (element: HTMLElement, callback: Subscriber<DOMRectReadOnly>): Unsubscribe => {
	const resizeObserver = new ResizeObserver(() => {
		const rect = element.getBoundingClientRect();
		callback(rect);
	});
	resizeObserver.observe(element);

	return () => {
		resizeObserver.disconnect();
	};
};

export { observeSize };
