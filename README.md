<p align="center">
  <img src="https://i.imgur.com/09ih11e.jpg" width="715" alt="hyperscript tagged markup demo">
  <h1 align="center">
  	HTM (Hyperscript Tagged Markup)
	  <a href="https://www.npmjs.org/package/htm"><img src="https://img.shields.io/npm/v/htm.svg?style=flat" alt="npm"></a>
  </h1>
</p>

`htm` is an implementation of JSX-like syntax in plain JavaScript, using [Tagged Templates].
It lets your build apps using Preact/React/etc directly in the browser.
JSX can be converted to `htm` with only a few tiny modifications.
Templates are parsed by the browser's HTML parser and cached, achieving minimal overhead.

`htm` is just _650 bytes_ standalone, or **only 500 bytes** when used with Preact! _(through the magic of gzip 🌈)_

## Syntax: Like JSX but more lit

The syntax is inspired by [lit-html], but includes features familiar to anyone who works with JSX:

- Rest spread: `<div ...${props}>`
- Self-closing tags: `<div />
- Components: `<${Foo}>` _(where `Foo` is a component reference)_
- Boolean attributes: `<div draggable />`

## Syntax: better than JSX?

`htm` actually takes the JSX-style syntax a couple steps further!
Here's some ergonomic features you get for free that aren't present in JSX:

- HTML's optional quotes: `<div class=foo>`
- HTML's self-closing tags: `<img src=${url}>`
- Optional end-tags: `<section><h1>this is the whole template!`
- Component end-tags: `<${Footer}>footer content<//>`
- 
- Support for HTML comments: `<div><!-- don't delete this! --></div>`

## Project Status

The original goal for `htm` was to create a wrapper around Preact that felt natural for use untranspiled in the browser. I wanted to use Virtual DOM, but I wanted to eschew build tooling and use ES Modules directly.

This meant giving up JSX, and the closest alternative was [Tagged Templates]. So, I wrote this library to patch up the differences between the two as much as possible. As it turns out, the technique is framework-agnostic, so it should work great with most Virtual DOM libraries.

## Installation

`htm` is published to npm, and accessible via the unpkg.com CDN:

**For npm:**

```js
npm i htm
```

**To hotlink:**

```js
import htm from 'https://unpkg.com/htm?module'
import { html, render } from 'https://unpkg.com/htm/preact?module'
```

## Usage

Since `htm` is a generic library, we need to tell it what to "compile" our templates to.

The target should be a function of the form `h(tag, props, ...children)`, and can return anything.

```js
// this is our hyperscript function. for now, it just returns an description object.
function h(tag, props, ...children) {
  return { tag, props, children };
}
```

To use that `h()` function, we need to create our own `html` tag function by binding `htm` to our `h()` function:

```js
import htm from 'htm';

const html = htm.bind(h);
```

Now we have an `html()` template tag that can be used to produce objects in the format we created above.

Here's the whole thing for clarity:

```js
import htm from 'htm';

function h(tag, props, ...children) {
  return { tag, props, children };
}

const html = htm.bind(h);

console.log( html`<h1 id=hello>Hello world!</h1>` );
// {
//   tag: 'h1',
//   props: { id: 'hello' },
//   children: ['Hello world!']
// }
```

## Example

Curious to see what it all looks like? Here's a working app!

It's a single HTML file, and there's no build or tooling. You can edit it with nano.

```html
<!DOCTYPE html>
<html lang="en">
  <title>htm Demo</title>
  <script type="module">
    import { html, Component, render } from 'https://unpkg.com/htm/preact?module';

    class App extends Component {
      addTodo() {
        const { todos } = this.state;
        this.setState({ todos: todos.concat(`Item ${todos.length}`) });
      }
      render({ page }, { todos = [] }) {
        return html`
          <div class="app">
            <${Header} name="MyApp: ${page}" />
            <ul>
              ${todos.map(todo => html`
                <li>{todo}</li>
              `)}
            </ul>
            <button onClick=${this.addTodo.bind(this)}>Add Todo</button>
            <${Footer}>footer content here<//>
          </div>
        `;
      }
    }

    render(html`<${App} page="To-Do's" />`, document.body);
  </script>
</html>
```

How nifty is that?

Notice there's only one import - here we're using the prebuilt Preact integration since it's easier to import and a little bit smaller.

The same example works fine without the prebuilt version, just using two imports:

```js
import { h, Component, render } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

render(html`<${App} page="To-Do's" />`, document.body);
```

## Other Uses

Since `htm` is designed to meet the same need as JSX, you can use it anywhere you'd use JSX.

**Generate HTML using [vhtml]:**

```js
import htm from 'htm';
import vhtml from 'vhtml';

const html = htm.bind(vhtml);

console.log( html`<h1 id=hello>Hello world!</h1>` );
// '<h1 id="hello">Hello world!</h1>'
```

**Webpack configuration via [jsxobj]:** ([details here](https://webpack.js.org/configuration/configuration-languages/#babel-and-jsx))

```js
import htm from 'htm';
import jsxobj from 'jsxobj';

const html = htm.bind(jsxobj);

console.log(html`
  <webpack watch mode=production>
    <entry path="src/index.js" />
  </webpack>
`);
// {
//   watch: true,
//   mode: 'production',
//   entry: {
//     path: 'src/index.js'
//   }
// }
```

[Tagged Templates]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates
[lit-html]: https://github.com/Polymer/lit-html
[vhtml]: https://github.com/developit/vhtml
[jsxobj]: https://github.com/developit/jsxobj
