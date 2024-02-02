import testFn, { TestInterface } from 'ava'
import puppeteer, { type Browser, type Page } from 'puppeteer'
import path from 'path'
import fs from 'fs'
import {
  setCaptureContentScriptExecutionContexts,
  getContentScriptExcecutionContext,
  getDevtools,
  getDevtoolsPanel,
  getBackground
} from '../src'

const test = testFn as TestInterface<{
  browser: Browser
  page: Page
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
      if (request.url() === 'http://testpage.test/frame') {
        const body = fs.readFileSync(
          path.resolve(__dirname, 'fixtures/frame.html')
        )
        return request.respond({
          body,
          contentType: 'text/html',
          status: 200
        })
      }
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
    console.log(`Did not launch browser: ${(ex as Error).message}`)
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

test('should return background page', async t => {
  const { page } = t.context
  const background = await getBackground(page)
  t.regex(await background?.url(), /_generated_background_page/)
})

test('should return devtools panel', async t => {
  const { page } = t.context
  const devtools = await getDevtoolsPanel(page)
  const body = await devtools.$('body')
  const textContent = await devtools.evaluate(el => el?.textContent, body)
  t.is(textContent?.trim(), 'devtools panel')
})

test('should throw with no matching strategies for showing devtools panel', async t => {
  const { page } = t.context
  const devtools = await getDevtools(page)
  // remove known chrome public apis to force errors
  await devtools.evaluate(`
    delete window.UI
    delete window.InspectorFrontendAPI
  `)
  const error = await t.throwsAsync(getDevtoolsPanel(page, { timeout: 100 }))
  t.regex(error.message, /Unable to find view manager for browser executable/)
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
