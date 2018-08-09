import { h, VNode } from 'preact';
declare function render(tree: VNode, parent: HTMLElement): void;
declare const html: (strings: TemplateStringsArray, ...values: any[]) => VNode;
export { h, html, render };
