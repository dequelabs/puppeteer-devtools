import assert from 'assert'
import puppeteer from 'puppeteer'

describe('integration', () => {

  it('puppeteer target should have internal _targetInfo property', async () => {
    const browser = await puppeteer.launch()
    const [page] = await browser.pages()
    await page.goto('about:blank')

    const target = await browser.waitForTarget(
      target => target.url() === 'about:blank'
    )
    const anyTarget = target as any

    // Target._targetType.type is an internal property used to force puppeteer to allow us
    // to use Target.page() for targets that do not normally return pages such as those
    // used by extension contexts.
    //
    // Having a page context allows us to use puppeteer method that would not normally be available.
    //
    // see: https://github.com/puppeteer/puppeteer/issues/4247
    // see: https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#targettype
    assert(typeof anyTarget._targetInfo === 'object')
    assert('type' in anyTarget._targetInfo)
    await browser.close()
  })

  it('puppeteer should have internal ExecutionContext module', () => {
    assert.doesNotThrow(() => {
      require('puppeteer/lib/cjs/puppeteer/common/ExecutionContext.js')
    })
  })

})