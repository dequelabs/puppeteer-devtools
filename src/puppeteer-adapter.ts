import { DOMWorld } from 'puppeteer/lib/cjs/puppeteer/common/DOMWorld'
import { ExecutionContext } from 'puppeteer/lib/cjs/puppeteer/common/ExecutionContext'
import Protocol from 'devtools-protocol'
import { CDPSession } from 'puppeteer/lib/cjs/puppeteer/common/Connection'

export type ExecutionContextDescription = Protocol.Runtime.ExecutionContextDescription
export { DOMWorld, CDPSession, ExecutionContext }
