import { Observable, type ReadOnlyObservable } from './reactive.ts';

const observeSize = (element: HTMLElement): ReadOnlyObservable<DOMRectReadOnly> => {
	const observable = new Observable<DOMRectReadOnly>(element.getBoundingClientRect());

	const resizeObserver = new ResizeObserver(() => {
		const rect = element.getBoundingClientRect();
		observable.set(rect);
	});
	resizeObserver.observe(element);

	return observable;
};

export { observeSize };
