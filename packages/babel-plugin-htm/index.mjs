import { build, treeify } from '../../src/build.mjs';

/**
 * @param {Babel} babel
 * @param {object} options
 * @param {string} [options.pragma=h]  JSX/hyperscript pragma.
 * @param {string} [options.tag=html]  The tagged template "tag" function name to process.
 * @param {string | boolean | object} [options.import=false]  Import the tag automatically
 * @param {boolean} [options.monomorphic=false]  Output monomorphic inline objects instead of using String literals.
 * @param {boolean} [options.useBuiltIns=false]  Use the native Object.assign instead of trying to polyfill it.
 * @param {boolean} [options.useNativeSpread=false]  Use the native { ...a, ...b } syntax for prop spreads.
 * @param {boolean} [options.variableArity=true] If `false`, always passes exactly 3 arguments to the pragma function.
 */
export default function htmBabelPlugin({ types: t }, options = {}) {
	const pragmaString = options.pragma===false ? false : options.pragma || 'h';
	const pragma = pragmaString===false ? false : dottedIdentifier(pragmaString);
	const useBuiltIns = options.useBuiltIns;
	const useNativeSpread = options.useNativeSpread;
	const inlineVNodes = options.monomorphic || pragma===false;
	const importDeclaration = pragmaImport(options.import || false);

	function pragmaImport(imp) {
		if (pragmaString === false || imp === false) {
			return null;
		}
		const pragmaRoot = t.identifier(pragmaString.split('.')[0]);
		const { module, export: export_ } = typeof imp !== 'string' ? imp : {
			module: imp,
			export: null
		};

		let specifier;
		if (export_ === '*') {
			specifier = t.importNamespaceSpecifier(pragmaRoot);
		}
		else if (export_ === 'default') {
			specifier = t.importDefaultSpecifier(pragmaRoot);
		}
		else {
			specifier = t.importSpecifier(pragmaRoot, export_ ? t.identifier(export_) : pragmaRoot);
		}
		return t.importDeclaration([specifier], t.stringLiteral(module));
	}

	function dottedIdentifier(keypath) {
		const path = keypath.split('.');
		let out;
		for (let i=0; i<path.length; i++) {
			const ident = propertyName(path[i]);
			out = i===0 ? ident : t.memberExpression(out, ident);
		}
		return out;
	}

	function patternStringToRegExp(str) {
		const parts = str.split('/').slice(1);
		const end = parts.pop() || '';
		return new RegExp(parts.join('/'), end);
	}

	function propertyName(key) {
		if (t.isValidIdentifier(key)) {
			return t.identifier(key);
		}
		return t.stringLiteral(key);
	}

	function objectProperties(obj) {
		return Object.keys(obj).map(key => {
			const values = obj[key].map(valueOrNode =>
				t.isNode(valueOrNode) ? valueOrNode : t.valueToNode(valueOrNode)
			);

			let node = values[0];
			if (values.length > 1 && !t.isStringLiteral(node) && !t.isStringLiteral(values[1])) {
				node = t.binaryExpression('+', t.stringLiteral(''), node);
			}
			values.slice(1).forEach(value => {
				node = t.binaryExpression('+', node, value);
			});

			return t.objectProperty(propertyName(key), node);
		});
	}

	function stringValue(str) {
		if (options.monomorphic) {
			return t.objectExpression([
				t.objectProperty(propertyName('type'), t.numericLiteral(3)),
				t.objectProperty(propertyName('tag'), t.nullLiteral()),
				t.objectProperty(propertyName('props'), t.nullLiteral()),
				t.objectProperty(propertyName('children'), t.nullLiteral()),
				t.objectProperty(propertyName('text'), t.stringLiteral(str))
			]);
		}
		return t.stringLiteral(str);
	}

	function createVNode(tag, props, children) {
		// Never pass children=[[]].
		if (children.elements.length === 1 && t.isArrayExpression(children.elements[0]) && children.elements[0].elements.length === 0) {
			children = children.elements[0];
		}

		if (inlineVNodes) {
			return t.objectExpression([
				options.monomorphic && t.objectProperty(propertyName('type'), t.numericLiteral(1)),
				t.objectProperty(propertyName('tag'), tag),
				t.objectProperty(propertyName('props'), props),
				t.objectProperty(propertyName('children'), children),
				options.monomorphic && t.objectProperty(propertyName('text'), t.nullLiteral())
			].filter(Boolean));
		}

		// Passing `{variableArity:false}` always produces `h(tag, props, children)` - where `children` is always an Array.
		// Otherwise, the default is `h(tag, props, ...children)`.
		if (options.variableArity !== false) {
			children = children.elements;
		}

		return t.callExpression(pragma, [tag, props].concat(children));
	}

	function spreadNode(args, state) {
		if (args.length === 0) {
			return t.nullLiteral();
		}
		if (args.length > 0 && t.isNode(args[0])) {
			args.unshift({});
		}

		// 'Object.assign(x)', can be collapsed to 'x'.
		if (args.length === 1) {
			return propsNode(args[0]);
		}
		// 'Object.assign({}, x)', can be collapsed to 'x'.
		if (args.length === 2 && !t.isNode(args[0]) && Object.keys(args[0]).length === 0) {
			return propsNode(args[1]);
		}

		if (useNativeSpread) {
			const properties = [];
			args.forEach(arg => {
				if (t.isNode(arg)) {
					properties.push(t.spreadElement(arg));
				}
				else {
					properties.push(...objectProperties(arg));
				}
			});
			return t.objectExpression(properties);
		}

		const helper = useBuiltIns ? dottedIdentifier('Object.assign') : state.addHelper('extends');
		return t.callExpression(helper, args.map(propsNode));
	}

	function propsNode(props) {
		return t.isNode(props) ? props : t.objectExpression(objectProperties(props));
	}

	function transform(node, state) {
		if (t.isNode(node)) return node;
		if (typeof node === 'string') return stringValue(node);
		if (typeof node === 'undefined') return t.identifier('undefined');

		const { tag, props, children } = node;
		const newTag = typeof tag === 'string' ? t.stringLiteral(tag) : tag;
		const newProps = spreadNode(props, state);
		const newChildren = t.arrayExpression(children.map(child => transform(child, state)));
		return createVNode(newTag, newProps, newChildren);
	}

	// The tagged template tag function name we're looking for.
	// This is static because it's generally assigned via htm.bind(h),
	// which could be imported from elsewhere, making tracking impossible.
	const htmlName = options.tag || 'html';
	return {
		name: 'htm',
		visitor: {
			Program: {
				exit(path, state) {
					if (state.get('hasHtm') && importDeclaration) {
						path.unshiftContainer('body', importDeclaration);
					}
				},
			},
			TaggedTemplateExpression(path, state) {
				const tag = path.node.tag.name;
				if (htmlName[0]==='/' ? patternStringToRegExp(htmlName).test(tag) : tag === htmlName) {
					const statics = path.node.quasi.quasis.map(e => e.value.raw);
					const expr = path.node.quasi.expressions;

					const tree = treeify(build(statics), expr);
					const node = !Array.isArray(tree)
						? transform(tree, state)
						: t.arrayExpression(tree.map(root => transform(root, state)));
					path.replaceWith(node);
					state.set('hasHtm', true);
				}
			}
		}
	};
}
