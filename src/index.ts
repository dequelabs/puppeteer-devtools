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
import { Page, Frame, Target, errors } from 'puppeteer'
import {
  DOMWorld,
  ExecutionContext,
  ExecutionContextDescription,
  CDPSession
} from './puppeteer-adapter'

const devtoolsUrl = 'devtools://'
const extensionUrl = 'chrome-extension://'

const isDevtools = (target: Target) => {
  return target.url().startsWith(devtoolsUrl)
}
const isBackground = (target: Target) => {
  const url = target.url()
  return (
    url.startsWith(extensionUrl) && url.includes('generated_background_page')
  )
}

async function getContext(
  page: Page,
  isTarget: (t: Target) => boolean,
  options?: { timeout?: number }
): Promise<Page> {
  const browser = page.browser()
  const { timeout } = options || {}

  const target = await browser.waitForTarget(isTarget, { timeout })

    // Hack to get puppeteer to allow us to access the page context
  ;(target as any)._targetInfo.type = 'page'

  const contextPage = await target.page()
  await contextPage!.waitForFunction(
    /* istanbul ignore next */
    () => document.readyState === 'complete',
    { timeout }
  )

  return contextPage!
}

function getDevtools(page: Page, options?: { timeout?: number }) {
  return getContext(page, isDevtools, options)
}

function getBackground(page: Page, options?: { timeout?: number }) {
  return getContext(page, isBackground, options)
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
    await devtools!.waitForFunction(
      /* istanbul ignore next */
      () => 'UI' in window && 'viewManager' in (window as any).UI,
      { timeout }
    )

    // Check that the UI.viewManager has a chrome-extension target available
    // source: https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/ui/ViewManager.js
    await devtools!.waitForFunction(
      `
        !!Array.from(UI.viewManager._views.keys())
          .find(key => key.startsWith('${extensionUrl}'))
      `,
      { timeout }
    )

    // Once available, swap to the bundled chrome-extension devtools view
    await devtools!.evaluate(`
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
  const [panelFrame] = await panel!.frames()

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
    client as any,
    executionContext,
    // DOMWorld is used to return the associated frame. Extension execution
    // contexts don't have an associated frame, so this can be safely ignored
    // see: https://github.com/puppeteer/puppeteer/blob/9dd1aa302d719bef29e67c33f1f4717f1c0e2b79/src/common/ExecutionContext.ts#L73-L84
    (null as unknown) as DOMWorld
  )
}

export {
  getDevtools,
  getDevtoolsPanel,
  getBackground,
  setCaptureContentScriptExecutionContexts,
  getContentScriptExcecutionContext
}
