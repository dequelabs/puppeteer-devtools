import { DOMWorld } from 'puppeteer/lib/cjs/common/DOMWorld'
import { ExecutionContext } from 'puppeteer/lib/cjs/common/ExecutionContext'
// import Protocol from 'devtools-protocol'
import { CDPSession } from 'puppeteer/lib/cjs/common/Connection'

export type ExecutionContextDescription = any //Protocol.Runtime.ExecutionContextDescription
export { DOMWorld, CDPSession, ExecutionContext }
