# puppeteer-devtools

Extended puppeteer methods for getting extension devtools contexts

## Install

`npm install --save-dev puppeteer-extension`

## Usage

```js
const puppeteer = require('puppeteer')
const { getDevtoolsPanel } = require('puppeteer-extension')
const path = require('path')

const extension = path.resolve(__dirname, '/path/to/extension')

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

`getDevtools` - ???

`getDevtoolsPanel` - ???

## License

???
