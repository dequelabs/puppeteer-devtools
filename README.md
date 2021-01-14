# puppeteer-devtools

[![CircleCI](https://circleci.com/gh/dequelabs/puppeteer-devtools.svg?style=shield)](https://circleci.com/gh/dequelabs/puppeteer-devtools)
[![Version](https://img.shields.io/npm/v/puppeteer-devtools.svg)](https://www.npmjs.com/package/puppeteer-devtools)

Extended puppeteer methods for getting extension devtools contexts.

> This package relies on using internal puppeteer methods to return the Chrome devtools panel, along with extension panels. Since it is dependent on undocumented puppeteer apis, it could break in future versions of Chrome/puppeteer so use at your own risk.

## Install

`npm install --save-dev puppeteer-devtools`

## Usage

```js
const puppeteer = require('puppeteer')
const {
  getDevtoolsPanel,
  setCaptureContentScriptExecutionContexts,
  getContentScriptExcecutionContext
} = require('puppeteer-devtools')
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
await setCaptureContentScriptExecutionContexts(page, true)

await page.goto('https://google.com', { waitUntil: 'networkidle0' })
const panel = await getDevtoolsPanel(page, { panelName: 'panel.html' })
const contentScriptExecutionContext = await getContentScriptExecutionContext(
  page
)
```

Note: `devtools` must be enabled, and `headless` mode must be turned off. Chrome [does not currently support extensions in headless mode](https://bugs.chromium.org/p/chromium/issues/detail?id=706008).

## Methods

### async getDevtools( page, options? )

Returns the underlying Chrome `devtools://` page as a <code>Promise<[Page](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page)></code>.

- **`page`** - <[`Page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page)> Puppeteer page object.
- **`options`** - <`object`>
  - **`timeout`** - <`number | null`> Maximum time in milliseconds to wait for the devtools page to become available. Uses puppeteer's default timeout if not set.

### async getDevtoolsPanel( page, options? )

Returns the underlying Chrome `chrome-extension://` panel as a <code>Promise<[Frame](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-frame)></code>.

- **`page`** - <[`Page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page)> Puppeteer page object.
- **`options`** - <`object`>
  - **`panelName`** - <`string`> The file name of the extension panel to find. A devtools page with `chrome.devtools.panels.create('name', 'icon.png', 'panel.html', (panel) => { ... })` would have `panel.html` as its value.
  - **`timeout`** - <`number | null`> Maximum time in milliseconds to wait for the chrome extension panel to become available. Uses puppeteer's default timeout if not set.

### async setCaptureContentScriptExecutionContexts( page, enable )

Activating capture content script execution contexts will allow for the usage of an extension's content script [`ExecutionContext`](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-executioncontext). This must be activated before a page is navigated.

- **`page`** - <[`Page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page)> Puppeteer page object.
- **`enable`** - <`boolean`> Enable or disable content script execution context capturing

### async getContentScriptExcecutionContext( page )

If `setCaptureContentScriptExecutionContexts` has been enabled for a page, this returns the extension's content script [`ExecutionContext`](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-executioncontext). This will error for pages that the extension does not have permissions for or for extensions that do not have content scripts.

- **`page`** - <[`Page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page)> Puppeteer page object.

## License

[MPL 2.0](LICENSE)

## Copyright

Copyright (c) 2019-2021 Deque Systems, Inc.
