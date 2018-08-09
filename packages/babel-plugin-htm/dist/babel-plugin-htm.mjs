import { JSDOM } from 'jsdom';

var before = global.document;
global.document = new JSDOM().window.document;
var htm = require('htm');
global.document = before;
var currentExpressions;
function htmBabelPlugin(ref, options) {
    var t = ref.types;
    if ( options === void 0 ) options = {};

    var pragma = options.pragma === false ? false : dottedIdentifier(options.pragma || 'h');
    var inlineVNodes = options.monomorphic || pragma === false;
    function dottedIdentifier(keypath) {
        var path = keypath.split('.');
        var out;
        for (var i = 0;i < path.length; i++) {
            var ident = propertyName(path[i]);
            out = i === 0 ? ident : t.memberExpression(out, ident);
        }
        return out;
    }
    
    function patternStringToRegExp(str) {
        var parts = str.split('/').slice(1);
        var end = parts.pop() || '';
        return new RegExp(parts.join('/'), end);
    }
    
    function propertyName(key) {
        if (key.match(/(^\d|[^a-z0-9_$])/i)) 
            { return t.stringLiteral(key); }
        return t.identifier(key);
    }
    
    function stringValue(str) {
        if (options.monomorphic) {
            return t.objectExpression([t.objectProperty(propertyName('type'), t.numericLiteral(3)),
                t.objectProperty(propertyName('tag'), t.nullLiteral()),t.objectProperty(propertyName('props'), t.nullLiteral()),
                t.objectProperty(propertyName('children'), t.nullLiteral()),t.objectProperty(propertyName('text'), t.stringLiteral(str))]);
        }
        return t.stringLiteral(str);
    }
    
    function createVNode(tag, props, children) {
        if (inlineVNodes) {
            return t.objectExpression([options.monomorphic && t.objectProperty(propertyName('type'), t.numericLiteral(1)),
                t.objectProperty(propertyName('tag'), tag),t.objectProperty(propertyName('props'), props),
                t.objectProperty(propertyName('children'), children),options.monomorphic && t.objectProperty(propertyName('text'), t.nullLiteral())].filter(Boolean));
        }
        return t.callExpression(pragma, [tag,props,children]);
    }
    
    var isVNode = t.isCallExpression;
    if (inlineVNodes) {
        isVNode = (function (node) {
            if (!t.isObjectExpression(node)) 
                { return false; }
            return node.properties[0].value.value !== 3;
        });
    }
    function childMapper(child, index, children) {
        if (typeof child === 'string' && child.trim().length === 0 || child == null) {
            if (index === 0 || index === children.length - 1) 
                { return null; }
        }
        if (typeof child === 'string' && isVNode(children[index - 1]) && isVNode(children[index + 1])) {
            child = child.trim();
        }
        if (typeof child === 'string') {
            var matches = child.match(/\$\$\$_h_\[(\d+)\]/);
            if (matches) 
                { return currentExpressions[matches[1]]; }
            return stringValue(child);
        }
        return child;
    }
    
    function h(tag, props) {
        var arguments$1 = arguments;

        if (typeof tag === 'string') {
            var matches = tag.match(/\$\$\$_h_\[(\d+)\]/);
            if (matches) 
                { tag = currentExpressions[matches[1]]; }
             else 
                { tag = t.stringLiteral(tag); }
        }
        var propsNode = t.objectExpression(Object.keys(props).map(function (key) {
            var value = props[key];
            if (typeof value === 'string') {
                var tokenizer = /\$\$\$_h_\[(\d+)\]/g;
                var token, lhs, root, index = 0, lastIndex = 0;
                var append = function (expr) {
                    if (lhs) 
                        { expr = t.binaryExpression('+', lhs, expr); }
                    root = (lhs = expr);
                };
                while (token = tokenizer.exec(value)) {
                    append(t.stringLiteral(value.substring(index, token.index)));
                    append(currentExpressions[token[1]]);
                    index = token.index;
                    lastIndex = tokenizer.lastIndex;
                }
                if (lastIndex < value.length) {
                    append(t.stringLiteral(value.substring(lastIndex)));
                }
                value = root;
            } else if (typeof value === 'boolean') {
                value = t.booleanLiteral(value);
            }
            return t.objectProperty(propertyName(key), value);
        }));
        var children = [];
        if (arguments.length > 2) {
            var stack = [];
            for (var i = arguments.length;i-- > 2; ) 
                { stack.push(arguments$1[i]); }
            while (stack.length) {
                var child = stack.pop();
                if (Array.isArray(child)) {
                    for (var i$1 = child.length;i$1--; ) 
                        { stack.push(child[i$1]); }
                } else if (child != null) {
                    children.push(child);
                }
            }
            children = children.map(childMapper).filter(Boolean);
        }
        children = t.arrayExpression(children);
        return createVNode(tag, propsNode, children);
    }
    
    var html = htm.bind(h);
    var htmlName = options.tag || 'html';
    return {
        name: 'htm',
        visitor: {
            TaggedTemplateExpression: function TaggedTemplateExpression(path) {
                var tag = path.node.tag.name;
                if (htmlName[0] === '/' ? patternStringToRegExp(htmlName).test(tag) : tag === htmlName) {
                    var statics = path.node.quasi.quasis.map(function (e) { return e.value.raw; });
                    var expr = path.node.quasi.expressions;
                    currentExpressions = expr;
                    path.replaceWith(html.apply(void 0, [ statics ].concat( expr.map(function (p, i) { return ("$$$_h_[" + i + "]"); }) )));
                }
            }
        }
    };
}



//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4Lm1qcyhvcmlnaW5hbCkiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsUUFBUyxZQUFhO0FBQ3RCLEtBQUEsQ0FBTSxTQUFTLE1BQUEsQ0FBTztBQUN0QixNQUFBLENBQU8sUUFBUCxDQUFBLENBQUEsQ0FBa0IsSUFBSSxLQUFKLEVBQUEsQ0FBWSxNQUFaLENBQW1CO0FBQ3JDLEtBQUEsQ0FBTSxNQUFNLE9BQUEsQ0FBUTtBQUNwQixNQUFBLENBQU8sUUFBUCxDQUFBLENBQUEsQ0FBa0I7QUFRbEIsR0FBQSxDQUFJO0FBU0osZUFBZSxTQUFTLGVBQWUsQ0FBRSxPQUFPLEVBQUssRUFBQSxPQUFBLEdBQVUsSUFBSTtJQUNsRSxLQUFBLENBQU0sU0FBUyxPQUFBLENBQVEsTUFBUixDQUFBLEdBQUEsQ0FBaUIsS0FBakIsR0FBeUIsUUFBUSxnQkFBQSxDQUFpQixPQUFBLENBQVEsTUFBUixDQUFBLEVBQUEsQ0FBa0I7SUFFbkYsS0FBQSxDQUFNLGVBQWUsT0FBQSxDQUFRLFdBQVIsQ0FBQSxFQUFBLENBQXVCLE1BQUEsQ0FBQSxHQUFBLENBQVM7SUFFckQsU0FBUyxpQkFBaUIsU0FBUztRQUNsQyxLQUFBLENBQU0sT0FBTyxPQUFBLENBQVEsS0FBUixDQUFjO1FBQzNCLEdBQUEsQ0FBSTtRQUNKLEtBQUssR0FBQSxDQUFJLElBQUUsRUFBRyxDQUFBLENBQUEsQ0FBQSxDQUFFLElBQUEsQ0FBSyxRQUFRLENBQUEsSUFBSztZQUNqQyxLQUFBLENBQU0sUUFBUSxZQUFBLENBQWEsSUFBQSxDQUFLO1lBQ2hDLEdBQUEsQ0FBQSxDQUFBLENBQU0sQ0FBQSxDQUFBLEdBQUEsQ0FBSSxDQUFKLEdBQVEsUUFBUSxDQUFBLENBQUUsZ0JBQUYsQ0FBbUIsS0FBSztRQUNqRDtRQUNFLE9BQU87SUFDVDs7SUFFQyxTQUFTLHNCQUFzQixLQUFLO1FBQ25DLEtBQUEsQ0FBTSxRQUFRLEdBQUEsQ0FBSSxLQUFKLENBQVUsSUFBVixDQUFlLEtBQWYsQ0FBcUI7UUFD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bCkiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBKU0RPTSB9IGZyb20gJ2pzZG9tJztcbmNvbnN0IGJlZm9yZSA9IGdsb2JhbC5kb2N1bWVudDtcbmdsb2JhbC5kb2N1bWVudCA9IG5ldyBKU0RPTSgpLndpbmRvdy5kb2N1bWVudDtcbmNvbnN0IGh0bSA9IHJlcXVpcmUoJ2h0bScpO1xuZ2xvYmFsLmRvY3VtZW50ID0gYmVmb3JlO1xuXG4vLyBodG0oKSB1c2VzIHRoZSBIVE1MIHBhcnNlciwgd2hpY2ggc2VyaWFsaXplcyBhdHRyaWJ1dGUgdmFsdWVzLlxuLy8gdGhpcyBpcyBhIHByb2JsZW0sIGJlY2F1c2UgY29tcG9zaXRlIHZhbHVlcyBoZXJlIGNhbiBiZSBtYWRlIHVwXG4vLyBvZiBzdHJpbmdzIGFuZCBBU1Qgbm9kZXMsIHdoaWNoIHNlcmlhbGl6ZSB0byBbb2JqZWN0IE9iamVjdF0uXG4vLyBTaW5jZSB0aGUgaGFuZG9mZiBmcm9tIEFTVCBub2RlIGhhbmRsaW5nIHRvIGh0bSgpIGlzIHN5bmNocm9ub3VzLFxuLy8gdGhpcyBnbG9iYWwgbG9va3VwIHdpbGwgYWx3YXlzIHJlZmxlY3QgdGhlIGNvcnJlc3BvbmRpbmdcbi8vIEFTVC1kZXJpdmVkIHZhbHVlcyBmb3IgdGhlIGN1cnJlbnQgaHRtKCkgaW52b2NhdGlvbi5cbmxldCBjdXJyZW50RXhwcmVzc2lvbnM7XG5cbi8qKlxuICogQHBhcmFtIHtCYWJlbH0gYmFiZWxcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMucHJhZ21hPWhdICBKU1gvaHlwZXJzY3JpcHQgcHJhZ21hLlxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRhZz1odG1sXSAgVGhlIHRhZ2dlZCB0ZW1wbGF0ZSBcInRhZ1wiIGZ1bmN0aW9uIG5hbWUgdG8gcHJvY2Vzcy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubW9ub21vcnBoaWM9ZmFsc2VdICBPdXRwdXQgbW9ub21vcnBoaWMgaW5saW5lIG9iamVjdHMgaW5zdGVhZCBvZiB1c2luZyBTdHJpbmcgbGl0ZXJhbHMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGh0bUJhYmVsUGx1Z2luKHsgdHlwZXM6IHQgfSwgb3B0aW9ucyA9IHt9KSB7XG5cdGNvbnN0IHByYWdtYSA9IG9wdGlvbnMucHJhZ21hPT09ZmFsc2UgPyBmYWxzZSA6IGRvdHRlZElkZW50aWZpZXIob3B0aW9ucy5wcmFnbWEgfHwgJ2gnKTtcbiAgXG5cdGNvbnN0IGlubGluZVZOb2RlcyA9IG9wdGlvbnMubW9ub21vcnBoaWMgfHwgcHJhZ21hPT09ZmFsc2U7XG5cblx0ZnVuY3Rpb24gZG90dGVkSWRlbnRpZmllcihrZXlwYXRoKSB7XG5cdFx0Y29uc3QgcGF0aCA9IGtleXBhdGguc3BsaXQoJy4nKTtcblx0XHRsZXQgb3V0O1xuXHRcdGZvciAobGV0IGk9MDsgaTxwYXRoLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBpZGVudCA9IHByb3BlcnR5TmFtZShwYXRoW2ldKTtcblx0XHRcdG91dCA9IGk9PT0wID8gaWRlbnQgOiB0Lm1lbWJlckV4cHJlc3Npb24ob3V0LCBpZGVudCk7XG5cdFx0fVxuXHRcdHJldHVybiBvdXQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXR0ZXJuU3RyaW5nVG9SZWdFeHAoc3RyKSB7XG5cdFx0Y29uc3QgcGFydHMgPSBzdHIuc3BsaXQoJy8nKS5zbGljZSgxKTtcblx0XHRjb25zdCBlbmQgPSBwYXJ0cy5wb3AoKSB8fCAnJztcblx0XHRyZXR1cm4gbmV3IFJlZ0V4cChwYXJ0cy5qb2luKCcvJyksIGVuZCk7XG5cdH1cbiAgXG5cdGZ1bmN0aW9uIHByb3BlcnR5TmFtZShrZXkpIHtcblx0XHRpZiAoa2V5Lm1hdGNoKC8oXlxcZHxbXmEtejAtOV8kXSkvaSkpIHJldHVybiB0LnN0cmluZ0xpdGVyYWwoa2V5KTtcblx0XHRyZXR1cm4gdC5pZGVudGlmaWVyKGtleSk7XG5cdH1cbiAgXG5cdGZ1bmN0aW9uIHN0cmluZ1ZhbHVlKHN0cikge1xuXHRcdGlmIChvcHRpb25zLm1vbm9tb3JwaGljKSB7XG5cdFx0XHRyZXR1cm4gdC5vYmplY3RFeHByZXNzaW9uKFtcblx0XHRcdFx0dC5vYmplY3RQcm9wZXJ0eShwcm9wZXJ0eU5hbWUoJ3R5cGUnKSwgdC5udW1lcmljTGl0ZXJhbCgzKSksXG5cdFx0XHRcdHQub2JqZWN0UHJvcGVydHkocHJvcGVydHlOYW1lKCd0YWcnKSwgdC5udWxsTGl0ZXJhbCgpKSxcblx0XHRcdFx0dC5vYmplY3RQcm9wZXJ0eShwcm9wZXJ0eU5hbWUoJ3Byb3BzJyksIHQubnVsbExpdGVyYWwoKSksXG5cdFx0XHRcdHQub2JqZWN0UHJvcGVydHkocHJvcGVydHlOYW1lKCdjaGlsZHJlbicpLCB0Lm51bGxMaXRlcmFsKCkpLFxuXHRcdFx0XHR0Lm9iamVjdFByb3BlcnR5KHByb3BlcnR5TmFtZSgndGV4dCcpLCB0LnN0cmluZ0xpdGVyYWwoc3RyKSlcblx0XHRcdF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdC5zdHJpbmdMaXRlcmFsKHN0cik7XG5cdH1cbiAgXG5cdGZ1bmN0aW9uIGNyZWF0ZVZOb2RlKHRhZywgcHJvcHMsIGNoaWxkcmVuKSB7XG5cdFx0aWYgKGlubGluZVZOb2Rlcykge1xuXHRcdFx0cmV0dXJuIHQub2JqZWN0RXhwcmVzc2lvbihbXG5cdFx0XHRcdG9wdGlvbnMubW9ub21vcnBoaWMgJiYgdC5vYmplY3RQcm9wZXJ0eShwcm9wZXJ0eU5hbWUoJ3R5cGUnKSwgdC5udW1lcmljTGl0ZXJhbCgxKSksXG5cdFx0XHRcdHQub2JqZWN0UHJvcGVydHkocHJvcGVydHlOYW1lKCd0YWcnKSwgdGFnKSxcblx0XHRcdFx0dC5vYmplY3RQcm9wZXJ0eShwcm9wZXJ0eU5hbWUoJ3Byb3BzJyksIHByb3BzKSxcblx0XHRcdFx0dC5vYmplY3RQcm9wZXJ0eShwcm9wZXJ0eU5hbWUoJ2NoaWxkcmVuJyksIGNoaWxkcmVuKSxcblx0XHRcdFx0b3B0aW9ucy5tb25vbW9ycGhpYyAmJiB0Lm9iamVjdFByb3BlcnR5KHByb3BlcnR5TmFtZSgndGV4dCcpLCB0Lm51bGxMaXRlcmFsKCkpXG5cdFx0XHRdLmZpbHRlcihCb29sZWFuKSk7XG5cdFx0fVxuICAgIFxuXHRcdHJldHVybiB0LmNhbGxFeHByZXNzaW9uKHByYWdtYSwgW3RhZywgcHJvcHMsIGNoaWxkcmVuXSk7XG5cdH1cblxuXHRsZXQgaXNWTm9kZSA9IHQuaXNDYWxsRXhwcmVzc2lvbjtcblx0aWYgKGlubGluZVZOb2Rlcykge1xuXHRcdGlzVk5vZGUgPSBub2RlID0+IHtcblx0XHRcdGlmICghdC5pc09iamVjdEV4cHJlc3Npb24obm9kZSkpIHJldHVybiBmYWxzZTtcblx0XHRcdHJldHVybiBub2RlLnByb3BlcnRpZXNbMF0udmFsdWUudmFsdWUhPT0zO1xuXHRcdH07XG5cdH1cblxuXHRmdW5jdGlvbiBjaGlsZE1hcHBlcihjaGlsZCwgaW5kZXgsIGNoaWxkcmVuKSB7XG5cdFx0Ly8gSlNYLXN0eWxlIHdoaXRlc3BhY2U6IChAVE9ETzogcmVtb3ZlPyBkb2Vzbid0IG1hdGNoIHRoZSBicm93c2VyIHZlcnNpb24pXG5cdFx0aWYgKHR5cGVvZiBjaGlsZD09PSdzdHJpbmcnICYmIGNoaWxkLnRyaW0oKS5sZW5ndGg9PT0wIHx8IGNoaWxkPT1udWxsKSB7XG5cdFx0XHRpZiAoaW5kZXg9PT0wIHx8IGluZGV4PT09Y2hpbGRyZW4ubGVuZ3RoLTEpIHJldHVybiBudWxsO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIGNoaWxkPT09J3N0cmluZycgJiYgaXNWTm9kZShjaGlsZHJlbltpbmRleC0xXSkgJiYgaXNWTm9kZShjaGlsZHJlbltpbmRleCsxXSkpIHtcblx0XHRcdGNoaWxkID0gY2hpbGQudHJpbSgpO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIGNoaWxkPT09J3N0cmluZycpIHtcblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBjaGlsZC5tYXRjaCgvXFwkXFwkXFwkX2hfXFxbKFxcZCspXFxdLyk7XG5cdFx0XHRpZiAobWF0Y2hlcykgcmV0dXJuIGN1cnJlbnRFeHByZXNzaW9uc1ttYXRjaGVzWzFdXTtcblx0XHRcdHJldHVybiBzdHJpbmdWYWx1ZShjaGlsZCk7XG5cdFx0fVxuXHRcdHJldHVybiBjaGlsZDtcblx0fVxuXG5cdGZ1bmN0aW9uIGgodGFnLCBwcm9wcykge1xuXHRcdGlmICh0eXBlb2YgdGFnPT09J3N0cmluZycpIHtcblx0XHRcdGNvbnN0IG1hdGNoZXMgPSB0YWcubWF0Y2goL1xcJFxcJFxcJF9oX1xcWyhcXGQrKVxcXS8pO1xuXHRcdFx0aWYgKG1hdGNoZXMpIHRhZyA9IGN1cnJlbnRFeHByZXNzaW9uc1ttYXRjaGVzWzFdXTtcblx0XHRcdGVsc2UgdGFnID0gdC5zdHJpbmdMaXRlcmFsKHRhZyk7XG5cdFx0fVxuXG5cdFx0Ly9jb25zdCBwcm9wc05vZGUgPSBwcm9wcz09bnVsbCB8fCBPYmplY3Qua2V5cyhwcm9wcykubGVuZ3RoPT09MCA/IHQubnVsbExpdGVyYWwoKSA6IHQub2JqZWN0RXhwcmVzc2lvbihcblx0XHRjb25zdCBwcm9wc05vZGUgPSB0Lm9iamVjdEV4cHJlc3Npb24oXG5cdFx0XHRPYmplY3Qua2V5cyhwcm9wcykubWFwKGtleSA9PiB7XG5cdFx0XHRcdGxldCB2YWx1ZSA9IHByb3BzW2tleV07XG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWU9PT0nc3RyaW5nJykge1xuXHRcdFx0XHRcdGNvbnN0IHRva2VuaXplciA9IC9cXCRcXCRcXCRfaF9cXFsoXFxkKylcXF0vZztcblx0XHRcdFx0XHRsZXQgdG9rZW4sIGxocywgcm9vdCwgaW5kZXg9MCwgbGFzdEluZGV4PTA7XG5cdFx0XHRcdFx0Y29uc3QgYXBwZW5kID0gZXhwciA9PiB7XG5cdFx0XHRcdFx0XHRpZiAobGhzKSBleHByID0gdC5iaW5hcnlFeHByZXNzaW9uKCcrJywgbGhzLCBleHByKTtcblx0XHRcdFx0XHRcdHJvb3QgPSBsaHMgPSBleHByO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0d2hpbGUgKCh0b2tlbiA9IHRva2VuaXplci5leGVjKHZhbHVlKSkpIHtcblx0XHRcdFx0XHRcdGFwcGVuZCh0LnN0cmluZ0xpdGVyYWwodmFsdWUuc3Vic3RyaW5nKGluZGV4LCB0b2tlbi5pbmRleCkpKTtcblx0XHRcdFx0XHRcdGFwcGVuZChjdXJyZW50RXhwcmVzc2lvbnNbdG9rZW5bMV1dKTtcblx0XHRcdFx0XHRcdGluZGV4ID0gdG9rZW4uaW5kZXg7XG5cdFx0XHRcdFx0XHRsYXN0SW5kZXggPSB0b2tlbml6ZXIubGFzdEluZGV4O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAobGFzdEluZGV4IDwgdmFsdWUubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRhcHBlbmQodC5zdHJpbmdMaXRlcmFsKHZhbHVlLnN1YnN0cmluZyhsYXN0SW5kZXgpKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhbHVlID0gcm9vdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgdmFsdWU9PT0nYm9vbGVhbicpIHtcblx0XHRcdFx0XHR2YWx1ZSA9IHQuYm9vbGVhbkxpdGVyYWwodmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0Lm9iamVjdFByb3BlcnR5KHByb3BlcnR5TmFtZShrZXkpLCB2YWx1ZSk7XG5cdFx0XHR9KVxuXHRcdCk7XG5cblx0XHQvLyByZWN1cnNpdmUgaXRlcmF0aW9uIG9mIHBvc3NpYmx5IG5lc3RlZCBhcnJheXMgb2YgY2hpbGRyZW4uXG5cdFx0bGV0IGNoaWxkcmVuID0gW107XG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGg+Mikge1xuXHRcdFx0Y29uc3Qgc3RhY2sgPSBbXTtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItcmVzdC1wYXJhbXNcblx0XHRcdGZvciAobGV0IGk9YXJndW1lbnRzLmxlbmd0aDsgaS0tPjI7ICkgc3RhY2sucHVzaChhcmd1bWVudHNbaV0pO1xuXHRcdFx0d2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuXHRcdFx0XHRjb25zdCBjaGlsZCA9IHN0YWNrLnBvcCgpO1xuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjaGlsZCkpIHtcblx0XHRcdFx0XHRmb3IgKGxldCBpPWNoaWxkLmxlbmd0aDsgaS0tOyApIHN0YWNrLnB1c2goY2hpbGRbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGNoaWxkIT1udWxsKSB7XG5cdFx0XHRcdFx0Y2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNoaWxkcmVuID0gY2hpbGRyZW4ubWFwKGNoaWxkTWFwcGVyKS5maWx0ZXIoQm9vbGVhbik7XG5cdFx0fVxuXHRcdGNoaWxkcmVuID0gdC5hcnJheUV4cHJlc3Npb24oY2hpbGRyZW4pO1xuXG5cdFx0cmV0dXJuIGNyZWF0ZVZOb2RlKHRhZywgcHJvcHNOb2RlLCBjaGlsZHJlbik7XG5cdH1cbiAgXG5cdGNvbnN0IGh0bWwgPSBodG0uYmluZChoKTtcblxuXHQvLyBUaGUgdGFnZ2VkIHRlbXBsYXRlIHRhZyBmdW5jdGlvbiBuYW1lIHdlJ3JlIGxvb2tpbmcgZm9yLlxuXHQvLyBUaGlzIGlzIHN0YXRpYyBiZWNhdXNlIGl0J3MgZ2VuZXJhbGx5IGFzc2lnbmVkIHZpYSBodG0uYmluZChoKSxcblx0Ly8gd2hpY2ggY291bGQgYmUgaW1wb3J0ZWQgZnJvbSBlbHNld2hlcmUsIG1ha2luZyB0cmFja2luZyBpbXBvc3NpYmxlLlxuXHRjb25zdCBodG1sTmFtZSA9IG9wdGlvbnMudGFnIHx8ICdodG1sJztcblx0cmV0dXJuIHtcblx0XHRuYW1lOiAnaHRtJyxcblx0XHR2aXNpdG9yOiB7XG5cdFx0XHRUYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb24ocGF0aCkge1xuXHRcdFx0XHRjb25zdCB0YWcgPSBwYXRoLm5vZGUudGFnLm5hbWU7XG5cdFx0XHRcdGlmIChodG1sTmFtZVswXT09PScvJyA/IHBhdHRlcm5TdHJpbmdUb1JlZ0V4cChodG1sTmFtZSkudGVzdCh0YWcpIDogdGFnID09PSBodG1sTmFtZSkge1xuXHRcdFx0XHRcdGNvbnN0IHN0YXRpY3MgPSBwYXRoLm5vZGUucXVhc2kucXVhc2lzLm1hcChlID0+IGUudmFsdWUucmF3KTtcblx0XHRcdFx0XHRjb25zdCBleHByID0gcGF0aC5ub2RlLnF1YXNpLmV4cHJlc3Npb25zO1xuXHRcdFx0XHRcdGN1cnJlbnRFeHByZXNzaW9ucyA9IGV4cHI7XG5cdFx0XHRcdFx0cGF0aC5yZXBsYWNlV2l0aChodG1sKHN0YXRpY3MsIC4uLmV4cHIubWFwKChwLCBpKSA9PiBgJCQkX2hfWyR7aX1dYCkpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn0iXX0=

export default htmBabelPlugin;
