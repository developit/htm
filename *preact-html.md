This is a crazy experiment to implement an interface for Preact that roughly matches that of `lit-html`.

The goal is to create a wrapper around Preact that feels natural for use untranspiled in the browser.

Basically, it's preact but instead of JSX, you use tagged template literals. The browser parses the HTML.

The neat part is, when bundled together with Preact this mode only adds 600 bytes.

> Note: This isn't released or published to npm yet, so don't share it.
>
> That also means to work with examples you must use this gist's URL:
>
> ```
import { html, render } from 'https://cdn.rawgit.com/developit/ce062586e3fc7247dbb9ccc4f6acc4e1/raw/bf1ef4b38f43702dddd14118f54f3677cfa62560/preact-html.mjs'
```

```html
<!DOCTYPE html>
<html lang="en">
  <body>
    <script type="module">
      import { html, Component, render } from 'preact-html';
  
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
  </body>
</html>
```