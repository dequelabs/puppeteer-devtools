# puppeteer-devtools

Extended puppeteer methods for getting extension devtools contexts

## Install

`npm install --save-dev puppeteer-devtools`

## Usage

```js
const puppeteer = require('puppeteer')
const { getDevtoolsPanel } = require('puppeteer-devtools')
const path = require('path')

const extension = path.resolve('/path/to/extension')

const browser = await puppeteer.launch({
  args: [
    `--disable-extensions-except=${extension}`,
    `--load-extension=${extension}`
  ],
  devtools: true,
  headless: false
})

const [page] = await browser.pages()
const panel = await getDevtoolsPanel(page, { panelName: 'panel.html' })
```

## Methods

### async getDevtools( page, options? )

Returns the underlying Chrome `devtools://` page as a `Promise<Page>`.

- **`page`** - <[`Page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page)> Puppeteer page object.
- **`options`** - <`object`>
  - **`timeout`** - <`number | null`> Maximum time in milliseconds to wait for the devtools page to become available. Uses puppeteer's default timeout if not set.

### async getDevtoolsPanel( page, options? )

Returns the underlying Chrome `chrome-extension://` panel as a `Promise<Frame>`.

- **`page`** - <[`Page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page)> Puppeteer page object.
- **`options`** - <`object`>
  - **`panelName`** - <`string`> The file name of the extension panel to find. A devtools page with `chrome.devtools.panels.create('name', 'icon.png', 'panel.html', (panel) => { ... })` would have `panel.html` as its value.
  - **`timeout`** - <`number | null`> Maximum time in milliseconds to wait for the chrome extension panel to become available. Uses puppeteer's default timeout if not set.

## License

???
