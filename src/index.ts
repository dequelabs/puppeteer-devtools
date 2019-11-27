import { Page, Frame, Target, errors } from 'puppeteer'

const devtoolsUrl = 'devtools://'
const extensionUrl = 'chrome-extension://'

async function getDevtools(
  page: Page,
  options?: { timeout?: number }
): Promise<Page> {
  const browser = page.browser()
  const { timeout } = options || {}

  const devtoolsTarget = await browser.waitForTarget(
      target => {
        return target.url().startsWith(devtoolsUrl)
      },
      { timeout }
    )

    // Hack to get puppeteer to allow us to access the page context
  ;(devtoolsTarget as any)._targetInfo.type = 'page'

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

  let extensionPanelTarget: Target

  try {
    // Wait for UI.viewManager to become available
    await devtools.waitForFunction(
      /* istanbul ignore next */
      () => 'UI' in window,
      { timeout }
    )

    // Check that the UI.viewManager has a chrome-extension target available
    // source: https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/ui/ViewManager.js
    await devtools.waitForFunction(
      `
      !!Array.from(UI.viewManager._views.keys())
        .find(key => key.startsWith('${extensionUrl}'))
    `,
      { timeout }
    )

    // Once available, swap to the bundled chrome-extension devtools view
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
  ;(extensionPanelTarget as any)._targetInfo.type = 'page'

  // Get the targeted target's page and frame
  const panel = await extensionPanelTarget.page()

  // The extension panel should be the first embedded frame of the targeted page
  const [panelFrame] = await panel.frames()

  return panelFrame
}

export { getDevtools, getDevtoolsPanel }
