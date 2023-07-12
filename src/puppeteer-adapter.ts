import { type DOMWorld } from 'puppeteer/lib/cjs/puppeteer/common/DOMWorld'
import { ExecutionContext } from 'puppeteer/lib/cjs/puppeteer/common/ExecutionContext.js'
import Protocol from 'devtools-protocol'
import { type CDPSession } from 'puppeteer/lib/cjs/puppeteer/common/Connection'

export type ExecutionContextDescription =
  Protocol.Runtime.ExecutionContextDescription
export { DOMWorld, CDPSession, ExecutionContext }
