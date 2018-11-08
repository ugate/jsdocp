## [0.0.10](https://github.com/ugate/jsdocp/tree/v0.0.10) (2018-11-08)
[Full Changelog](https://github.com/ugate/jsdocp/compare/v0.0.10...v0.0.10)


__Breaking Changes:__
* [[BREAK]: For privacy purposes, opts.deploy.urlSuffix is used instead of a full URL with a private token included](https://github.com/ugate/jsdocp/commit/bc787ce013b1d6f605e1da5b47b9ea9ca9ea3fbd)
* [[BREAK]: Moved jspub options from opts to opts.jspub to help distinguish between jsdoc options and jspub options](https://github.com/ugate/jsdocp/commit/df50a37625ca10aba075cbf054e9b0d7df08fc88)

__Features:__
* [[FEATURE]: Parameter substitutions now include process.env](https://github.com/ugate/jsdocp/commit/a99e6ea4320796379a84bf37b1a97fa8cf5ca11f)
* [[FEATURE]: sub HTML elements with ID attributes can now be used to link tutorial sections with an anchor tag with an href to the same ID (preceded by a pound, of course)](https://github.com/ugate/jsdocp/commit/a9147d3c76c565d58e44c9ad5c3f2dab312ff46e)
* [[FEATURE]: When opts.pages.logo.inlineSvgPath is defined an attempt will be made to extract the SVG logo and place it inline within the navigation menu. When it cannot be extracted, the opts.pages.logo.src will be used on the logo image source. If neither can be resolved or set a logo is not displayed.](https://github.com/ugate/jsdocp/commit/5c0bef45cd76a217acd9137196537543b343bdf1)
* [[FEATURE]: Responsive main navigation menu with customizable logo, package icon, CHANGELOG icon and source code icon (can also use the default svg icons and style them using a custom CSS class)](https://github.com/ugate/jsdocp/commit/58567b75c95bb45525a0e3d5db302edb8a67ecac)
* [[FEATURE]: Logo, npm package icon, changelog icon and source code icon are all customizable via the cofiguration JSON](https://github.com/ugate/jsdocp/commit/11e0cf79d4ae6947255e50e0dd1b4a4e419dbb55)

__Fixes:__
* [[FIX]: Deploy message was omitted causing deployment failure](https://github.com/ugate/jsdocp/commit/905e20286d3fd5542ee61444982c560b77f4b932)
* [[FIX]: Changelog will update history.pushState when icon link is selected](https://github.com/ugate/jsdocp/commit/9056c938b54194b1e8452cd2effb1c793f5e3d0f)
* [[FIX]: Changelog title now updates the page title when the icon is clicked](https://github.com/ugate/jsdocp/commit/7576a9528259289cd842d755f42fc1682bc1a212)
* [[FIX]: jspub fenced code block escaping for tutorial markdown using extra back-ticks. All paths in configuration are now relative to the module that docs are being created for.](https://github.com/ugate/jsdocp/commit/c0df52d3b341596f215491dab884c30370780fda)
* [[FIX]: JSDoc configuration for templates.default.layoutFile now looks in the directories defined by opts.layoutFrags.layoutCheckTemplateDirs. When possible, the icon link to CHANGELOG.html is loaded via client in order to preserve template layout wrapper.](https://github.com/ugate/jsdocp/commit/28b02dfbfd4d95176980cbcc900b624530b18f86)