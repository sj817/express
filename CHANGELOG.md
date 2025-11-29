# Changelog

## [1.1.0](https://github.com/sj817/express/compare/express-v1.0.3...express-v1.1.0) (2025-11-29)


### ✨ Features

* add body-parser submodule for improved request handling ([b4d1ce5](https://github.com/sj817/express/commit/b4d1ce52d71302a6ec5bedabade306962f968011))
* add deprecation warnings for redirect arguments undefined ([#6405](https://github.com/sj817/express/issues/6405)) ([c5b8d55](https://github.com/sj817/express/commit/c5b8d55a6a941fb5f8c783f7734a32f40142c4d9))
* add environment specification for release-please job ([94623a5](https://github.com/sj817/express/commit/94623a5d751bf2c2e1bda5f263a914e3bb895bb6))
* add path-to-regexp submodule ([5742d2b](https://github.com/sj817/express/commit/5742d2bdb01004c9185473a32cb7486e90e8ac19))
* add release-please configuration and manifest files ([6c44c08](https://github.com/sj817/express/commit/6c44c08a687f3c477adf91ac5de9cf67cec2e7d8))
* add serve-static submodule for improved static file serving ([57f5c37](https://github.com/sj817/express/commit/57f5c37aab62b46a7faaec0c6078f947e0a54bd0))
* add utility functions for testing in Express framework ([c98e0a6](https://github.com/sj817/express/commit/c98e0a6e10f45b77e51af560b0aac84a28b81bf8))
* **router:** add TypeScript support and utility functions for testing ([cbb3223](https://github.com/sj817/express/commit/cbb3223ac6f1b9a71f38fa45ba53666eeb854498))
* **router:** introduce TypeScript types for IRouter, request, response, and parameter handling ([972239c](https://github.com/sj817/express/commit/972239c456a45cf0f38d551461aba5a02ca6bd5a))
* **tests:** add comprehensive tests for response methods in Express ([b6a2cf9](https://github.com/sj817/express/commit/b6a2cf913a8312e14aa2e12d8b9c90322bf953ca))
* update release-please action configuration in workflow ([5a39221](https://github.com/sj817/express/commit/5a3922183a27848b91a251d1cdf97d8c2ddb2912))


### 📝 Documentation

* readme.md ([12b4fcc](https://github.com/sj817/express/commit/12b4fcc8ffb089c5a10cdd9271c07a9405c5bd36))
* switch badges from badgen.net to shields.io ([#6900](https://github.com/sj817/express/issues/6900)) ([2551a7d](https://github.com/sj817/express/commit/2551a7d8afd82e41b9282bd0235190a847a59f44))
* update emeritus triagers ([#6890](https://github.com/sj817/express/issues/6890)) ([77bcd52](https://github.com/sj817/express/commit/77bcd5274a87047e5b3fe2f17f6c342db3909c53))
* update English and Chinese README files ([c98e0a6](https://github.com/sj817/express/commit/c98e0a6e10f45b77e51af560b0aac84a28b81bf8))


### 🎫 Chores

* enforce explicit Buffer import and add lint rule ([#6525](https://github.com/sj817/express/issues/6525)) ([98c85eb](https://github.com/sj817/express/commit/98c85eb0dd64f23940f1ac5b43d74d0eac659248))
* fix typo ([#6609](https://github.com/sj817/express/issues/6609)) ([b0ed15b](https://github.com/sj817/express/commit/b0ed15b4525cd68d4a94d1a71d1a34da6f2961d3))
* remove history.md from being packaged on publish ([#6780](https://github.com/sj817/express/issues/6780)) ([9a7afb2](https://github.com/sj817/express/commit/9a7afb2886247603ebd69a1c8ee5d2f29542a6c0))
* update git rules to ignore `yarn.lock` file ([#6588](https://github.com/sj817/express/issues/6588)) ([d9a62f9](https://github.com/sj817/express/commit/d9a62f983390da932c4f2e21e67a55fa33c164f4))
* use node protocol for node builtin module ([#6520](https://github.com/sj817/express/issues/6520)) ([3910323](https://github.com/sj817/express/commit/3910323d09809f3b553af47ffd7b568d8dfd9fd6))


### ♻️ Code Refactoring

* optimize dependency management and code structure ([7ad277f](https://github.com/sj817/express/commit/7ad277f940a5dd3fe4202a4df196aaecec884b03))
* use cached slice in app.listen ([#6897](https://github.com/sj817/express/issues/6897)) ([54af593](https://github.com/sj817/express/commit/54af593b739ea44674e4a445efa15b8024f093da))
* 使用 declare 语法重构路由器和应用程序的类型定义 ([baf2895](https://github.com/sj817/express/commit/baf2895d0124cc2caffaaac8d10ad46eed23350e))


### ✅ Tests

* add GBK encoding tests ([c98e0a6](https://github.com/sj817/express/commit/c98e0a6e10f45b77e51af560b0aac84a28b81bf8))
* 一点点单元测试 ([660869a](https://github.com/sj817/express/commit/660869a74c4e2f6aa6850eb6496641d9a8dfdab3))


### 📦️ Build System

* **deps-dev:** bump cookie-session from 2.1.0 to 2.1.1 ([#6678](https://github.com/sj817/express/issues/6678)) ([6616e39](https://github.com/sj817/express/commit/6616e39d4dbce495c83bc71501b627f454d1858f))
* **deps-dev:** bump morgan from 1.10.0 to 1.10.1 ([#6679](https://github.com/sj817/express/issues/6679)) ([ed64290](https://github.com/sj817/express/commit/ed64290e4a8a546be7b3fbe39edd4c3c03e46384))
* **deps:** bump actions/checkout from 4.2.2 to 5.0.0 ([#6797](https://github.com/sj817/express/issues/6797)) ([b9b9f52](https://github.com/sj817/express/commit/b9b9f52b2f7c7642b2325320edf633ec44d189a1))
* **deps:** bump actions/download-artifact from 4.3.0 to 5.0.0 ([#6793](https://github.com/sj817/express/issues/6793)) ([e4fb370](https://github.com/sj817/express/commit/e4fb370ad8c2965783b997ac8bfcfad63648453c))
* **deps:** bump actions/download-artifact from 5.0.0 to 6.0.0 ([#6871](https://github.com/sj817/express/issues/6871)) ([1b196c8](https://github.com/sj817/express/commit/1b196c8b82af8df18d40c66c30d958448ab5e2d1))
* **deps:** bump actions/setup-node from 4.4.0 to 5.0.0 ([#6794](https://github.com/sj817/express/issues/6794)) ([60d4c16](https://github.com/sj817/express/commit/60d4c16cc992c80dc27763efa5362723b39ae00f))
* **deps:** bump actions/setup-node from 5.0.0 to 6.0.0 ([#6870](https://github.com/sj817/express/issues/6870)) ([374fc1a](https://github.com/sj817/express/commit/374fc1a0f9a8e4fe8e9c4993bf9f4814eff5bf9c))
* **deps:** bump actions/upload-artifact from 4.6.2 to 5.0.0 ([#6868](https://github.com/sj817/express/issues/6868)) ([4453d83](https://github.com/sj817/express/commit/4453d83ccaed5c80f0c10a23d01216eff612ee56))
* **deps:** bump github/codeql-action from 3.28.18 to 3.29.2 ([#6618](https://github.com/sj817/express/issues/6618)) ([7a93112](https://github.com/sj817/express/commit/7a9311216adf81c49812eb8e645c4a3774424189))
* **deps:** bump github/codeql-action from 3.29.2 to 3.29.5 ([#6675](https://github.com/sj817/express/issues/6675)) ([2eb4205](https://github.com/sj817/express/commit/2eb42059f33d9be6ead3bb813d05aa975283d592))
* **deps:** bump github/codeql-action from 3.29.7 to 3.30.5 ([#6796](https://github.com/sj817/express/issues/6796)) ([ffa89f2](https://github.com/sj817/express/commit/ffa89f2ccfe45f7203aa52e9c5ee67ebd6d3a84e))
* **deps:** bump github/codeql-action from 3.30.5 to 4.31.2 ([#6869](https://github.com/sj817/express/issues/6869)) ([db50766](https://github.com/sj817/express/commit/db507669ca5dc559309eabe4f6df03bb28345078))
* **deps:** bump ossf/scorecard-action from 2.4.2 to 2.4.3 ([#6795](https://github.com/sj817/express/issues/6795)) ([9e6760e](https://github.com/sj817/express/commit/9e6760e186286f737b7211b46e705344b3ad5804))


### 🎡 Continuous Integration

* add node.js 25 to test matrix ([#6843](https://github.com/sj817/express/issues/6843)) ([64e7373](https://github.com/sj817/express/commit/64e7373d6976dd3ec32a92dbc31ff19700fe152a))
* run CI when the markdown changes ([#6632](https://github.com/sj817/express/issues/6632)) ([ef5f2e1](https://github.com/sj817/express/commit/ef5f2e13ef64a1575ce8c2d77b180d593644ccfa))
