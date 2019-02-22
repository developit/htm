# babel-plugin-transform-jsx-to-htm

This plugin converts JSX into Tagged Templates that work with [htm].

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
| `tag`  | String  | `"html"` | The "tag" function to prefix [Tagged Templates] with.
| `import`  | `false`\|String\|Object  | `false` | Auto-import a tag function, off by default.<br>_See [Auto-importing a tag function](#auto-importing-the-tag) for an example._

Options are passed to a Babel plugin using a nested Array:

```js
"plugins": [
  ["babel-plugin-transform-jsx-to-htm", {
    "tag": "$$html"
  }]
]
```

## Auto-importing the tag

Want to automatically import `html` into any file that uses JSX?
Just use the `import` option:

```js
"plugins": [
  ["babel-plugin-transform-jsx-to-htm", {
    "tag": "$$html",
    "import": {
      // the module to import:
      "module": "htm/preact",
      // a named export to use from that module:
      "export": "html"
    }
  }]
]
```

The above will produce files that look like:

```js
import { html as $$html } from 'htm/preact';

export default $$html`<h1>hello</h1>`
```

### License

Apache 2

[htm]: https://github.com/developit/htm
