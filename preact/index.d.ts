declare module "htm/preact" {
	import { h, Component, VNode } from 'preact';

	function render(tree: Component, parent: HTMLElement): void;

	const html: (strings: string[], values: any[]) => VNode;

	export { h, html, render, Component };
}