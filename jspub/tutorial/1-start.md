The configuration options documented here only contain add-on options for `jsdoc`. See the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html) for the full list of configuration options. All of the `jsdoc` configuration works as described in the [JSDoc configuration](http://usejsdoc.org/about-configuring-jsdoc.html) as it does in `jspub`. Only additions are made to the configuration `opts`.

### Template Requirements
In addition to the configuration that `jsdoc` requires, the `conf.opts.template` is required and should reference a path to the __actual__ `jsdoc` template being used. The template should be a module acceessible on [npm](https://www.npmjs.com/), the path via `conf.opts.template` and is relative to the module that `jsdoc` is generating documentation for (e.g. `./node_modules/myCoolTemplateModuleName`).

### How It Works
At the core of `jspub` is a wrapper around `jsdoc` that provides all of the features listed in the [README](index.html). 
1. The supplied configuration is sanitized and merged into a _master_ configuration file (see [Configuration](tutorial-2-conf.html))
1. Previous `npm` published versions are captured via `npm view versions` and stored in the `conf.opts.destination` directory as `versions.json` (see [Documentation Versions](tutorial-4-vers.html))
1. Parameter substitutions are resolved within the _master_ configuration's `conf.opts` (see [Parameter Substitutions](tutorial-3-subs.html))
1. The internal `jspub` templates are injected into the `layout` (the rest of the templates are supplied by the template of your choosing):
  - `head`: Placed in the `head` of every page that supplies the user-defined `links`/CSS sources, `meta`, etc.
  - `nav`: Placed as the first entry to every page's `body` that contains all of the navigation links to the `npm` module, `CHANGELOG`, source code, document version selection, etc.
  - `foot`: Placed as the last entry to every page's `body` that contains user-defined `script`s
1. The `jsdoc` command is ran using the internally processed _master_ configuration file as input
1. The `CHANGELOG.md` and parsed `CHANGELOG.html` are generated in the `conf.opts.destinaiton` directory (generated/filtered via `git log` using the supplied [rich set of configuration options](tutorial-2-conf.html))
1. `jspub` markdown extensions are parsed on the tutorials (see the [Parameter Substitutions](tutorial-3-subs.html) section for more details)
1. Publishing control is transferred to the template designated by `conf.opts.template`

### Setup <sub><sup>_(windows users can use equivalent commands)_</sup></sub>
1. `npm install -D <template>`
    - Replace `<template>` with the desired template to use (see [`jsdoc` templates](https://github.com/jsdoc3/jsdoc#templates))
1. `npm install -D jspub`
    - Install jspub as a `dev` dependency
1. `mkdir -p jspub/static jspub/tutorial && touch jspub/jsdoc.conf`
    - Create the directories that will be used by `jspub`
    - Add the desired `static`/`tutorial` files
    - Add the desired [`jsdoc`/`jspub` configuration options](tutorial-2-conf.html) to the `jspub/jsdoc.conf` file (the [example `jspub` configuration](tutorial-2-conf.html#jspub-example) can be used as a guide)

#### [Configuration >>](tutorial-2-conf.html)