import testFn, { TestInterface } from 'ava'
import puppeteer from 'puppeteer'
import path from 'path'
import { getDevtools, getDevtoolsPanel } from '../src'

const test = testFn as TestInterface<{
  browser: puppeteer.Browser
  page: puppeteer.Page
}>

test.beforeEach(async t => {
  const pathToExtension = path.resolve(__dirname, 'extension')

  const browser = await puppeteer.launch({
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ],
    defaultViewport: null,
    devtools: true,
    headless: false
  })

  const [page] = await browser.pages()

  t.context = {
    browser,
    page
  }
})

test.afterEach(async t => {
  let { browser } = t.context
  if (browser) {
    await browser.close()
  }
})

test('should return devtools page', async t => {
  const { page } = t.context
  const devtools = await getDevtools(page)
  t.regex(await devtools.url(), /^devtools:\/\//)
})

test('should return devtools panel', async t => {
  const { page } = t.context
  const devtools = await getDevtoolsPanel(page)
  const body = await devtools.$('body')
  const textContent = await devtools.evaluate(el => el.textContent, body)
  t.is(textContent.trim(), 'devtools panel')
})

test('should throw error when unable to find devtools panel', async t => {
  const { page } = t.context
  await t.throwsAsync(async () =>
    getDevtoolsPanel(page, { panelName: 'foo.html', timeout: 500 })
  )
})
