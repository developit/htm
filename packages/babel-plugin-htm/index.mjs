import htm from 'htm';

/**
 * @param {Babel} babel
 * @param {object} options
 * @param {string} [options.pragma=h]  JSX/hyperscript pragma.
 * @param {string} [options.tag=html]  The tagged template "tag" function name to process.
 * @param {boolean} [options.monomorphic=false]  Output monomorphic inline objects instead of using String literals.
 * @param {boolean} [options.useBuiltIns=false]  Use the native Object.assign instead of trying to polyfill it.
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
		if (key.match(/(^\d|[^a-z0-9_$])/i)) return t.stringLiteral(key);
		return t.identifier(key);
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
		if (inlineVNodes) {
			return t.objectExpression([
				options.monomorphic && t.objectProperty(propertyName('type'), t.numericLiteral(1)),
				t.objectProperty(propertyName('tag'), tag),
				t.objectProperty(propertyName('props'), props),
				t.objectProperty(propertyName('children'), children),
				options.monomorphic && t.objectProperty(propertyName('text'), t.nullLiteral())
			].filter(Boolean));
		}

		return t.callExpression(pragma, [tag, props, children]);
	}
	
	function spreadNode(args, state) {
		// 'Object.assign({}, x)', can be collapsed to 'x'.
		if (args.length === 2 && !t.isNode(args[0]) && Object.keys(args[0]).length === 0) {
			return propsNode(args[1]);
		}
		const helper = useBuiltIns ? dottedIdentifier('Object.assign') : state.addHelper('extends');
		return t.callExpression(helper, args.map(propsNode));
	}
	
	function propsNode(props) {
		return t.isNode(props) ? props : t.objectExpression(
			Object.keys(props).map(key => {
				let value = props[key];
				if (typeof value==='string') {
					value = t.stringLiteral(value);
				}
				else if (typeof value==='boolean') {
					value = t.booleanLiteral(value);
				}
				return t.objectProperty(propertyName(key), value);
			})
		);
	}

	function transform({ tag, props, children }, state) {
		function childMapper(child) {
			if (typeof child==='string') {
				return stringValue(child);
			}
			return t.isNode(child) ? child : transform(child, state);
		}
		const newTag = typeof tag === 'string' ? t.stringLiteral(tag) : tag;
		const newProps = !Array.isArray(props) ? propsNode(props) : spreadNode(props, state);
		const newChildren = t.arrayExpression(children.map(childMapper));
		return createVNode(newTag, newProps, newChildren);
	}
  
	function h(tag, props, ...children) {
		return { tag, props, children };
	}
	
	const html = htm.bind(h);
	
	function treeify(statics, expr) {
		const assign = Object.assign;
		try {
			Object.assign = function(...objs) {	return objs; };
			return html(statics, ...expr);
		}
		finally {
			Object.assign = assign;
		}
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

					const tree = treeify(statics, expr);
					path.replaceWith(transform(tree, state));
				}
			}
		}
	};
}