`jspub` offers a rich set of _addon_ options in additon to the [JSDoc configuration options](http://usejsdoc.org/about-configuring-jsdoc.html).

### Immutable Configuration Options:
The configuration options documented here only contain add-on options for JSDoc. See the JSDoc documentation for the full list of configuration options. There are however a few configuration options that cannot be overridden. They include:
- `conf.templates.default.layoutFile`: Set to the internal layout file used during execution.

### Template Requirements:
`conf.opts.template` should reference a path to the actual JSDoc template being used (e.g. `./node_modules/minami` would be valid assuming that the `minami` template module is installed).

### Template Literals:
All of the add-on configuration values can also contain template literals (i.e. `${}`) that reference paths within the following objects:
- `${package}`: The `package.json` object followed by any of it's properties (e.g. `${package.repository.url}/README.md`).
- `${publish.lastVersionPublished}`: Will evaluate to the last version published to `npm` or blank when nothing has been published yet.
- `${publish.lastVersion}`: Will evaluate to the last version published to `npm` or the current `package.version`when nothing has been published yet.
- `${publish.moduleURL}`: Will basically evaluate to the `homepage` in `package.json`, but will also remove any _hashes_ in the URL (e.g. assuming a `homepage` of `https://example.com/username/module#readme` would become `https://example.com/username/module`).
- `${publish.date}`: The current date string formatted as `YYYY-MM-DD`