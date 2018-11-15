The configuration options documented here only contain add-on options for `jsdoc`. See the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html) for the full list of configuration options. All of the `jsdoc` configuration works as described in the [JSDoc configuration](http://usejsdoc.org/about-configuring-jsdoc.html) as it does in `jsdocp`. Only additions are made to the configuration `opts.jsdocp` (See [Configuration](tutorial-2-conf.html) for more details).

### How It Works <sub id="how"></sub>
At the core of `jsdocp` is a wrapper around `jsdoc` that provides all of the features listed in the [README](index.html). 
1. The supplied configuration is sanitized and merged into a _master_ configuration file (see [Configuration](tutorial-2-conf.html))
1. Previous `npm` published versions are captured via `npm view versions` and stored in the `opts.destination` directory as `versions.json` (see [Documentation Versions](tutorial-4-navs.html#versions))
1. Parameter substitutions are resolved within the _master_ configuration's `opts` (see [Parameter Substitutions](tutorial-3-subs.html))
1. The internal `jsdocp` templates are injected into the `layout` (the rest of the templates are supplied by the template of your choosing):
  - `head`: Placed in the `head` of every page that supplies the user-defined `links`/CSS sources, `meta`, etc.
  - `nav`: Placed as the first entry to every page's `body` that contains all of the navigation links to the `npm` module, `CHANGELOG`, source code, document version selection, etc.
  - `foot`: Placed as the last entry to every page's `body` that contains user-defined `script`s
1. The `jsdoc` command is ran using the internally processed _master_ configuration file as input
1. The `CHANGELOG.md` and parsed `CHANGELOG.html` are generated in the `opts.destinaiton` directory (generated/filtered via `git log` using the supplied [rich set of configuration options](tutorial-2-conf.html))
1. `jsdocp` markdown extensions are parsed on the tutorials (see the [Parameter Substitutions](tutorial-3-subs.html) section for more details)
1. Publishing control is transferred to the template designated by `opts.template`

### Setup <sub id="setup"><sup>_(windows users can use [`git` for windows](https://gitforwindows.org))_</sup></sub>
1. `npm install -D <template>`
    - Replace `<template>` with the desired template to use (see [`jsdoc` templates](https://github.com/jsdoc3/jsdoc#templates))
1. `npm install -D jsdocp`
    - Install jsdocp as a `dev` dependency
1. `mkdir -p jsdocp/static jsdocp/tutorial && touch jsdocp/jsdoc.conf`
    - Create the directories that will be used by `jsdocp`
    - Add the desired `static`/`tutorial` files (e.g. CSS, scripts, images, tutorials, etc.)
1. Add the desired [`jsdoc`/`jsdocp` configuration options](tutorial-2-conf.html) to the `jsdocp/jsdoc.conf` file. The [example `jsdocp` configuration](tutorial-2-conf.html#jsdocp-example) can be used as a guide. <br/>At __minumum__, ensure the follwing are set:
    - `source` - All the source files that should be included in the docs
    - `opts.template` - Set to a path to the actual [`jsdoc` template](https://github.com/jsdoc3/jsdoc#templates) being used. The template should be a module acceessible on [npm](https://www.npmjs.com/) and the path should be relative to the module that `jsdoc` is generating documentation for (e.g. `./node_modules/myCoolTemplateModuleName`).
1. Add the following to `package.json`:
    -  
    ```json
    "scripts": {
        "jsdocp": "jsdocp ./jsdocp/jsdoc.json",
        "jsdocp-deploy": "jsdocp -D ./jsdocp/jsdoc.json"
    }
    ```
1. `npm run jsdocp` will generate the docs in the module's `./docs` (unless overridden in the [Configuration](tutorial-2-conf.html))

### Deployment <sub id="deploy"><sup>_(assumes [setup](#setup) has been completed)_</sup></sub>
There are a few different ways that `deployment` can be performed based upon [`opts.jsdocp.deploy`](tutorial-2-conf.html) options. Deployment can occur locally or using a different `git` hosting service and running `npm run jsdocp-deploy`, but it will require some minor changes to `conf.opts.jsdocp.deploy` in the `jsdoc.conf` file outlined in the [setup](#setup). However, we'll cover the most common use case where [GitHub Pages](https://pages.github.com/) and [travis-ci](https://travis-ci.com) are being used.
1. If the `gh-pages` branch isn't already created/selected for [GitHub Pages](https://help.github.com/articles/configuring-a-publishing-source-for-github-pages/) on `https://github.com/<your_username>/<your_repo_name>/settings`, the following script can be used to create the `gh-pages` branch.
    - ```bash
    git checkout --orphan gh-pages
    git rm -rf .
    touch README.md
    git add README.md
    git commit -m 'Initial gh-pages commit'
    git push origin gh-pages
    ```
1. [Create a personal access token on GitHub](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/).
1. If you haven't already done so, go to [travis-ci.com](https://travis-ci.com/), setup an account and follow the instructions to enable/activate your repo. Copy the personal access token from GitHub in the previous step and paste it in a new __Environment Variable__ called `GITHUB_TOKEN` on `https://travis-ci.com/<your_username>/<your_repo_name>/settings`.
1. While your at it, you may also want to do the same thing for `npm` by creating an __Access Token__ on `https://www.npmjs.com/settings/<your_username>/tokens` and copy/paste it in a new __Environment Variable__ called `NPM_TOKEN` on `https://travis-ci.com/<your_username>/<your_repo_name>/settings` __and put quotes around the value pasted: "my-npm-token-value"__  (we'll use this in our `.travis.yml` to deploy to `npm`).
1. Create a  `.travis.yml` in the _root_ of your project using the [`.travis.yml` below](#travis) as a guide.
1. `npm version patch -m "Deploying %s" && git push origin <tag_name>` - replacing `patch` with `major`, `minor`, etc. as needed (see [npm-version](https://docs.npmjs.com/cli/version))

Now everytime that a new version is _tagged_/_pushed_ a new version of the `npm` package will be updated on `https://www.npmjs.com/package/<your_package_name>` and the docs will get updated on `https://<your_username>.github.io/<your_repo_name>` automatically!
<sub id="travis"></sub>
```jsdocp ./.travis.yml
```

#### [Configuration >>](tutorial-2-conf.html)