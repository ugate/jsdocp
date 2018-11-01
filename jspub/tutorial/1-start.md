The configuration options documented here only contain add-on options for `jsdoc`. See the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html) for the full list of configuration options. All of the `jsdoc` configuration works as described in the [JSDoc configuration](http://usejsdoc.org/about-configuring-jsdoc.html) as it does in `jspub`. Only additions are made to the configuration `opts`.

### How It Works
At the core of `jspub` is a wrapper around `jsdoc` that provides all of the features listed in the [README](index.html). 
1. The supplied configuration is sanitized and merged into a _master_ configuration file
1. Previous `npm` published versions are captured via `npm view versions` and stored in the `conf.opts.destination` directory as `versions.json` (array of version strings)
1. Template Literals are resolved within the _master_ configuration's `conf.opts` (see the __Template Literals__ section below for more details)
1. The internal `jspub` templates are injected into the `layout` (the rest of the templates are supplied by the template of your choosing):
  - `head`: Placed in the `head` of every page that supplies the user-defined `links`/CSS sources, `meta`, etc.
  - `nav`: Placed as the first entry to every page's `body` that contains all of the navigation links to the `npm` module, `CHANGELOG`, source code, document version selection, etc.
  - `foot`: Placed as the last entry to every page's `body` that contains user-defined `script`s
1. The `jsdoc` command is ran using the internally processed _master_ configuration file as input
1. The `CHANGELOG.md` and parsed `CHANGELOG.html` are generated in the `conf.opts.destinaiton` directory (generated/filtered via `git log` using the supplied __rich__ set of configuration options)
1. Any tutorials are parsed with the `jspub` _markdown extensions_ (see the __Template Literals__ section below for more details)
1. Publishing control is transferred to the template designated by `conf.opts.template`

### Template Literals:
All of the add-on configuration values can also contain [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) (i.e. `${}`) that reference paths within the following objects:
- `${package}`: The `package.json` object followed by any of it's properties (e.g. `${package.repository.url}/README.md`).
- `${publish.lastVersionPublished}`: Will evaluate to the last version published to `npm` or blank when nothing has been published yet.
- `${publish.lastVersion}`: Will evaluate to the last version published to `npm` or the current `package.version`when nothing has been published yet.
- `${publish.moduleURL}`: Will basically evaluate to the `homepage` in `package.json`, but will also remove any _hashes_ in the URL (e.g. assuming a `homepage` of `https://example.com/username/module#readme` would become `https://example.com/username/module`).
- `${publish.date}`: The current date string formatted as `YYYY-MM-DD`
__NOTE:__ _Only_ placeholders within the `conf.opts` section will be evaluated

### Tutorials Markdown Extensions
For ease of use an additional markdown extension can be used throughout any of the tutorials _markdown_ to include `code` snippets from resource files. Let's say we want to include the configuration file located at `./jspub/conf.json`. We can accomplish this by simply adding the following to our tutorial _markdown_:
<pre>
```jspub ./jspub/conf.json
```
</pre>
Which would become:
<pre>
```json
conf.json contents would appear here
```
</pre>

### Template Requirements
In addition to the configuration that `jsdoc` requires, the `conf.opts.template` is required and should reference a path to the __actual__ `jsdoc` template being used. The template should be a module acceessible on [npm](https://www.npmjs.com/), the path to it set via `conf.opts.template` is relative to the module that `jsdoc` is generating documentation for (e.g. `./node_modules/myCoolTemplateModuleName`).

### Addtional Configuration Options
`jspub` offers many _addon_ options in additon to the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html). A full listing of all the `jspub` _addon_ configuration options can be found under [the globals section](global.html).

Below is the _default_ `jspub` configuration. __It's important to note that any paths defined within `opts` are relative to the module that `jsdoc` is generating documentation for. All other paths are relative to the `jspub` module directory.__
```jspub ./jsdoc/jsdoc-defaults.json
```
Not all of the _default_ `jspub` configuration need to be defined for your project. Let's take for example how `jspub` generated it's own documentation usng the configuration below:
```jspub ./jspub/jsdoc.json
```