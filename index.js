"use strict";

const { exec } = require('child_process');
const Path = require('path');
const Fs = require('fs').promises;
const Os = require('os');
const tmpdir = Os.tmpdir();

// TODO : ESM remove the following lines...
module.exports = publicize;

/**
 * Generates the JSDoc style results using any number of [template providers](https://github.com/jsdoc3/jsdoc#templates-and-tools). See [`README`](index.html)
 * for more details.
 * #### See [Getting Started]{@tutorial 1-start} documentation for default values that are ported over from `jsdoc-defaults.conf`
 * @async
 * @param {(String|Object)} conf Either the path to the JSDoc configuration file or the actual JSDoc configuration itself.
 * @param {Object} [conf.opts] The JSDoc options with some added options
 * @param {Object} [conf.opts.versions] The versions options used to generate links to previously published version docs
 * @param {String} [conf.opts.versions.from] A Semantic Versioning compliant version that designates the first version to show
 * in the version drop-down selection for different docs (omit to list all of them)
 * @param {String} [conf.opts.versions.type] A designation that inidcates what doc versions to show in the drop-down selection.
 * A designation of `major` will only show versions that have been released for __major___ version tags (i.e. the _first_
 * number in the version). A designation of `minor` will only show versions that have been released for __minor__ version
 * tags (i.e. the _second_ number in the version). `undefined` will cause the default value to be used. Any other value, or blank value will cause
 * all versions to be included.
 * @param {Object} [conf.opts.changelog] The change log options used to generate the change log file and link
 * @param {Object} [conf.opts.changelog.title] The change log page `title` of the generated HTML page
 * @param {String} [conf.opts.changelog.line] The _format_ for individual commit lines produced in the change log markdown.
 * @param {String} [conf.opts.changelog.header] The markdown that will be pre-pended to the change log.
 * @param {Object} [conf.opts.changelog.sections] The sections within the change log which organize changes (omit output a list without sections)
 * @param {String} [conf.opts.changelog.sections.breaks] Section options for breaking changes
 * @param {String} [conf.opts.changelog.sections.breaks.header] Markdown used as a _header_ when there are change log entries for breaking changes
 * @param {String} [conf.opts.changelog.sections.breaks.grep] Section `grep` options for breaking changes
 * @param {String} [conf.opts.changelog.sections.breaks.grep.regexp] The regular expression used as filter in the `git log -grep=` for breaking changes
 * @param {String} [conf.opts.changelog.sections.breaks.grep.ignoreCase] `true` for case-insensitive `git log -i` for breaking changes
 * @param {String} [conf.opts.changelog.sections.breaks.grep.extendedRegexp] `true` for _extended_ regular expressions `git log -E` for breaking changes
 * @param {String} [conf.opts.changelog.sections.breaks.grep.allMatch] `true` to limit all regular expressions in the `grep` for breaking changes
 * @param {String} [conf.opts.changelog.sections.features] Section options for features
 * @param {String} [conf.opts.changelog.sections.features.header] Markdown used as a _header_ when there are change log entries for features
 * @param {String} [conf.opts.changelog.sections.features.grep] Section `grep` options for features
 * @param {String} [conf.opts.changelog.sections.features.grep.regexp] The regular expression used used as filter in the `git log -grep=` for features
 * @param {String} [conf.opts.changelog.sections.features.grep.ignoreCase] `true` for case-insensitive `git log -i` for features
 * @param {String} [conf.opts.changelog.sections.features.grep.extendedRegexp] `true` for _extended_ regular expressions `git log -E` for features
 * @param {String} [conf.opts.changelog.sections.features.grep.allMatch] `true` to limit all regular expressions in the `grep` for features
 * @param {String} [conf.opts.changelog.sections.fixes] Section options for features
 * @param {String} [conf.opts.changelog.sections.fixes.header] Markdown used as a _header_ when there are change log entries for fixes
 * @param {String} [conf.opts.changelog.sections.fixes.grep] Section `grep` options for fixes
 * @param {String} [conf.opts.changelog.sections.fixes.grep.regexp] The regular expression used used as filter in the `git log -grep=` for fixes
 * @param {String} [conf.opts.changelog.sections.fixes.grep.ignoreCase] `true` for case-insensitive `git log -i` for fixes
 * @param {String} [conf.opts.changelog.sections.fixes.grep.extendedRegexp] `true` for _extended_ regular expressions `git log -E` for fixes
 * @param {String} [conf.opts.changelog.sections.fixes.grep.allMatch] `true` to limit all regular expressions in the `grep` for fixes
 * @param {String} [conf.opts.changelog.sections.merges] Section options for merged/pull requests
 * @param {String} [conf.opts.changelog.sections.merges.header] Markdown used as a _header_ when there are change log entries for merges
 * @param {String} [conf.opts.changelog.sections.merges.grep] Section `grep` options for merges
 * @param {String} [conf.opts.changelog.sections.merges.grep.regexp] The regular expression used used as filter in the `git log -grep=` for merges
 * @param {String} [conf.opts.changelog.sections.merges.grep.ignoreCase] `true` for case-insensitive `git log -i` for merges
 * @param {String} [conf.opts.changelog.sections.merges.grep.extendedRegexp] `true` for _extended_ regular expressions `git log -E` for merges
 * @param {String} [conf.opts.changelog.sections.merges.grep.allMatch] `true` to limit all regular expressions in the `grep` for merges
 * @param {Object} [conf.opts.pages] The options for the generated pages
 * @param {Object} [conf.opts.pages.menu] The options for the generated pages naviagation menu
 * @param {String} [conf.opts.pages.menu.className] The CSS class applied to the main menu
 * @param {Object} [conf.opts.pages.menu.logo] The options for the logo displayed in the navigation menu
 * @param {String} [conf.opts.pages.menu.logo.src] The source URL for the logo icon dsiplayed in the navigation menu (if not overridden by `inlineSvgPath`)
 * @param {String} [conf.opts.pages.menu.logo.inlineSvgPath] A path to an `svg` logo that will be inserted inline within the navigation menu display. Will
 * override the logo `src`, but if present will fall back on the `src` when the `svg` content cannot be extracted.
 * @param {String} [conf.opts.pages.menu.logo.anchorclassName] The CSS class name assigned to the logo icon's anchor tag
 * @param {String} [conf.opts.pages.menu.logo.className] The CSS class name assigned to the logo icon loaded from the `src`
 * @param {Boolean} [conf.opts.pages.menu.logo.inline] `true` when using an `svg` source and it's content should be displayed inline (allows for flexible
 * styling of the `svg` content)
 * @param {String} [conf.opts.pages.menu.package] The `src` used on the `img` in the navigation menu that links to the `npm` package (omit to use the
 * default icon or set to `none` to hide the icon)
 * @param {String} [conf.opts.pages.menu.changelog] The `src` used on the `img` in the navigation menu that links to the `CHANGELOG` for the current
 * version (omit to use the default icon or set to `none` to hide the icon)
 * @param {String} [conf.opts.pages.menu.sourceCode] The `src` used on the `img` in the navigation menu that links to the souce code (omit to use the
 * default icon or set to `none` to hide the icon)
 * @param {Object} [conf.opts.pages.menu.icons] The package, change log and source code icon options
 * @param {String} [conf.opts.pages.menu.icons.className] The CSS class name applied to the package, change log and source code icon options
 * @param {Object[]} [conf.opts.pages.links] The definitions used to generate `link` tags in the `head` element. Each object can have any number of
 * properties/values that will get translated to an attribute on the `link` tag matching the property name and an attribute value for the value.
 * @param {Object[]} [conf.opts.pages.metas] The definitions used to generate `meta` tags in the `head` element. Each object can have any number of
 * properties/values that will get translated to an attribute on the `meta` tag matching the property name and an attribute value for the value.
 * @param {Object[]} [conf.opts.pages.scripts] The definitions used to generate `script` tags in the `head` element. Each object can have any number of
 * properties/values that will get translated to an attribute on the `script` tag matching the property name and an attribute value for the value.
 * @param {Object} [conf.opts.layoutFrags] The layout fragments used. __Typically, none of the fragment values will be overridden since they are handled
 * internally__
 * @param {String} [conf.opts.layoutFrags.head] The path to the template fragment that will be inserted at the __end__ of the `head` section
 * @param {String} [conf.opts.layoutFrags.nav] The path to the template fragment that will be inserted at the __beginning__ of the `body` section
 * @param {String} [conf.opts.layoutFrags.foot] The path to the template fragment that will be inserted at the __end__ of the `body` section
 * @param {String[]} [conf.opts.layoutFrags.layoutCheckTemplateDirs] The directories that the required `conf.templates.default.layoutFile` will be
 * searched for in the order they are defined. Unfortunately, template implementations may store the `conf.templates.default.layoutFile` in different
 * locations. By default, the most likley/typlical directories will be checked.
 * @param {Boolean} [deploy] `true` to deploy via `git` after publication
 * @returns {Boolean} `true` when completed successfully
 */
async function publicize(conf, deploy) {
// TODO : ESM use... export function generateDocs(conf) {

  const modulePath = Path.normalize(process.env.INIT_CWD || process.env.PWD); // npm run dir or proccess dir
  const mwd = Path.parse(modulePath);
  const jspubPath = mwd.name === 'jspub' ? modulePath : Path.resolve(modulePath, 'node_modules/jspub');
  const jspubConfPath = Path.resolve(jspubPath, 'jsdoc/jsdoc-defaults.json');
  const jsdocPath = Path.resolve(modulePath, 'node_modules/jsdoc');
  const jsdocCliPath = Path.resolve(modulePath, 'node_modules/.bin/jsdoc');

  var moduleConf, jspubTmpdir = await Fs.mkdtemp(`${tmpdir}${Path.sep}`), tempConfPath = Path.resolve(jspubTmpdir, 'jsdoc.json');
  // publishing runs in a separate process and requires a path
  if (typeof conf === 'object') {
    moduleConf = conf;
  } else {
    const confPath = Path.resolve(modulePath, conf);
    moduleConf = JSON.parse((await Fs.readFile(confPath)).toString());
  }
  const meta = await writeConf(moduleConf, modulePath, jspubPath, jspubConfPath, tempConfPath, jspubTmpdir);
  
  const execOpts = {
    env: {
      JSDOC_PATH: jsdocPath,
      JSPUB_MODULE_PATH: modulePath,
      JSPUB_TMPDIR: jspubTmpdir,
      JSPUB_CONF_PATH: tempConfPath,
      JSPUB_PATH: jspubPath,
      JSPUB_LAYOUT_PATH: meta.layout.path,
      JSPUB_PUBLISH_VERSIONS: meta.publish.versions,
      JSPUB_PUBLISH_LAST_VER_PUB: meta.publish.lastVersionPublished,
      JSPUB_PUBLISH_LAST_VER: meta.publish.lastVersion,
      JSPUB_PUBLISH_MODULE_URL: meta.publish.moduleURL,
      JSPUB_PUBLISH_DATE: meta.publish.date
    },
    cwd: modulePath,
    timeout: 30000
  };
  if (process.env.Path) execOpts.env.Path = process.env.Path;
  if (process.env.PATH) execOpts.env.PATH = process.env.PATH;
  return new Promise((resolve, reject) => {
    const jsdocExec = `${jsdocCliPath} -c "${tempConfPath}" --verbose`;
    const jsdoc = exec(jsdocExec, execOpts);
    jsdoc.stdout.pipe(process.stdout);
    jsdoc.stderr.pipe(process.stderr);
    jsdoc.on('error', error => reject(error));
    jsdoc.on('exit', (code, signal) => {
      if (code !== 0) return reject(new Error(`jsdoc exited with code: ${code}${signal ? ` signal: ${signal}` : ''}`));
      if (deploy && conf.opts.deploy) {
        console.log('Deploying pages...');
        const deployCliPath = Path.resolve(jspubPath, 'deploy/.git_pages');
        const deploy = exec(`bash ${deployCliPath} "${tempConfPath}" --verbose`, execOpts);
        console.log(` exited with code: ${code}${signal ? ` signal: ${signal}` : ''}`);
      } else resolve(true);
    });
  });
}

/**
 * Sanitizes JSDoc configuration options in order for publishing to take place
 * @private
 * @async
 * @param {Object} conf The JSDoc configuration
 * @param {String} modulePath The path to the module that the configuration is for
 * @param {String} jspubPath The path to the `jspub` module
 * @param {String} jspubConfPath The path to the `jspub` JSON file that contains the default configuration options
 * @param {String} tempConfPath The path where the sanitized JSDoc configuration options will be written
 * @param {String} jspubTmpdir The temporary working directory
 * @returns {Object} The _meta_ object that contains the `package` and `publish` objects defined in {@link publicize};
 */
async function writeConf(conf, modulePath, jspubPath, jspubConfPath, tempConfPath, jspubTmpdir) {
  if (!conf.opts || !conf.opts.template) {
    const error = new Error('JSDoc configuration options must contain an "opts.template" property set to a path '
    + 'to a JSDoc template that will be used. For example, if "minami" is the template it should be a package '
    + '"devDependencies" and opts.template = "./node_modules/minami". See JSDoc configuration for more details.');
    error.conf = conf;
    throw error;
  }

  const jpConf = JSON.parse((await Fs.readFile(jspubConfPath)).toString());

  // template needs to be set to the internal template so it can be proxied
  conf.opts.templateProxy = conf.opts.template;
  conf.opts.template = Path.resolve(jspubPath, jpConf.opts.template);

  // make sure default plugins are included
  conf.plugins = conf.plugins || [];
  if (!conf.plugins) conf.plugins = jpConf.plugins;
  else if (jpConf.plugins) conf.plugins = [...new Set(jpConf.plugins.concat(...conf.plugins))];

  // need the following
  conf.templates = conf.templates || {};
  conf.templates.default = conf.templates.default || {};
  conf.templates.default.layoutFile = conf.templates.default.layoutFile || jpConf.templates.default.layoutFile;

  // ensure include contains the include from jspub
  conf.templates.default.staticFiles = conf.templates.default.staticFiles || {};
  const incls = conf.templates.default.staticFiles.include;
  const jpIncls = jpConf.templates.default.staticFiles.include;
  for (let i = 0; i < jpIncls.length; i++) jpIncls[i] = Path.resolve(jspubPath, jpIncls[i]);
  conf.templates.default.staticFiles.include = Array.isArray(incls) ? jpIncls.concat(incls) : jpIncls;

  // add the static files required by the jspub
  const tmplStaticPath = Path.resolve(conf.opts.template, 'static');
  conf.templates.default.staticFiles.include.push(tmplStaticPath);

  // parse package, capture/write versions and sanitize/write temp conf
  const pkgPath = Path.resolve(modulePath, 'package.json'), pkg = JSON.parse((await Fs.readFile(pkgPath)).toString());
  return new Promise((resolve, reject) => {
    exec(`npm view ${pkg.name} versions --json`, async (error, stdout, stderr) => {
      try {
        // need to account for first-time publish where module does not exist in npm
        const versions = (!error && !stderr && stdout) || '[]', latestVersion = JSON.parse(versions).pop() || '';
        const meta = {
          package: pkg,
          publish: {
            lastVersionPublished: latestVersion || '',
            lastVersion: latestVersion || pkg.version,
            moduleURL: pkg.homepage.replace(/#[^\/]*/g, ''),
            date: formatedDate()
          }
        };
        // for template liternals purposes only: make sure any ${package.author.name}, etc. don't get set to undefined
        if (typeof meta.package.author !== 'object') meta.package.author = { name: meta.package.author, email: '' };

        // ensure the default opts are set when missing
        conf.opts = merge(jpConf.opts, conf.opts);
        // replace any template literals in the conf
        template(conf, meta);

        // merge layout parts
        await mergeLayout(conf, meta, modulePath, jspubPath, jspubTmpdir);

        // set private meta after merge takes place
        // private since versions could be published after the current versions is published
        // should be captured on the client to get the latest copy at the root dir
        meta.publish.versions = versions;

        // write require files/dirs
        console.log(`Writting compiled configuration: ${tempConfPath}`);
        const wrConfProm = Fs.writeFile(tempConfPath, JSON.stringify(conf));
        try {
          await wrConfProm;
        } catch (err) {
          err.message += ` (Unable to write ${tempConfPath})`;
          return reject(err);
        }
        resolve(meta);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Merges the various layout template parts
 * @private
 * @async
 * @param {Object} conf The module JSDoc configuration
 * @param {Object} meta The meta where the `layout` will be stored
 * @param {String} modulePath The JSDoc configuration path
 * @param {String} jspubPath The path to the `jspub` module
 * @param {String} jspubTmpdir The temporary working directory where the parsed layout will be saved/set to
 */
async function mergeLayout(conf, meta, modulePath, jspubPath, jspubTmpdir) {
  // paths should be added from deepest to shallow
  const dirs = conf.opts.layoutCheckTemplateDirs, base = Path.resolve(modulePath, conf.opts.templateProxy);
  const lyt = await getLayout(dirs, conf.templates.default.layoutFile, base);
  if (lyt.errors.length && (!lyt.path || !lyt.content)) {
    const error = lyt.errors.pop();
    error.message += ` (Unable to resolve tempalte layout. Checked the following paths under "${base}": ${dirs.join(', ')})`;
    error.conf = conf;
    throw error;
  }

  // extract jspub template fragments
  var hd, nv, ft, error;
  const hdPath = Path.resolve(jspubPath, conf.opts.layoutFrags.head), nvPath = Path.resolve(jspubPath, conf.opts.layoutFrags.nav);
  const ftPath = Path.resolve(jspubPath, conf.opts.layoutFrags.foot);
  var error;
  try {
    hd = (await Fs.readFile(hdPath)).toString();
  } catch (err) {
    err.message += ` (Unable to find opts.layoutFrags.head at "${hdPath}")`;
    err.conf = conf;
    error = err;
    error.head = err;
  }
  try {
    nv = (await Fs.readFile(nvPath)).toString();
  } catch (err) {
    err.message += ` (Unable to find opts.layoutFrags.nav at "${nvPath}")`;
    err.conf = conf;
    if (error) error.nav = err;
    else error = err;
  }
  try {
    ft = (await Fs.readFile(ftPath)).toString();
  } catch (err) {
    err.message += ` (Unable to find opts.layoutFrags.foot at "${ftPath}")`;
    err.conf = conf;
    if (error) error.foot = err;
    else error = err;
  }
  if (error) throw error;
  conf.opts.layoutFrags.head = hdPath;
  conf.opts.layoutFrags.nav = nvPath;
  conf.opts.layoutFrags.foot = ftPath;
  // merge the template layout with the jspub layout
  lyt.content = lyt.content.replace(/(<\s*head[^>]*>)([\s\S]*?)(<\s*\/\s*head>)/ig, (mtch, open, content, close) =>  {
    return `${open}${content}${hd}${close}`;
  }).replace(/(<\s*body[^>]*>)([\s\S]*?)(<\s*\/\s*body>)/ig, (mtch, open, content, close) => {
    return `${open}${nv}${content}${ft}${close}`;
  });
  meta.layout = { path: lyt.path, content: lyt.content };
  
  // write/set merged layout file
  conf.templates.default.layoutFile = Path.resolve(jspubTmpdir, 'layout.tmpl');
  return Fs.writeFile(conf.templates.default.layoutFile, lyt.content);
}

/**
 * Searches for a layout template in the specified directories in the order they were added. The first diectory that contains
 * the file name will be read and returned.
 * @private
 * @async
 * @param {String[]} dirs The directory paths to check if the `fileName`
 * @param {String} fileName The file name that will be checked/read from (using the directory entry from `dirs`)
 * @param {String} [base] The base path that will be resolved for each of the directories
 * @returns {Object} `{ errors: [], path: 'path/to/the/layout.tmpl', content: 'the layout content here' }`
 */
async function getLayout(dirs, fileName, base) {
  const rtn = { errors: [] };
  if (base) dirs = [ ...dirs, '.' ]; // include the base in the search
  var lyt;
  for (let dir of dirs) {
    try {
      if (base) dir = Path.resolve(base, dir);
      lyt = await Fs.stat(dir);
      if (!lyt.isDirectory()) {
        errors.push(new Error(`Layout is not a valid directory: ${dir} stats: ${JSON.stringify(lyt)}`));
        continue;
      }
      rtn.path = Path.resolve(dir, fileName);;
      try {
        rtn.content = (await Fs.readFile(rtn.path)).toString();
      } catch (err) {
        err.message += ` (Unable to find layout template at "${rtn.path}")`;
        errors.push(err);
        rtn.path = '';
        continue;
      }
      return rtn;
    } catch (err) {
      err.message += ` (Unexpected error while looking for layout template at: ${dir})`;
      rtn.errors.push(err);
    }
  }
  return rtn;
}

/**
 * Performs a __deep__ merge on one or more sources. The result is similar to `Object.assign` or `{ ...src1, ... src2 }`,
 * but retains the accumulated property values expected during a _deep_ merge.
 * @private
 * @ignore
 * @param {...any} srcs The sources that will be merged
 * @returns {*} The merged entity
 */
function merge(...srcs) {
  let rtn = {};
  for (const src of srcs) {
    if (src instanceof Array) {
      if (!(rtn instanceof Array)) rtn = [...src];
      else rtn = [...rtn, ...src];
    } else if (src instanceof Object) {
      for (let [key, value] of Object.entries(src)) {
        if (value instanceof Object && key in rtn) value = merge(rtn[key], value);
        rtn = { ...rtn, [key]: value };
      }
    }
  }
  return rtn;
}

/**
 * Processes any template strings into {@link literal} values using the source for path resolution
 * @private
 * @param {Object} dest The destination object where the properties will be evaluated
 * @param {Object} src The source object that will be used to replace tempalted references with
 * @returns {*} The destination
 */
function template(dest, src) {
  if (dest instanceof Array) {
    for (let i = 0, ln = dest.length; i < ln; i++) {
      var dtyp = dest[i] ? typeof dest[i] : '';
      if (dtyp === 'object') dest[i] = template(dest[i], src);
      else if (dtyp === 'string') dest[i] = literal(dest[i], src);
    }
  } else if (dest instanceof Object) {
    for (let [key, value] of Object.entries(dest)) {
      if (value instanceof Object) dest[key] = template(value, src);
      else if (value && typeof value === 'string') dest[key] = literal(value, src);
    }
  }
  return dest;
} 

/**
 * Replaces each `${}` that contains `.` delimited paths to values within a supplied object
 * (e.g. `Testing ${someObject.someValue}` using object `{ someObject: { sameValue: 123 }}`
 * results in `Testing 123`
 * @private
 * @param {String} str The templated string to perform the replacements on
 * @param {Object} obj The object where values will be extracted from
 * @returns {String} The parsed template string
 */
function literal(str, obj) {
  return str.replace(/\$\{([^\}]*)\}/g, (mtch, path) => {
    var paths = path.split('.'), val = obj;
    if (!paths.length) return mtch;
    for (let i = 0, ln = paths.length; i < ln; i++) {
      if (i < ln - 1 && !val.hasOwnProperty(paths[i])) return mtch;
      val = val[paths[i]];
    }
    return val;
  });
}

/**
 * Generates a formatted date string
 * @private
 * @ignore
 * @param {Date} [date=new Date()] The date to format
 * @param {String} [delimiter='-'] The date delimiter
 * @returns {String} The formmated date 
 */
function formatedDate(date, delimiter = '-') {
  date = date || new Date();
  return `${date.getFullYear()}${delimiter}${('0' + (date.getMonth() + 1)).slice(-2)}${delimiter}${('0' + date.getDate()).slice(-2)}`;
}