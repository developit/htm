import jsx from '@babel/plugin-syntax-jsx';

/**
 * @param {Babel} babel
 * @param {object} [options]
 * @param {string} [options.tag='html']  The tagged template "tag" function name to produce.
 * @param {string | boolean | object} [options.import=false]  Import the tag automatically
 */
export default function jsxToHtmBabelPlugin({ types: t }, options = {}) {
	const tagString = options.tag || 'html';
	const tag = dottedIdentifier(tagString);
	const importDeclaration = tagImport(options.import || false);

	function tagImport(imp) {
		if (imp === false) {
			return null;
		}
		const tagRoot = t.identifier(tagString.split('.')[0]);
		const { module, export: export_ } = typeof imp !== 'string' ? imp : {
			module: imp,
			export: null
		};

		let specifier;
		if (export_ === '*') {
			specifier = t.importNamespaceSpecifier(tagRoot);
		}
		else if (export_ === 'default') {
			specifier = t.importDefaultSpecifier(tagRoot);
		}
		else {
			specifier = t.importSpecifier(tagRoot, export_ ? t.identifier(export_) : tagRoot);
		}
		return t.importDeclaration([specifier], t.stringLiteral(module));
	}

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

	function escapeText(text) {
		if (text.indexOf('<') < 0) {
			return raw(text);
		}
		return expr(t.stringLiteral(text));
	}

	function escapePropValue(node) {
		const value = node.value;

		if (value.match(/^.*$/u)) {
			if (value.indexOf('"') < 0) {
				return raw(`"${value}"`);
			}
			else if (value.indexOf("'") < 0) {
				return raw(`'${value}'`);
			}
		}

		return expr(t.stringLiteral(node.value));
	}

	function commit(force) {
		if (!buffer && !force) return;
		quasis.push(t.templateElement({
			raw: buffer,
			cooked: buffer
		}));
		buffer = '';
	}
	
	function getName(node) {
		switch (node.type) {
			case 'JSXMemberExpression':
				return `${node.object.name}.${node.property.name}`;
		
			default:
				return node.name;
		}
	}

	function processChildren(node, name, isFragment) {
		const children = t.react.buildChildren(node);
		if (children && children.length !== 0) {
			if (!isFragment) {
				raw('>');
			}
			for (let i = 0; i < children.length; i++) {
				let child = children[i];
				if (t.isStringLiteral(child)) {
					// @todo - expose `whitespace: true` option?
					escapeText(child.value);
				}
				else if (t.isJSXElement(child)) {
					processNode(child);
				}
				else {
					expr(child);
				}
			}

			if (!isFragment) {
				if (name.match(/(^[$_A-Z]|\.)/)) {
					raw('</');
					expr(t.identifier(name));
					raw('>');
				}
				else {
					raw('</');
					raw(name);
					raw('>');
				}
			}
		}
		else if (!isFragment) {
			raw('/>');
		}
	}

	function processNode(node, path, isRoot) {
		const open = node.openingElement;
		const name = getName(open.name);
		const isFragment = name === 'React.Fragment';

		if (!isFragment) {
			if (name.match(/(^[$_A-Z]|\.)/)) {
				raw('<');
				expr(t.identifier(name));
			}
			else {
				raw('<');
				raw(name);
			}
			
			if (open.attributes) {
				for (let i = 0; i < open.attributes.length; i++) {
					const attr = open.attributes[i];
					raw(' ');
					if (t.isJSXSpreadAttribute(attr)) {
						raw('...');
						expr(attr.argument);
						continue;
					}
					const { name, value } = attr;
					raw(name.name);
					if (value) {
						raw('=');
						if (value.expression) {
							expr(value.expression);
						}
						else if (t.isStringLiteral(value)) {
							escapePropValue(value);
						}
						else {
							expr(value);
						}
					}
				}
			}
		}

		processChildren(node, name, isFragment);

		if (isRoot) {
			commit(true);
			const template = t.templateLiteral(quasis, expressions);
			const replacement = t.taggedTemplateExpression(tag, template);
			path.replaceWith(replacement);
		}
	}

	function jsxVisitorHandler(path, state, isFragment) {
		let quasisBefore = quasis.slice();
		let expressionsBefore = expressions.slice();
		let bufferBefore = buffer;
	
		buffer = '';
		quasis.length = 0;
		expressions.length = 0;
	
		if (isFragment) {
			processChildren(path.node, '', true);
			commit();
			const template = t.templateLiteral(quasis, expressions);
			const replacement = t.taggedTemplateExpression(tag, template);
			path.replaceWith(replacement);
		}
		else {
			processNode(path.node, path, true);
		}
	
		quasis = quasisBefore;
		expressions = expressionsBefore;
		buffer = bufferBefore;
	
		state.set('jsxElement', true);
	}

	return {
		name: 'transform-jsx-to-htm',
		inherits: jsx,
		visitor: {
			Program: {
				exit(path, state) {
					if (state.get('jsxElement') && importDeclaration) {
						path.unshiftContainer('body', importDeclaration);
					}
				}
			},

			JSXElement(path, state) {
				jsxVisitorHandler(path, state, false);
			},
			
			JSXFragment(path, state) {
				jsxVisitorHandler(path, state, true);
			}
		}
	};
}
