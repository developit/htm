import { h, Component, VNode } from 'preact';
declare function render(tree: Component, parent: HTMLElement): void;
declare const html: (strings: TemplateStringsArray, ...values: any[]) => VNode;
export { h, html, render, Component };
