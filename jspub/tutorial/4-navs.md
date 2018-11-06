The _responsive_ navigation menu that gets injected into the chosen [`jsdoc` template](https://github.com/jsdoc3/jsdoc#templates) can be modified to add a personalized look-and-feel using the provided [`opts.jspub.pages.menu`](tutorial-2-conf.html) configuration options. Everything from the CSS `class` of the menu, an _optional_ `logo` to each of the `icons` displayed can be changed.

### The Logo <sub id="logo"></sub>
By default, no `logo` is used. Only the `package.name` is displayed in the navigation menu. However, if a `logo` is desired there are a few options available. When the [`opts.jspub.pages.menu.logo.src`](tutorial-2-conf.html) is set the `logo` will be rendered as a simple `img`. This option is adequate when styling is not needed, but if the `logo` is in `svg` format and it needs to be styled it falls short. To accommodate `svg` styling, a separate [`opts.jspub.pages.menu.logo.inlineSvgPath`](tutorial-2-conf.html) can be defined that provides a path to an `svg` that will be loaded into the `logo` link as the raw `svg` content rather than an `img`. This permits the [`opts.jspub.pages.menu.logo.className`](tutorial-2-conf.html) to style the `logo` for the `svg` elements (e.g. `fill: red`). For more information on available `logo` options, see the configuration options for [publicize](global.html#publicize).

### The `npm` Package Icon <sub id="npm"></sub>
By default, an `npm` icon/link is displayed that points to `https://www.npmjs.com/package/<your_package_name>` from the `name` defined in `package.json`. This option can be supressed by setting [`opts.jspub.pages.menu.package`](tutorial-2-conf.html) to `none` and can be customized be setting the same option to a value that will be used on the image `src` for the icon. The default icon is rendered as an `svg` so that the icon can be styled/colorized via [`opts.jspub.pages.menu.icons.className`](tutorial-2-conf.html). For more information on available options for `icons`, see the configuration options for [publicize](global.html#publicize).

### The Changelog Icon <sub id="changelog"></sub>
By default, a changelog icon/link is displayed that points to a _parsed_ markdown file called `CHANGELOG.html`. This option can be supressed by setting [`opts.jspub.pages.menu.changelog`](tutorial-2-conf.html) to `none` and can be customized be setting the same option to a value that will be used on the image `src` for the icon. The default icon is rendered as an `svg` so that the icon can be styled/colorized via [`opts.jspub.pages.menu.icons.className`](tutorial-2-conf.html). For more information on available options for `icons`, see the configuration options for [publicize](global.html#publicize).

### The Source Code Icon <sub id="source"></sub>
By default, a source code icon/link is displayed that points to the `homepage` URL set in the `package.json`. This option can be supressed by setting [`opts.jspub.pages.menu.sourceCode`](tutorial-2-conf.html) to `none` and can be customized be setting the same option to a value that will be used on the image `src` for the icon. The default icon is rendered as an `svg` so that the icon can be styled/colorized via [`opts.jspub.pages.menu.icons.className`](tutorial-2-conf.html). For more information on available options for `icons`, see the configuration options for [publicize](global.html#publicize).

### Version Selection <sub id="versions"></sub>
Documentation versions are managed via [`npm view <your_package_name> versions --json`](https://docs.npmjs.com/cli/view). Each published version to `npm` is captured when generating documentation and stored within a `versions.json` file under the `jsdoc` configuration directory set by `opts.destination`. The `versions.json` file contains a simple array of versions that will be loaded via the `jspub` JavaScript ran in the client's browser. During each [deployment](tutorial-1-start.html#deploy) the `versions.json` gets overwritten in the _root_ directory of the branch set by [`opts.jspub.deploy.branch`](tutorial-2-conf.html). This allows both previously and the currently deployed docs to always reference the _latest_ versions in the selection menu presented in the client's browser.

There are a few techniques that allow filtering of versions that are used on the client. The first involves setting the [`opts.jspub.versions.type`](tutorial-2-conf.html) option to either [`major` or `minor`](https://semver.org). When left unset no filtering is performed and all versions are available for client selection. In contrast, when `major`/`minor` is set, only versions that are published where the `major`/`minor` version _changes_ are shown. For example, consider the following published versions:
- `v1.0.0`
- `v1.0.1`
- `v1.0.2`
- `v1.1.0`
- `v1.0.1`
- `v1.2.0`
- `v2.0.0`

When `major` is set the resulting versions selections shown would be:
- `v1.0.0`
- `v2.0.0`

Likewise, when `minor` is set the resulting versions selections shown would be:
- `v1.0.0`
- `v1.1.0`
- `v1.2.0`
- `v2.0.0`

Another technique is setting the [`opts.jspub.versions.from`](tutorial-2-conf.html) option to a version that will be used as a starting point. Using the same previous example version set, if `from` is set to `v1.1.0` then the resulting versions selections shown would be:
- `v1.1.0`
- `v1.0.1`
- `v1.2.0`
- `v2.0.0`

__NOTE:__ Keep in mind that the doc version being viewed will always be shown regardless of the filtering values that are set.

### Static Resources <sub id="resources"></sub>
Although they are not technically part of the navigation menu, static resources like `CSS`, `JavaScript` and `meta` can be added using [`opts.jspub.pages.links`](tutorial-2-conf.html), [`opts.jspub.pages.scripts`](tutorial-2-conf.html) and [`opts.jspub.pages.meta`](tutorial-2-conf.html), respectively. `links` and `meta` are added to the `head` of the page while `scripts` are added as the last elements within the `body`. The [example configuration](tutorial-2-conf.html#jspub-example) can be used as a guide as well as the documented options for [publicize](global.html#publicize).

#### [Globals >>](global.html)