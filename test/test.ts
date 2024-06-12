import assert from 'assert'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import {
  setCaptureContentScriptExecutionContexts,
  getContentScriptExecutionContext,
  getDevtools,
  getDevtoolsPanel,
  getBackground
} from '../src'

beforeEach(async function () {
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

    this.context = {
      browser,
      page
    }
  } catch (ex) {
    console.log(`Did not launch browser: ${(ex as Error).message}`)
  }
})

afterEach(async function() {
  const { browser } = this.context
  if (browser) {
    await browser.close()
  }
  this.context = null
})

describe('puppeteer-devtools', () => {

  it('should return devtools page', async function() {
    const { page } = this.context
    const devtools = await getDevtools(page)
    assert.match(await devtools.url(), /^devtools:\/\//)
  })

  it('should return background page', async function() {
    const { page } = this.context
    const background = await getBackground(page)
    assert.match(await background?.url(), /_generated_background_page/)
  })

  it('should return devtools panel', async function() {
    const { page } = this.context
    const devtools = await getDevtoolsPanel(page)
    const body = await devtools.$('body')
    const textContent = await devtools.evaluate(el => el?.textContent, body)
    assert.equal(textContent?.trim(), 'devtools panel')
  })

  it('should throw with no matching strategies for showing devtools panel', async function() {
    const { page } = this.context
    const devtools = await getDevtools(page)
    // remove known chrome public apis to force errors
    await devtools.evaluate(`
      delete window.UI
      delete window.InspectorFrontendAPI
    `)
    await assert.rejects(getDevtoolsPanel(page, { timeout: 100 }), (err: Error) => {
      assert.match(err.message, /Unable to find view manager for browser executable/)
      return true
    })
  })

  it('should return extension content script execution context', async function() {
    const { page } = this.context
    await setCaptureContentScriptExecutionContexts(page)
    await page.goto('http://testpage.test', { waitUntil: 'networkidle2' })
    const contentExecutionContext = await getContentScriptExecutionContext(page)
    const mainFrameContext = await page.evaluate(
      () => (window as any).extension_content_script
    )
    const contentContext = await contentExecutionContext.evaluate(
      () => (window as any).extension_content_script
    )
    assert.equal(typeof mainFrameContext, 'undefined')
    assert(contentContext)
  })

  it('should throw error when unable to find content script execution context', async function() {
    const { page } = this.context
    await page.goto('http://testpage.test', { waitUntil: 'networkidle2' })
    assert.rejects(async () => await getContentScriptExecutionContext(page))
  })

  it('should throw error when unable to find content script execution context on page without permissions', async function() {
    const { page } = this.context
    await setCaptureContentScriptExecutionContexts(page)
    await page.goto('http://testpage.test/that/does/not/have/permission', {
      waitUntil: 'networkidle2'
    })
    assert.rejects(async () => await getContentScriptExecutionContext(page))
  })

  it('should throw error when unable to find devtools panel', async function() {
    const { page } = this.context
    assert.rejects(async () =>
      getDevtoolsPanel(page, { panelName: 'foo.html', timeout: 500 })
    )
  })

})
