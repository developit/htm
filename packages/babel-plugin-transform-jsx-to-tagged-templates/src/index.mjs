import jsx from 'babel-plugin-syntax-jsx';

function escapeValue(value) {
	if (value.match(/^[a-z0-9_' &]+$/gi)) {
		return `"${value}"`;
	}
	return JSON.stringify(value);
}

/**
 * @param {Babel} babel
 * @param {object} [options]
 * @param {string} [options.tag='html']  The tagged template "tag" function name to produce.
 */
export default function jsxToTaggedTemplatesBabelPlugin({ types: t }, options = {}) {
	const tag = dottedIdentifier(options.tag || 'html');

	function dottedIdentifier(keypath) {
		const path = keypath.split('.');
		let out;
		for (let i = 0; i < path.length; i++) {
			const ident = t.identifier(path[i]);
			out = i === 0 ? ident : t.memberExpression(out, ident);
		}
		return out;
	}

	let quasis = [];
	let expressions = [];
	let buffer = '';

	function expr(value) {
		commit(true);
		expressions.push(value);
	}

	function raw(str) {
		buffer += str;
	}

	function commit(force) {
		if (!buffer && !force) return;
		quasis.push(t.templateElement({
			raw: buffer,
			cooked: buffer
		}));
		buffer = '';
	}

	function processNode(node, path, isRoot) {
		const open = node.openingElement;
		const { name } = open.name;

		const toProcess = [];

		if (name.match(/^[A-Z]/)) {
			raw('<');
			expr(t.identifier(name));
		}
		else {
			raw('<');
			raw(name);
		}

		if (open.attributes) {
			for (let i = 0; i < open.attributes.length; i++) {
				const { name, value } = open.attributes[i];
				raw(' ');
				raw(name.name);
				if (value) {
					raw('=');
					if (value.expression) {
						expr(value.expression);
					}
					else if (t.isStringLiteral(value)) {
						raw(escapeValue(value.value));
					}
					else {
						expr(value);
					}
				}
			}
		}
		raw('>');

		if (node.children) {
			for (let i = 0; i < node.children.length; i++) {
				let child = node.children[i];
				if (t.isJSXText(child)) {
					raw(child.value);
				}
				else {
					if (t.isJSXExpressionContainer(child)) {
						child = child.expression;
					}
					if (t.isJSXElement(child)) {
						processNode(child);
					}
					else {
						expr(child);
						toProcess.push(child);
					}
				}
			}
		}

		if (name.match(/^[A-Z]/)) {
			raw('</');
			expr(t.identifier(name));
			raw('>');
		}
		else {
			raw('</');
			raw(name);
			raw('>');
		}

		if (isRoot) {
			commit();
			const template = t.templateLiteral(quasis, expressions);
			const replacement = t.taggedTemplateExpression(tag, template);
			path.replaceWith(replacement);
		}
	}

	return {
		name: 'transform-jsx-to-tagged-templates',
		inherits: jsx,
		visitor: {
			JSXElement(path) {
				let quasisBefore = quasis.slice();
				let expressionsBefore = expressions.slice();
				let bufferBefore = buffer;

				buffer = '';
				quasis.length = 0;
				expressions.length = 0;

				processNode(path.node, path, true);

				quasis = quasisBefore;
				expressions = expressionsBefore;
				buffer = bufferBefore;
			}
		}
	};
}
