import { build,	treeify } from '../../src/build.mjs';

/**
 * @param {Babel} babel
 * @param {object} options
 * @param {string} [options.pragma=h]  JSX/hyperscript pragma.
 * @param {string} [options.tag=html]  The tagged template "tag" function name to process.
 * @param {boolean} [options.monomorphic=false]  Output monomorphic inline objects instead of using String literals.
 * @param {boolean} [options.useBuiltIns=false]  Use the native Object.assign instead of trying to polyfill it.
 * @param {boolean} [options.variableArity=true] If `false`, always passes exactly 3 arguments to the pragma function.
 */
export default function htmBabelPlugin({ types: t }, options = {}) {
	const pragma = options.pragma===false ? false : dottedIdentifier(options.pragma || 'h');
	const useBuiltIns = options.useBuiltIns;
	const inlineVNodes = options.monomorphic || pragma===false;

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
		const helper = useBuiltIns ? dottedIdentifier('Object.assign') : state.addHelper('extends');
		return t.callExpression(helper, args.map(propsNode));
	}
	
	function propValueNode(value) {
		if (typeof value==='string') {
			value = t.stringLiteral(value);
		}
		else if (typeof value==='boolean') {
			value = t.booleanLiteral(value);
		}
		return value;
	}

	function propsNode(props) {
		return t.isNode(props) ? props : t.objectExpression(
			Object.keys(props).map(key => {
				const values = props[key];

				let node = propValueNode(values[0]);
				let isString = t.isStringLiteral(node);
				values.slice(1).forEach(value => {
					const prop = propValueNode(value);
					if (!isString && !t.isStringLiteral(prop)) {
						node = t.binaryExpression('+', node, t.stringLiteral(''));
						isString = true;
					}
					node = t.binaryExpression('+', node, prop);
				});

				return t.objectProperty(propertyName(key), node);
			})
		);
	}

	function transform(node, state) {
		if (node === undefined) return t.identifier('undefined');
		if (node === null) return t.nullLiteral();

		const { tag, props, children } = node;
		function childMapper(child) {
			if (typeof child==='string') {
				return stringValue(child);
			}
			return t.isNode(child) ? child : transform(child, state);
		}
		const newTag = typeof tag === 'string' ? t.stringLiteral(tag) : tag;
		const newProps = spreadNode(props, state);
		const newChildren = t.arrayExpression(children.map(childMapper));
		return createVNode(newTag, newProps, newChildren);
	}

	// The tagged template tag function name we're looking for.
	// This is static because it's generally assigned via htm.bind(h),
	// which could be imported from elsewhere, making tracking impossible.
	const htmlName = options.tag || 'html';
	return {
		name: 'htm',
		visitor: {
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
				}
			}
		}
	};
}
