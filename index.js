"use strict";

const { exec } = require('child_process');
const Path = require('path');
const Fs = require('fs').promises;
const Os = require('os');
const tmpdir = Os.tmpdir();

// TODO : ESM remove the following lines...
module.exports = publicize;

/**
 * Generates the JSDoc style results along with previously published `npm` jsdoc by version. How doc versions are displayed in the
 * end result are customizable via the described _options_. A customizable changelog is also generated that contains filtered commit
 * messages since the last tagging of the `git` repository where the package resides.
 * ### Immutable Configuration Options:
 * The configuration options documented here only contain add-on options for JSDoc. See the JSDoc documentation for the full list of
 * configuration options. There are however a few configuration options that cannot be overridden. They include:
 * - `conf.templates.default.layoutFile`: Set to the internal layout file used during execution.
 * 
 * ### Template Requirements:
 * `conf.opts.template` should reference a path to the actual JSDoc template being used (e.g. `./node_modules/minami` would be valid
 * assuming that the `minami` template module is installed).
 * ### Template Literals:
 * All of the add-on configuration values can also contain template literals (i.e. `${}`) that reference paths within the following objects:
 * - `${package}`: The `package.json` object followed by any of it's properties (e.g. `${package.repository.url}/README.md`).
 * - `${publish.lastVersionPublished}`: Will evaluate to the last version published to `npm` or blank when nothing has been published yet.
 * - `${publish.lastVersion}`: Will evaluate to the last version published to `npm` or the current `package.version`when nothing has been published yet.
 * - `${publish.moduleURL}`: Will basically evaluate to the `homepage` in `package.json`, but will also remove any _hashes_ in the URL (e.g.
 * assuming a `homepage` of `https://example.com/username/module#readme` would become `https://example.com/username/module`).
 * - `${publish.date}`: The current date string formatted as `YYYY-MM-DD`
 * 
 * #### See documentation for default values that are ported over from `jspub/jsdoc-defaults.conf`
 * @async
 * @param {(String|Object)} conf Either the path to the JSDoc configuration file or the actual JSDoc configuration itself.
 * @param {Object} [conf.opts] The JSDoc options with some added options
 * @param {Object} [conf.opts.versions] The versions options used to generate links to previously published version docs
 * @param {String} [conf.opts.versions.from] A Semantic Versioning compliant version that designates the first version to show
 * in the version drop-down selection for different docs (omit to list all of them)
 * @param {String} [conf.opts.versions.include] A designation that inidcates what doc versions to show in the drop-down selection.
 * A designation of `major` will only show versions that have been released for __major___ version tags (i.e. the _first_
 * number in the version). A designation of `minor` will only show versions that have been released for __minor__ version
 * tags (i.e. the _second_ number in the version). `undefined` will cause the default value to be used. Any other value, or blank value will cause
 * all versions to be included.
 * @param {Object} [conf.opts.changelog] The change log options used to generate the change log file and link
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
 * @param {Object} [conf.opts.pages] The options for the generated pages
 * @param {Object} [conf.opts.pages.menu] The options for the generated pages top naviagation menu
 * @param {String} [conf.opts.pages.menu.icon] The icon `src` used in the main menu `img`
 * @param {String} [conf.opts.pages.menu.style] The `style` applied to the main menu
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

  // TODO : require the markdown extension plugin?
  //conf.plugins = conf.plugins || [];
  //if (!conf.plugins.includes('plugins/markdown')) conf.plugins.push('plugins/markdown');

  // need the following
  conf.templates = conf.templates || {};
  conf.templates.default = conf.templates.default || {};

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
        await mergeLayout(conf, modulePath, jspubPath, jspubTmpdir);

        // set private meta after merge takes place
        // private since versions could be published after the current versions is published
        // should be captured on the client to get the latest copy at the root dir
        meta.publish.versions = versions;

        // write require files/dirs
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
 * Merges the various `layout.tmpl` parts
 * @private
 * @async
 * @param {Object} conf The module JSDoc configuration
 * @param {String} modulePath The JSDoc configuration path
 * @param {String} jspubPath The path to the `jspub` module
 * @param {String} jspubTmpdir The temporary working directory where the parsed layout will be saved/set to
 */
async function mergeLayout(conf, modulePath, jspubPath, jspubTmpdir) {
  var lyt, mdlPath;
  if (conf.templates.default.layoutFile) {
    mdlPath = Path.resolve(modulePath, conf.templates.default.layoutFile);
  } else {
    mdlPath = Path.resolve(modulePath, conf.opts.templateProxy, 'tmpl');
  }
  try {
    lyt = await Fs.stat(mdlPath);
    if (!lyt.isDirectory()) throw new Error(`Layout is not a valid directory: ${mdlPath} stats: ${JSON.stringify(lyt)}`);
  } catch (err) {
    var error = err, mdlAltPath;
    try {
      if (!conf.templates.default.layoutFile) {
        mdlAltPath = Path.resolve(modulePath, conf.opts.templateProxy, 'template');
        lyt = await Fs.stat(mdlAltPath);
        if (!lyt.isDirectory()) throw new Error(`Layout is not a valid directory: ${mdlAltPath} stats: ${JSON.stringify(lyt)}`);
        error = null;
      }
    } catch (altErr) {
      error = altErr;
    }
    if (!error && !lyt) error = new Error('Empty layout');
    if (error) {
      error.message += ` (Unable to resolve tempalte layout for either "${mdlPath}"${mdlAltPath ? ` or ${mdlAltPath}`: ''})`;
      error.conf = conf;
      throw error;
    }
    mdlPath = mdlAltPath;
  }
  mdlPath = Path.resolve(mdlPath, 'layout.tmpl');
  try {
    lyt = (await Fs.readFile(mdlPath)).toString();
  } catch (err) {
    err.message += ` (Unable to find template at "${mdlPath}")`;
    err.conf = conf;
    throw err;
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
  lyt = lyt.replace(/(<\s*head[^>]*>)([\s\S]*?)(<\s*\/\s*head>)/ig, (mtch, open, content, close) =>  {
    return `${open}${content}${hd}${close}`;
  }).replace(/(<\s*body[^>]*>)([\s\S]*?)(<\s*\/\s*body>)/ig, (mtch, open, content, close) => {
    return `${open}${nv}${content}${ft}${close}`;
  });
  
  // write/set merged layout file
  conf.templates.default.layoutFile = Path.resolve(jspubTmpdir, 'layout.tmpl');
  return Fs.writeFile(conf.templates.default.layoutFile, lyt);
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
      if (!(rtn instanceof Array)) rtn = [];
      rtn = [...rtn, ...src];
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