import htm from 'htm';

/**
 * @param {Babel} babel
 * @param {object} options
 * @param {string} [options.pragma=h]  JSX/hyperscript pragma.
 * @param {string} [options.tag=html]  The tagged template "tag" function name to process.
 * @param {boolean} [options.monomorphic=false]  Output monomorphic inline objects instead of using String literals.
 */
export default function htmBabelPlugin({ types: t }, options = {}) {
	const pragma = options.pragma===false ? false : dottedIdentifier(options.pragma || 'h');
  
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

	let isVNode = t.isCallExpression;
	if (inlineVNodes) {
		isVNode = node => {
			if (!t.isObjectExpression(node)) return false;
			return node.properties[0].value.value!==3;
		};
	}

	function childMapper(child, index, children) {
		// JSX-style whitespace: (@TODO: remove? doesn't match the browser version)
		if (typeof child==='string' && child.trim().length===0 || child==null) {
			if (index===0 || index===children.length-1) return null;
		}
		if (typeof child==='string' && isVNode(children[index-1]) && isVNode(children[index+1])) {
			child = child.trim();
		}
		if (typeof child==='string') {
			return stringValue(child);
		}
		return child;
	}

	function h(tag, props) {
		if (typeof tag==='string') {
			tag = t.stringLiteral(tag);
		}

		let propsNode;

		if (t.isObjectExpression(props)) {
			propsNode = props;
			for (let i in props) {
				if (props.hasOwnProperty(i) && props[i] && props[i].type) {
					for (let j=0; j<props.properties.length; j++) {
						if (props.properties[j].start > props[i].start) {
							props.properties.splice(j, 0, t.objectProperty(propertyName(i), props[i]));
							break;
						}
					}
					delete props[i];
				}
			}
		}
		else {
			propsNode = t.objectExpression(
				Object.keys(props).map(key => {
					let value = props[key];
					if (typeof value==='string') {
						value = t.stringLiteral(value);
					}
					else if (typeof value==='boolean') {
						value = t.booleanLiteral(value);
					}
					else if (typeof value==='number') {
						value = t.stringLiteral(value + '');
					}
					return t.objectProperty(propertyName(key), value);
				})
			);
		}

		// recursive iteration of possibly nested arrays of children.
		let children = [];
		if (arguments.length>2) {
			const stack = [];
			// eslint-disable-next-line prefer-rest-params
			for (let i=arguments.length; i-->2; ) stack.push(arguments[i]);
			while (stack.length) {
				const child = stack.pop();
				if (Array.isArray(child)) {
					for (let i=child.length; i--; ) stack.push(child[i]);
				}
				else if (child!=null) {
					children.push(child);
				}
			}
			children = children.map(childMapper).filter(Boolean);
		}
		children = t.arrayExpression(children);

		return createVNode(tag, propsNode, children);
	}
  
	const html = htm.bind(h);

	// The tagged template tag function name we're looking for.
	// This is static because it's generally assigned via htm.bind(h),
	// which could be imported from elsewhere, making tracking impossible.
	const htmlName = options.tag || 'html';
	return {
		name: 'htm',
		visitor: {
			TaggedTemplateExpression(path) {
				const tag = path.node.tag.name;
				if (htmlName[0]==='/' ? patternStringToRegExp(htmlName).test(tag) : tag === htmlName) {
					const statics = path.node.quasi.quasis.map(e => e.value.raw);
					const expr = path.node.quasi.expressions;
					path.replaceWith(html(statics, ...expr));
				}
			}
		}
	};
}