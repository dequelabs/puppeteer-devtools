import { Page, Frame, errors } from 'puppeteer'

const devtoolsUrl = 'devtools://'
const extensionUrl = 'chrome-extension://'

async function getDevtools(
  page: Page,
  options?: { timeout?: number }
): Promise<Page> {
  const browser = page.browser()
  const { timeout } = options || {}

  const devtoolsTarget: any = await browser.waitForTarget(
    target => {
      return target.url().startsWith(devtoolsUrl)
    },
    { timeout }
  )

  // Hack to get puppeteer to allow us to access the page context
  devtoolsTarget._targetInfo.type = 'page'

  const devtoolsPage = await devtoolsTarget.page()
  await devtoolsPage.waitForFunction(
    /* istanbul ignore next */
    () => document.readyState === 'complete',
    { timeout }
  )

  return devtoolsPage
}

async function getDevtoolsPanel(
  page: Page,
  options?: { panelName?: string; timeout?: number }
): Promise<Frame> {
  const browser = page.browser()
  const { panelName = 'panel.html', timeout } = options || {}

  const devtools = await getDevtools(page)

  // Wait for UI.viewManager to become available and open the devtools extension tab
  await devtools.waitForFunction(
    /* istanbul ignore next */
    () => 'UI' in window,
    { timeout }
  )

  let extensionPanelTarget: any

  try {
    await devtools.waitForFunction(
      `
      !!Array.from(UI.viewManager._views.keys())
        .find(key => key.startsWith('${extensionUrl}'))
    `,
      { timeout }
    )
    await devtools.evaluate(`
      const extensionPanelView = Array.from(UI.viewManager._views.keys())
        .find(key => key.startsWith('${extensionUrl}'))
      UI.viewManager.showView(extensionPanelView);
    `)

    extensionPanelTarget = await browser.waitForTarget(
      target => {
        return (
          target.url().startsWith(extensionUrl) &&
          target.url().endsWith(panelName)
        )
      },
      { timeout }
    )
  } catch (err) {
    if (err instanceof errors.TimeoutError) {
      throw new errors.TimeoutError(
        `Could not find "${extensionUrl}" target within timeout of ${timeout}ms`
      )
    }

    throw err
  }

  // Hack to get puppeteer to allow us to access the page context
  extensionPanelTarget._targetInfo.type = 'page'

  // Get the targeted target's page and frame
  const panel = await extensionPanelTarget.page()
  const [panelFrame] = await panel.frames()

  return panelFrame
}

export { getDevtools, getDevtoolsPanel }
