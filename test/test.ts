import testFn, { TestInterface } from 'ava'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import {
  setCaptureContentScriptExecutionContexts,
  getContentScriptExcecutionContext,
  getDevtools,
  getDevtoolsPanel
} from '../src'

const test = testFn as TestInterface<{
  browser: puppeteer.Browser
  page: puppeteer.Page
}>

test.beforeEach(async t => {
  try {
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

    // Respond to http://testpage urls with a set fixture page
    await page.setRequestInterception(true)
    page.on('request', async request => {
      if (request.url().startsWith('http://testpage')) {
        const body = fs.readFileSync(
          path.resolve(__dirname, 'fixtures/index.html')
        )
        return request.respond({
          body,
          contentType: 'text/html',
          status: 200
        })
      }
      return request.continue()
    })

    t.context = {
      browser,
      page
    }
  } catch (ex) {
    console.log(`Did not launch browser: ${ex.message}`)
  }
})

test.afterEach.always(async t => {
  const { browser } = t.context
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

test('should return extension content script execution context', async t => {
  const { page } = t.context
  await setCaptureContentScriptExecutionContexts(page)
  await page.goto('http://testpage.test', { waitUntil: 'networkidle2' })
  const contentExecutionContext = await getContentScriptExcecutionContext(page)
  const mainFrameContext = await page.evaluate(
    () => (window as any).extension_content_script
  )
  const contentContext = await contentExecutionContext.evaluate(
    () => (window as any).extension_content_script
  )
  t.is(typeof mainFrameContext, 'undefined')
  t.truthy(contentContext)
})

test('should throw error when unable to find content script execution context', async t => {
  const { page } = t.context
  await page.goto('http://testpage.test', { waitUntil: 'networkidle2' })
  await t.throwsAsync(async () => await getContentScriptExcecutionContext(page))
})

test('should throw error when unable to find content script execution context on page without permissions', async t => {
  const { page } = t.context
  await setCaptureContentScriptExecutionContexts(page)
  await page.goto('http://testpage.test/that/does/not/have/permission', {
    waitUntil: 'networkidle2'
  })
  await t.throwsAsync(async () => await getContentScriptExcecutionContext(page))
})

test('should throw error when unable to find devtools panel', async t => {
  const { page } = t.context
  await t.throwsAsync(async () =>
    getDevtoolsPanel(page, { panelName: 'foo.html', timeout: 500 })
  )
})
