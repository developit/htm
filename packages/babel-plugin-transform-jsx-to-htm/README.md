# babel-plugin-transform-jsx-to-htm

This plugin converts JSX into Tagged Templates that work with things like [htm] and [lit-html].

```js
// INPUT:
const Foo = () => <h1>Hello</h1>

// OUTPUT:
const Foo = () => html`<h1>Hello</h1>`
```

## Installation

Grab it from npm:

```sh
npm i -D babel-plugin-transform-jsx-to-htm
```

... then add it to your Babel config (eg: `.babelrc`):

```js
"plugins": [
  "babel-plugin-transform-jsx-to-htm"
]
```

## Options

The following options are available:

| Option | Type    | Default  | Description
|--------|---------|----------|------------
| `tag`  | String  | `"html"` | The "tag" function to prefix [Tagged Templates] with.<br> _Useful when [Auto-importing a tag function](#auto-importing-the-tag)._
| `html` | Boolean | `false`  | `true` outputs HTML-like templates for use with [lit-html].<br> _The is default XML-like, with self-closing tags._

Options are passed to a Babel plugin using a nested Array:

```js
"plugins": [
  ["babel-plugin-transform-jsx-to-htm", {
    "tag": "$$html",
    "html": true
  }]
]
```

## Auto-importing the tag

Want to automatically import `html` into any file that uses JSX?  It works the same as with JSX!
Just use [babel-plugin-jsx-pragmatic]:

```js
"plugins": [
  ["babel-plugin-jsx-pragmatic", {
    // the module to import:
    "module": "lit-html",
    // a named export to use from that module:
    "export": "html",
    // what to call it locally: (should match your "tag" option)
    "import": "$$html"
  }],
  ["babel-plugin-transform-jsx-to-htm", {
    "tag": "$$html"
  }]
]
```

The above will produce files that look like:

```js
import { html as $$html } from 'lit-html';

export default $$html`<h1>hello</h1>`
```

### License

Apache 2

[htm]: https://github.com/developit/htm
[lit-html]: https://github.com/polymer/lit-html
[babel-plugin-jsx-pragmatic]: https://github.com/jmm/babel-plugin-jsx-pragmatic
