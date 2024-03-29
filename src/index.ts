/*! puppeteer-devtools
 * Copyright (c) 2019-2021 Deque Systems, Inc.
 *
 * Your use of this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This entire copyright notice must appear in every copy of this file you
 * distribute or in any file that contains substantial portions of this source
 * code.
 */
import { Page, WebWorker, Frame, Target, errors } from 'puppeteer'
import {
  DOMWorld,
  ExecutionContext,
  ExecutionContextDescription,
  CDPSession
} from './puppeteer-adapter'

const devtoolsUrl = 'devtools://'
const extensionUrl = 'chrome-extension://'
const types = {
  page: 'page',
  serviceWorker: 'service_worker'
}

const isDevtools = (target: Target) => {
  return target.url().startsWith(devtoolsUrl)
}
const isBackground = (target: Target) => {
  const url = target.url()
  return (
    url.startsWith(extensionUrl) && (url.includes('generated_background_page') || target.type() === types.serviceWorker)
  )
}
const isPage = (target: Page | WebWorker): target is Page => {
  // When $ exists, it's most likely a page...
  return '$' in target && typeof target.$ === 'function'
}

async function getContext(
  page: Page,
  isTarget: (t: Target) => boolean,
  options?: { timeout?: number }
): Promise<Page | WebWorker> {
  const browser = page.browser()
  const { timeout } = options || {}

  const target = await browser.waitForTarget(isTarget, { timeout })
  const type = target.type()
  const url = target.url()

  if (type === types.serviceWorker) {
    const worker = await target.worker()
    if (!worker) {
      /* istanbul ignore next */
      throw new Error(`Could not convert "${url}" target to a worker.`)
    }

    return worker
  } else {
    let contextPage: Page | null

    /* istanbul ignore next */
    if ('asPage' in target && typeof target.asPage === 'function') {
      contextPage = await target.asPage()
    } else {
      // Hack to get puppeteer to allow us to access the page context
      ;(target as any)._targetInfo.type = types.page
      contextPage = await target.page()
    }

    if (!contextPage) {
      /* istanbul ignore next */
      throw new Error(`Could not convert "${url}" target to a page.`)
    }

    await contextPage.waitForFunction(
      /* istanbul ignore next */
      () => document.readyState === 'complete',
      { timeout }
    )

    return contextPage
  }
}

async function getDevtools(
  page: Page,
  options?: { timeout?: number }
): Promise<Page> {
  const context = await getContext(page, isDevtools, options)

  if (!isPage(context)) {
    /* istanbul ignore next */
    throw new Error(`Devtools target "${page.url()}" is not of type page.`)
  }

  return context
}

async function getBackground(
  page: Page,
  options?: { timeout?: number }
): Promise<Page | WebWorker> {
  return getContext(page, isBackground, options)
}

// Chrome has different methodologies for view management depending on the version,
// we need to determine the right strategy for what's available in the current chrome executable
// reference links: 
// - https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/ui/legacy/ViewManager.ts
// - https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/devtools_compatibility.js
const devtoolsViewManagementStrategies = [
  { strategy: 'ui-viewmanager', func: `!!('UI' in window && 'viewManager' in UI && typeof UI.viewManager.showPanel === 'function')` },
  { strategy: 'inspectorfrontendapi', func: `!!('InspectorFrontendAPI' in window && 'showPanel' in InspectorFrontendAPI && typeof InspectorFrontendAPI.showPanel === 'function')`}
] as const
type DevtoolsViewManagementStrategies = typeof devtoolsViewManagementStrategies[number]['strategy']

async function getDevtoolsPanel(
  page: Page,
  options?: { panelName?: string; timeout?: number }
): Promise<Frame> {
  const browser = page.browser()
  const { panelName = 'panel.html', timeout = 30000 } = options || {}

  const devtools = await getDevtools(page)

  let extensionPanelTarget: Target

  try {
    // Wait for one of the view management strategies to be available
    let strategy: DevtoolsViewManagementStrategies | void = undefined
    try {
      strategy = await Promise.race<DevtoolsViewManagementStrategies | void>([
        ...devtoolsViewManagementStrategies.map(async ({ strategy, func }) => {
          await devtools.waitForFunction(func, { timeout })
          return strategy
        })
      ])
    } catch (err) {
      /* istanbul ignore next */
      if (!(err instanceof errors.TimeoutError)) {
        throw err
      }
    }

    if (!strategy) {
      throw new Error(`[${await page.browser().version()}] Unable to find view manager for browser executable.`)
    }

    // Check that there is an available chrome-extension panel target
    // source: https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/ui/legacy/ViewManager.ts
    await devtools.waitForFunction(`!!('UI' in window && 'panels' in UI)`, { timeout })
    await devtools.waitForFunction(
      `
      !!Object.keys(UI.panels)
        .find(key => key.startsWith('${extensionUrl}'))
    `,
      { timeout }
    )
    const extensionPanelView = await devtools.evaluate(
      `
      Object.keys(UI.panels)
        .find(key => key.startsWith('${extensionUrl}'))
    `,
      { timeout }
    )

    /* istanbul ignore next */
    switch(strategy) {
      case 'ui-viewmanager':
        await devtools.evaluate(`UI.viewManager.showView('${extensionPanelView}')`)
      break;
      case 'inspectorfrontendapi':
        await devtools.evaluate(`InspectorFrontendAPI.showPanel('${extensionPanelView}')`)
      break;
      /* istanbul ignore next */
      default: {
        const unknownStrategy: never = strategy;
        throw new Error(`Unknown strategy: ${unknownStrategy}`);
      }
    }

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

  let panel: Page | null
  /* istanbul ignore next */
  if ('asPage' in extensionPanelTarget && typeof extensionPanelTarget.asPage === 'function') {
    panel = await extensionPanelTarget.asPage()
  } else {
    // Hack to get puppeteer to allow us to access the page context
    ;(extensionPanelTarget as any)._targetInfo.type = types.page
    panel = await extensionPanelTarget.page()
  }

  if (!panel) {
    /* istanbul ignore next */
    throw new Error(`Could not convert "${extensionPanelTarget.url()}" target to a page.`)
  }

  // The extension panel should be the first embedded frame of the targeted page
  const [panelFrame] = await panel.frames()

  return panelFrame
}

const executionContexts = new Map<Page, ExecutionContextDescription>()
async function setCaptureExecutionContexts(
  page: Page,
  predicate: (context: ExecutionContextDescription) => boolean
) {
  const client = await page.target().createCDPSession()
  const onExecutionContextCreated = async ({
    context
  }: {
    context: ExecutionContextDescription
  }) => {
    if (predicate(context)) {
      executionContexts.set(page, context)
    }
  }
  await client.send('Runtime.enable')
  client.on('Runtime.executionContextCreated', onExecutionContextCreated)
}

async function setCaptureContentScriptExecutionContexts(page: Page) {
  await setCaptureExecutionContexts(
    page,
    context =>
      context.origin.startsWith(extensionUrl) &&
      (page.mainFrame() as any)._id === context.auxData.frameId
  )
}

async function getContentScriptExcecutionContext(
  page: Page
): Promise<ExecutionContext> {
  const executionContext = executionContexts.get(page)

  if (!executionContext) {
    throw new Error(
      `Could not find "${extensionUrl}" content script execution context`
    )
  }

  const client = await page.target().createCDPSession()
  return new ExecutionContext(
    client as unknown as CDPSession,
    executionContext,
    // DOMWorld is used to return the associated frame. Extension execution
    // contexts don't have an associated frame, so this can be safely ignored
    // see: https://github.com/puppeteer/puppeteer/blob/9dd1aa302d719bef29e67c33f1f4717f1c0e2b79/src/common/ExecutionContext.ts#L73-L84
    null as unknown as DOMWorld
  )
}

export {
  getDevtools,
  getDevtoolsPanel,
  getBackground,
  setCaptureContentScriptExecutionContexts,
  getContentScriptExcecutionContext
}
