# babel-plugin-transform-jsx-to-tagged-templates

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
npm i -D babel-plugin-transform-jsx-to-tagged-templates
```

... then add it to your Babel config (eg: `.babelrc`):

```js
"plugins": [
  "babel-plugin-transform-jsx-to-tagged-templates"
  ]
]
```

## Options

There's only one option: `tag`. It lets you specify the function to use for prefixing templates. The default is "html":

```js
"plugins": [
    [
      "babel-plugin-transform-jsx-to-tagged-templates",
      {
        "tag": "custom.html"
      }
    ]
  ]
]
```

[htm]: https://github.com/developit/htm
[lit-html]: https://github.com/polymer/lit-html
