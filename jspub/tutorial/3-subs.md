### Template Literals:
All of the [`opts.jspub`](tutorial-2-conf.html) configuration option values can also contain [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) (i.e. `${}`) that reference paths within the following objects:
- `${package}`: The `package.json` object which can allows access to any of it's property paths (e.g. `${package.repository.url}`).
- `${publish.lastVersionPublished}`: Evaluates to the last version published to `npm` or blank when nothing has been published yet.
- `${publish.lastVersion}`: Evaluates to the last version published to `npm` or the current `package.version`when nothing has been published yet.
- `${publish.moduleURL}`: Evaluates to the `homepage` in `package.json`, but will also remove any _hashes_ in the URL (e.g. assuming a `homepage` of `https://example.com/username/module#readme` would become `https://example.com/username/module`).
- `${publish.date}`: The current date string formatted as `YYYY-MM-DD`
- `${env}`: Evaluates to the `process.env` for `jspub` (e.g. `${env.GITHUB_TOKEN}`)

__NOTE:__ _Only_ placeholders within the `conf.opts` section will be evaluated

### Tutorials Markdown Extensions
For ease of use an additional markdown extension can be used throughout any of the tutorials _markdown_ to include `code` snippets from resource files. Let's say we want to include the configuration file located at `./jspub/conf.json`. This can be accomplish by adding a special `jspub` _fenced code block_ to the markdown in any of the tutorials:
<pre>
````jspub ./some/path/to/file.js
// file.js contents below
````
</pre>
Which would be parsed into the following assuming that `fileFunction` is the contents of `./some/path/to/file.js`:
<pre>
```js
// file.js contents below
function fileFunction() {
  console.log('my function');
}
```
</pre>

#### [Navigation Menu >>](tutorial-4-navs.html)