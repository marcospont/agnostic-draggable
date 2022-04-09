# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.5](https://github.com/marcospont/agnostic-draggable/compare/v1.4.4...v1.4.5) (2022-04-09)

### [1.4.4](https://github.com/marcospont/agnostic-draggable/compare/v1.4.3...v1.4.4) (2022-04-09)


### Bug Fixes

* force border box sizing when resizing the sortable helper ([586cb85](https://github.com/marcospont/agnostic-draggable/commit/586cb85aac63e56d3956975afed547b49b89a40a))
* text selection wasn't working for non draggable, sortable or resizable elements ([2fba742](https://github.com/marcospont/agnostic-draggable/commit/2fba742a9f143cb283afd2d82ae82694e8b198ea))

### [1.4.3](https://github.com/marcospont/agnostic-draggable/compare/v1.4.2...v1.4.3) (2021-08-29)


### Bug Fixes

* prevent unwanted condition when destroying a resizable instance ([b3121fc](https://github.com/marcospont/agnostic-draggable/commit/b3121fcbd67aab0e5468e05c8eaa67ef72a8f7d7))

### [1.4.2](https://github.com/marcospont/agnostic-draggable/compare/v1.4.1...v1.4.2) (2021-08-29)


### Bug Fixes

* **resizable:** ensure pressing flag is always turned off ([32bc49e](https://github.com/marcospont/agnostic-draggable/commit/32bc49ec444d25753030f111097533d6fa3ce15b))

### [1.4.1](https://github.com/marcospont/agnostic-draggable/compare/v1.4.0...v1.4.1) (2021-08-28)


### Bug Fixes

* revert calling stop propagation, avoid error conditions during resize start ([af36122](https://github.com/marcospont/agnostic-draggable/commit/af361229efd7db8772a3e189f83ba6e6d7fca583))

## [1.4.0](https://github.com/marcospont/agnostic-draggable/compare/v1.3.1...v1.4.0) (2021-08-27)


### Features

* added proxy methods to prevent default and stop propagation using the original event ([053f7b3](https://github.com/marcospont/agnostic-draggable/commit/053f7b3ec9cd27e8ae9dba27f98169c65ca8afed))


### Bug Fixes

* stop propagation of events being cancelled ([84285f6](https://github.com/marcospont/agnostic-draggable/commit/84285f6e870baf2ddc3f6a864941969c215bc80b))
* trigger mouse stop when cancelling a start event but not when cancelling a move event ([db17595](https://github.com/marcospont/agnostic-draggable/commit/db17595b8fcb9b34aaabfa97b44af6ce1b008206))
* use the mouse event api to create events ([44fa75d](https://github.com/marcospont/agnostic-draggable/commit/44fa75d033df760325c1c273ed7a0d0201d2fef0))

### [1.3.1](https://github.com/marcospont/agnostic-draggable/compare/v1.3.0...v1.3.1) (2021-08-27)


### Bug Fixes

* **resizable:** event listeners were not being destroyed correctly ([b4dafdd](https://github.com/marcospont/agnostic-draggable/commit/b4dafddf1240594f95e3e33470fed11a12361268))

## [1.3.0](https://github.com/marcospont/agnostic-draggable/compare/v1.2.0...v1.3.0) (2021-08-23)


### Features

* plugins refactored to reference the parent widget as 'container' ([b456cfe](https://github.com/marcospont/agnostic-draggable/commit/b456cfeb779ed141779a5f71ac40c7f48fa567ee))
* **resizable:** ported resizable widget from jquery ui ([a5a86ac](https://github.com/marcospont/agnostic-draggable/commit/a5a86ac742bb6fee3ab2b6217ce82ef43d437237))
* **sensor:** added mouse:down event to mouse sensor ([dd5122c](https://github.com/marcospont/agnostic-draggable/commit/dd5122c4f4a2a61a1ada8767887e1f88d9af26cf))


### Bug Fixes

* **draggable:** drag:stop event should not be cancelable ([713e61a](https://github.com/marcospont/agnostic-draggable/commit/713e61a5b21a3ea0b0ccb1f6d7f831dec3148f2a))

## [1.2.0](https://github.com/marcospont/agnostic-draggable/compare/v1.1.2...v1.2.0) (2021-08-16)


### Features

* improve sortable event arguments ([08902cd](https://github.com/marcospont/agnostic-draggable/commit/08902cd0451b6e3066a26189b8627b49f1b37e41))

### [1.1.2](https://github.com/marcospont/agnostic-draggable/compare/v1.1.1...v1.1.2) (2021-07-14)


### Bug Fixes

* helper/placeholder size sync should not consider padding ([4c4dbe0](https://github.com/marcospont/agnostic-draggable/commit/4c4dbe08593e54538c5af563547ddac5dba64848))

### [1.1.1](https://github.com/marcospont/agnostic-draggable/compare/v1.1.0...v1.1.1) (2021-07-14)

## [1.1.0](https://github.com/marcospont/agnostic-draggable/compare/v1.0.6...v1.1.0) (2021-07-14)


### Features

* added new option hidePlaceholder ([8385a17](https://github.com/marcospont/agnostic-draggable/commit/8385a17ab90d829a697a15952aa0fe397e33a717))


### Bug Fixes

* helper and placeholder size sync was not working ([e80ba36](https://github.com/marcospont/agnostic-draggable/commit/e80ba36c958749a42578662ea5c4250835eb0892))

### [1.0.6](https://github.com/marcospont/agnostic-draggable/compare/v1.0.5...v1.0.6) (2021-06-06)


### Bug Fixes

* bad calculation of draggable's parent offset ([@rozek](https://github.com/rozek)) ([27528f1](https://github.com/marcospont/agnostic-draggable/commit/27528f1242aa6d420ede7d5113a88ea1151b1554))
* revert function was not being called ([@rozek](https://github.com/rozek)) ([3befc78](https://github.com/marcospont/agnostic-draggable/commit/3befc78834b543fd18872668b5c7f82a392fd90c))

### [1.0.5](https://github.com/marcospont/agnostic-draggable/compare/v1.0.4...v1.0.5) (2021-04-19)

### [1.0.4](https://github.com/marcospont/agnostic-draggable/compare/v1.0.3...v1.0.4) (2020-12-01)


### Bug Fixes

* fixed wrong and missing parameters when emitting the sortmove event ([28b795d](https://github.com/marcospont/agnostic-draggable/commit/28b795dac3df7194240006e707fb86abd1389ca5))

### [1.0.3](https://github.com/marcospont/agnostic-draggable/compare/v1.0.2...v1.0.3) (2020-12-01)


### Bug Fixes

* child intersection not properly initialized ([79692db](https://github.com/marcospont/agnostic-draggable/commit/79692db1fc686fe7c7026946b7b8624a71eca219))
* droppable.intersect expects a draggable and an event ([1eb361d](https://github.com/marcospont/agnostic-draggable/commit/1eb361d6a6ecb974a07f598ddf644b3a8164995d))
* removed position debug code ([448b341](https://github.com/marcospont/agnostic-draggable/commit/448b341fe5473131f51807b3a91dac99ff48f5ef))

### [1.0.2](https://github.com/marcospont/agnostic-draggable/compare/v1.0.1...v1.0.2) (2020-11-27)

### [1.0.1](https://github.com/marcospont/agnostic-draggable/compare/v1.0.0...v1.0.1) (2020-11-27)

## 1.0.0 (2020-11-26)


### Features

* initial commit ([dbad1bc](https://github.com/marcospont/agnostic-draggable/commit/dbad1bc4a52defe4be5f95fb4d93610c20402297))
