# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.3.0](https://github.com/dequelabs/puppeteer-devtools/compare/v3.2.0...v3.3.0) (2024-04-04)


### Features

* add support for manifest v3 extensions and background service workers ([#81](https://github.com/dequelabs/puppeteer-devtools/issues/81)) ([0608018](https://github.com/dequelabs/puppeteer-devtools/commit/06080187a19c13bc664eeff71074ae2084cc673c))

## [3.2.0](https://github.com/dequelabs/puppeteer-devtools/compare/v3.1.0...v3.2.0) (2024-02-05)


### Features

* support changes implemented in devtools frontend api in newer versions of chrome ([#74](https://github.com/dequelabs/puppeteer-devtools/issues/74)) ([e013f8a](https://github.com/dequelabs/puppeteer-devtools/commit/e013f8aa39c0e80a183aeed350155eadf0891ecc))

## [3.1.0](https://github.com/dequelabs/puppeteer-devtools/compare/v3.0.0...v3.1.0) (2023-07-13)

### Features

- upgrade puppeteer to 14.1.1 ([#70](https://github.com/dequelabs/puppeteer-devtools/issues/70)) ([56abb8d](https://github.com/dequelabs/puppeteer-devtools/commit/56abb8d8769a37f4eca346bac15d66c34bb28ffd))

### Bug Fixes

- correct puppeteer imports ([#71](https://github.com/dequelabs/puppeteer-devtools/issues/71)) ([da93565](https://github.com/dequelabs/puppeteer-devtools/commit/da935658143d6c90dabc901ad493205346d322f3))

## [3.0.0](https://github.com/dequelabs/puppeteer-devtools/compare/v2.0.1...v3.0.0) (2022-02-10)

### ⚠ BREAKING CHANGES

- Updates internal method used to access/control extension panels, rolling to puppeteer@^9

### Features

- supports getting background page ([#55](https://github.com/dequelabs/puppeteer-devtools/issues/55)) ([65881a1](https://github.com/dequelabs/puppeteer-devtools/commit/65881a1e5f891e5fe4163b574da40aa73e1fa161))
- update puppeteer to 9.1.1 ([#50](https://github.com/dequelabs/puppeteer-devtools/issues/50)) ([8390e70](https://github.com/dequelabs/puppeteer-devtools/commit/8390e70d8384cc0e3c306dae4bf0debcca85e7e9))

### [2.0.1](https://github.com/dequelabs/puppeteer-devtools/compare/v2.0.0...v2.0.1) (2021-04-02)

### Bug Fixes

- only return the execution context for the top most frame ([#37](https://github.com/dequelabs/puppeteer-devtools/issues/37)) ([cdf4945](https://github.com/dequelabs/puppeteer-devtools/commit/cdf4945d7ddead16d92249132ce859052a8c291d))

## [2.0.0](https://github.com/dequelabs/puppeteer-devtools/compare/v1.0.1...v2.0.0) (2021-01-22)

### ⚠ BREAKING CHANGES

- This functionality depends on newer versions of puppeteer (> 5.1.0)

### Features

- add ability to get an extension's content script execution context ([#31](https://github.com/dequelabs/puppeteer-devtools/issues/31)) ([8147349](https://github.com/dequelabs/puppeteer-devtools/commit/81473491ffb2f79b44720ea427cf08ff483b94b5))
- set minimum node version to 12 ([#28](https://github.com/dequelabs/puppeteer-devtools/issues/28)) ([d93df4f](https://github.com/dequelabs/puppeteer-devtools/commit/d93df4f83912773a1e95b46b9dc0bf98ddd534cf))

### [1.0.1](https://github.com/dequelabs/puppeteer-devtools/compare/v1.0.0...v1.0.1) (2020-07-15)

### Bug Fixes

- fix for UI.viewManager sometimes not being ready in devtools context ([#19](https://github.com/dequelabs/puppeteer-devtools/issues/19)) ([6de63b6](https://github.com/dequelabs/puppeteer-devtools/commit/6de63b66038614d0fe40ad06fa3f0456fd3fdc41))

## 1.0.0 (2020-04-06)

### Features

- initial release ([#1](https://github.com/dequelabs/puppeteer-devtools/issues/1)) ([c8da1a7](https://github.com/dequelabs/puppeteer-devtools/commit/c8da1a7d0e4c2c751d36f247cbf077b36a22dadd))
