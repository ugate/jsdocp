"use strict";


// TODO : ESM remove the following lines...
const { exec } = require('child_process');
const Path = require('path');
const Fs = require('fs').promises;
const Os = require('os');
const tmpdir = Os.tmpdir();

module.exports = publicize;

// TODO : ESM uncomment the following lines...
// import { exec } from 'child_process';
// import Path from 'path';
// import { promises } as Fs from 'fs';
// import Os from 'os';
// const tmpdir = Os.tmpdir();

/**
 * Generates the JSDoc style results using any number of [template providers](https://github.com/jsdoc3/jsdoc#templates-and-tools). See [`README`](index.html)
 * for more details.
 * #### See [Getting Started]{@tutorial 1-start} documentation for default values that are ported over from `jsdoc-defaults.conf`
 * @async
 * @param {(String|Conf)} conf Either the path to the JSDoc configuration file or the actual JSDoc configuration itself.
 * @param {Boolean} [deploy=false] `true` to deploy via `git` after generating documentation
 * @param {Integer} [timeout=30000] The number of milliseconds before timing out for each underlying execution
 * @returns {Boolean} `true` when completed successfully
 */
async function publicize(conf, deploy = false, timeout = 30000) {
// TODO : ESM use... export async function publicize(conf, deploy) {
  const modulePath = Path.normalize(process.env.INIT_CWD || process.env.PWD); // npm run dir or proccess dir
  const pkgPath = Path.resolve(modulePath, 'package.json'), pkg = JSON.parse((await Fs.readFile(pkgPath)).toString());
  const jsdocpPath = pkg.name === 'jsdocp' ? modulePath : Path.resolve(modulePath, 'node_modules/jsdocp');
  const jsdocpConfPath = Path.resolve(jsdocpPath, 'jsdoc/jsdoc-defaults.json');
  const jsdocPath = Path.resolve(modulePath, 'node_modules/jsdoc');
  const jsdocCliPath = Path.resolve(modulePath, 'node_modules/.bin/jsdoc');

  /** @type {Conf} */
  let moduleConf;
  let jsdocpTmpdir = await Fs.mkdtemp(`${tmpdir}${Path.sep}`), tempConfPath = Path.resolve(jsdocpTmpdir, 'jsdoc.json');
  // publishing runs in a separate process and requires a path
  if (typeof conf === 'object') {
    moduleConf = conf;
  } else {
    const confPath = Path.resolve(modulePath, conf);
    moduleConf = JSON.parse((await Fs.readFile(confPath)).toString());
  }
  const meta = await writeConf(pkg, moduleConf, modulePath, jsdocpPath, jsdocpConfPath, tempConfPath, jsdocpTmpdir);
  
  const execOpts = {
    env: {
      JSDOC_PATH: jsdocPath,
      JSDOCP_MODULE_PATH: modulePath,
      JSDOCP_TMPDIR: jsdocpTmpdir,
      JSDOCP_CONF_PATH: tempConfPath,
      JSDOCP_PATH: jsdocpPath,
      JSDOCP_LAYOUT_PATH: meta.layout.path,
      JSDOCP_PUBLISH_VERSIONS: meta.publish.versions,
      JSDOCP_PUBLISH_LAST_VER_PUB: meta.publish.lastVersionPublished,
      JSDOCP_PUBLISH_LAST_VER: meta.publish.lastVersion,
      JSDOCP_PUBLISH_MODULE_URL: meta.publish.moduleURL,
      JSDOCP_PUBLISH_DATE: meta.publish.date
    },
    cwd: modulePath,
    timeout
  };
  if (process.env.Path) execOpts.env.Path = process.env.Path;
  if (process.env.PATH) execOpts.env.PATH = process.env.PATH;
  return new Promise((resolve, reject) => {
    try {
      const jsdocExec = `${jsdocCliPath} -c "${tempConfPath}" --verbose`;
      const jsdoc = exec(jsdocExec, execOpts);
      jsdoc.stdout.pipe(process.stdout);
      jsdoc.stderr.pipe(process.stderr);
      jsdoc.on('error', error => reject(error));
      jsdoc.on('exit', (code, signal) => {
        const conf = moduleConf;
        if (code !== 0) return reject(new Error(`jsdoc exited with code: ${code}${signal ? ` signal: ${signal}` : ''}`));
        if (deploy && !conf.opts.jsdocp.deploy) return reject(new Error(`Deployment flagged for execution, but no "opts.deploy" settings are defined`));
        if (deploy) deployer(resolve, reject, conf, pkg, modulePath, jsdocpPath, timeout);
        else resolve(true);
      });
    } catch (err) {
      err.message += ` (Failed to execute jsdoc)`;
      err.conf = conf;
      reject(err);
    }
  });
}

/**
 * Sanitizes JSDoc configuration options in order for publishing to take place
 * @private
 * @async
 * @param {Object} pkg The parsed `package.json`
 * @param {Conf} conf The JSDoc configuration
 * @param {String} modulePath The path to the module that the configuration is for
 * @param {String} jsdocpPath The path to the `jsdocp` module
 * @param {String} jsdocpConfPath The path to the `jsdocp` JSON file that contains the default configuration options
 * @param {String} tempConfPath The path where the sanitized JSDoc configuration options will be written
 * @param {String} jsdocpTmpdir The temporary working directory
 * @returns {Object} The _meta_ object that contains the `package` and `publish` objects defined in {@link publicize};
 */
async function writeConf(pkg, conf, modulePath, jsdocpPath, jsdocpConfPath, tempConfPath, jsdocpTmpdir) {
  if (!conf.opts || !conf.opts.template) {
    const error = new Error('JSDoc configuration options must contain an "opts.template" property set to a path '
    + 'to a JSDoc template that will be used. For example, if "minami" is the template it should be a package '
    + '"devDependencies" and opts.template = "./node_modules/minami". See JSDoc configuration for more details.');
    error.conf = conf;
    throw error;
  }

  /** @type {Conf} */
  const jpConf = JSON.parse((await Fs.readFile(jsdocpConfPath)).toString());

  // template needs to be set to the internal template so it can be proxied
  conf.opts.jsdocp.templateProxy = Path.resolve(modulePath, conf.opts.template);
  conf.opts.template = Path.resolve(modulePath, sanitizePath(pkg, jpConf.opts.template));

  // make sure default plugins are included
  const intersectionPluginPath = Path.resolve(jsdocpPath, 'plugins', 'intersection.js');
  conf.plugins = conf.plugins || [];
  if (!conf.plugins) conf.plugins = jpConf.plugins;
  else if (jpConf.plugins) conf.plugins = [...new Set(jpConf.plugins.concat(intersectionPluginPath, ...conf.plugins))];

  // need the following
  conf.templates = conf.templates || {};
  conf.templates.default = conf.templates.default || {};
  conf.templates.default.layoutFile = conf.templates.default.layoutFile || jpConf.templates.default.layoutFile;

  // ensure include contains the include from jsdocp
  conf.templates.default.staticFiles = conf.templates.default.staticFiles || {};
  const incls = conf.templates.default.staticFiles.include;
  const jpIncls = jpConf.templates.default.staticFiles.include;
  for (let i = 0; i < jpIncls.length; i++) jpIncls[i] = Path.resolve(modulePath, sanitizePath(pkg, jpIncls[i]));
  conf.templates.default.staticFiles.include = Array.isArray(incls) ? jpIncls.concat(incls) : jpIncls;

  // add the static files required by the jsdocp
  const tmplStaticPath = Path.resolve(conf.opts.template, 'static');
  conf.templates.default.staticFiles.include.push(tmplStaticPath);

  // capture versions and sanitize/write temp conf
  return new Promise((resolve, reject) => {
    exec(`npm view ${pkg.name} versions --json`, async (error, stdout, stderr) => {
      try {
        // need to account for first-time publish where module does not exist in npm
        const versions = (!error && !stderr && JSON.parse(stdout)) || [], latestVersion = versions[versions.length - 1] || '';
        const meta = {
          package: pkg,
          publish: {
            lastVersionPublished: latestVersion || '',
            lastVersion: latestVersion || pkg.version,
            moduleURL: pkg.homepage.replace(/#[^\/]*/g, ''),
            date: formatedDate()
          },
          env: process.env
        };
        // for template liternals purposes only: make sure any ${package.author.name}, etc. don't get set to undefined
        if (typeof meta.package.author !== 'object') meta.package.author = { name: meta.package.author, email: '' };

        // ensure the default opts are set when missing
        conf.opts = merge(jpConf.opts, conf.opts);
        // replace any template literals in the conf
        template(conf, meta);

        // merge layout parts
        await mergeLayout(pkg, conf, meta, modulePath, jsdocpPath, jsdocpTmpdir);

        // set private meta after merge takes place
        // private since versions could be published after the current versions is published
        // should be captured on the client to get the latest copy at the root dir
        if (!versions.includes(pkg.version)) versions.push(pkg.version);
        meta.publish.versions = JSON.stringify(versions, 0);

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
 * @param {Object} pkg The parsed `package.json`
 * @param {Conf} conf The module JSDoc configuration
 * @param {Object} meta The meta where the `layout` will be stored
 * @param {String} modulePath The JSDoc configuration path
 * @param {String} jsdocpPath The path to the `jsdocp` module
 * @param {String} jsdocpTmpdir The temporary working directory where the parsed layout will be saved/set to
 */
async function mergeLayout(pkg, conf, meta, modulePath, jsdocpPath, jsdocpTmpdir) {
  // paths should be added from deepest to shallow
  const dirs = conf.opts.jsdocp.layoutCheckTemplateDirs, base = Path.resolve(modulePath, conf.opts.jsdocp.templateProxy);
  const lyt = await getLayout(dirs, conf.templates.default.layoutFile, base);
  if (lyt.errors.length && (!lyt.path || !lyt.content)) {
    const error = lyt.errors.pop();
    error.message += ` (Unable to resolve tempalte layout. Checked the following paths under "${base}": ${dirs.join(', ')})`;
    error.conf = conf;
    throw error;
  }

  // extract jsdocp template fragments (special case when generating jsdoc for jsdocp itself)
  var hd, nv, ft, error, tmplPath = pkg.name === 'jsdocp' ? jsdocpPath : modulePath;
  const hdPath = Path.resolve(tmplPath, sanitizePath(pkg, conf.opts.jsdocp.layoutFrags.head));
  const nvPath = Path.resolve(tmplPath, sanitizePath(pkg, conf.opts.jsdocp.layoutFrags.nav));
  const ftPath = Path.resolve(tmplPath, sanitizePath(pkg, conf.opts.jsdocp.layoutFrags.foot));
  var error;
  try {
    hd = (await Fs.readFile(hdPath)).toString();
  } catch (err) {
    err.message += ` (Unable to find conf.opts.jsdocp.layoutFrags.head at "${hdPath}")`;
    err.conf = conf;
    error = err;
    error.head = err;
  }
  try {
    nv = (await Fs.readFile(nvPath)).toString();
  } catch (err) {
    err.message += ` (Unable to find conf.opts.jsdocp.layoutFrags.nav at "${nvPath}")`;
    err.conf = conf;
    if (error) error.nav = err;
    else error = err;
  }
  try {
    ft = (await Fs.readFile(ftPath)).toString();
  } catch (err) {
    err.message += ` (Unable to find conf.opts.jsdocp.layoutFrags.foot at "${ftPath}")`;
    err.conf = conf;
    if (error) error.foot = err;
    else error = err;
  }
  if (error) throw error;
  conf.opts.jsdocp.layoutFrags.head = hdPath;
  conf.opts.jsdocp.layoutFrags.nav = nvPath;
  conf.opts.jsdocp.layoutFrags.foot = ftPath;
  // merge the template layout with the jsdocp layout
  lyt.content = lyt.content.replace(/(<\s*head[^>]*>)([\s\S]*?)(<\s*\/\s*head>)/ig, (mtch, open, content, close) =>  {
    return `${open}${content}${hd}${close}`;
  }).replace(/(<\s*body[^>]*>)([\s\S]*?)(<\s*\/\s*body>)/ig, (mtch, open, content, close) => {
    return `${open}${nv}${content}${ft}${close}`;
  });
  meta.layout = { path: lyt.path, content: lyt.content };
  
  // write/set merged layout file
  conf.templates.default.layoutFile = Path.resolve(jsdocpTmpdir, 'layout.tmpl');
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
 * Handles deploying documentation to a `git` branch
 * @private
 * @ignore
 * @param {Function} resolve The promise resolver
 * @param {Function} reject The promise rejector
 * @param {Conf} conf The `jsdoc` configuration
 * @param {Object} pkg The `package.json`
 * @param {String} modulePath The JSDoc configuration path
 * @param {String} jsdocpPath The path to the `jsdocp` module
 * @param {Integer} timeout The execution timeout in milliseconds
 */
function deployer(resolve, reject, conf, pkg, modulePath, jsdocpPath, timeout) {
  try {
    console.log(`Deploying v${pkg.version} pages...`);
    const deployCliPath = Path.resolve(jsdocpPath, 'deploy/.git_pages');
    const ver = sanitizeArg(`v${pkg.version}`), docPth = sanitizeArg(Path.resolve(modulePath, conf.opts.destination));
    const pubPth = sanitizeArg(Path.resolve(modulePath, conf.opts.jsdocp.deploy.path)), brch = sanitizeArg(conf.opts.jsdocp.deploy.branch);
    const host = sanitizeArg(conf.opts.jsdocp.deploy.host), usr = sanitizeArg(conf.opts.jsdocp.deploy.user.name);
    const email = sanitizeArg(conf.opts.jsdocp.deploy.user.email), msg = sanitizeArg(conf.opts.jsdocp.deploy.message, true);
    if (!brch) throw new Error('opts.jsdocp.deploy.branch is required');
    if (!host) throw new Error('opts.jsdocp.deploy.host is required');
    if (!usr) throw new Error('opts.jsdocp.deploy.user.name is required. Check that your package.json has an author.name'
      + ' or set a user name in your jsdoc configuration');
    if (!email) throw new Error('opts.jsdocp.deploy.user.email is required. Check that your package.json has an author.email'
      + ' or set an email in your jsdoc configuration');
    if (!msg) throw new Error('opts.jsdocp.deploy.message is required');

    process.env.PUB_PACKAGE_VERSION = ver;
    process.env.PUB_DOC_PATH = docPth;
    process.env.PUB_PATH = pubPth;
    process.env.PUB_BRANCH = brch;
    process.env.PUB_REPO_HOST = host;
    process.env.PUB_REPO_USER = pkg.author.name;
    process.env.PUB_REPO_NAME = pkg.name;
    process.env.PUB_USER = usr;
    process.env.PUB_EMAIL = email;
    process.env.PUB_MESSAGE = msg;

    const execOpts = { env: process.env, cwd: modulePath, timeout };
    const deployExec = `bash ${deployCliPath}`;
    const deploy = exec(deployExec, execOpts);
    deploy.stdout.pipe(process.stdout);
    deploy.stderr.pipe(process.stderr);
    deploy.on('error', error => reject(error));
    deploy.on('exit', (code, signal) => {
      if (code !== 0) return reject(new Error(`Deployment exited with code: ${code}${signal ? ` signal: ${signal}` : ''}`));
      resolve(true);
    });
  } catch (err) {
    err.message += ` (Failed to execute deployment)`;
    err.conf = conf;
    reject(err);
  }
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
    return typeof val === 'undefined' ? mtch : val;
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

/**
 * Sanitizes a path to accommodate `jsdocp` self documentation
 * @private
 * @ignore
 * @param {Object} pkg The parsed `package.json`
 * @param {String} path The path to sanitize
 * @returns {String} The sanitized path
 */
function sanitizePath(pkg, path) {
  return pkg.name === 'jsdocp' ? path.replace(/node_modules[\/\\]+jsdocp/ig, '') : path;
}

/**
 * Sanitizes a command line argument
 * @private
 * @ignore
 * @param {String} arg The argument to sanitize
 * @param {Boolean} [spaces] `true` allow spaces
 * @requires {String} The sanitized argument
 */
function sanitizeArg(arg, spaces) {
  const sarg = arg.replace(/[^\\]'|"/g, function (mtch) {
    return mtch.slice(0, 1) + '\\\'';
  });
  return spaces ? sarg : sarg.replace(/\s/g, '');
}

/**
 * The namespace used by {@link publicize} for the {@link Conf}
 * @namespace jsdocp
 */

/**
 * Section `grep` options
 * @typedef {Object} ChangeLogSectionGrep
 * @property {String} [regexp] The regular expression used as filter in the `git log -grep=`
 * @property {String} [ignoreCase] `true` for case-insensitive `git log -i`
 * @property {String} [extendedRegexp] `true` for _extended_ regular expressions `git log -E`
 * @property {String} [allMatch] `true` to limit all regular expressions in the `grep`
 * @memberof jsdocp
 */

/**
 * Section options for breaking changes
 * @typedef {Object} ChangeLogSectionBreak
 * @property {String} [header] Markdown used as a _header_ when there are change log entries for breaking changes
 * @property {ChangeLogSectionGrep} [grep] Section `grep` options for breaking changes
 * @memberof jsdocp
 */

/**
 * Section options for features
 * @typedef {Object} ChangeLogSectionFeatures
 * @property {String} [header] Markdown used as a _header_ when there are change log entries for features
 * @property {ChangeLogSectionGrep} [grep] Section `grep` options for features
 * @memberof jsdocp
 */

/**
 * Section options for fixes
 * @typedef {Object} ChangeLogSectionFixes
 * @property {String} [header] Markdown used as a _header_ when there are change log entries for fixes
 * @property {ChangeLogSectionGrep} [grep] Section `grep` options for fixes
 * @memberof jsdocp
 */

/**
 * Section options for merged/pull requests
 * @typedef {Object} ChangeLogSectionMerges
 * @property {String} [header] Markdown used as a _header_ when there are change log entries for merges
 * @property {ChangeLogSectionGrep} [grep] Section `grep` options for merges
 * @memberof jsdocp
 */

/**
 * The sections within the change log which organize changes (omit output a list without sections)
 * @typedef {Object} ChangeLogSections
 * @property {ChangeLogSectionBreak} [breaks] Section options for breaking changes
 * @property {ChangeLogSectionFeatures} [features] Section options for features
 * @property {ChangeLogSectionFixes} [fixes] Section options for fixes
 * @property {ChangeLogSectionMerges} [merges] Section options for merged/pull requests
 * @memberof jsdocp
 */

/**
 * The change log options used to generate the change log file and link
 * @typedef {Object} ChangeLog
 * @property {Object} [title] The change log page `title` of the generated HTML page
 * @property {String} [line] The _format_ for individual commit lines produced in the change log markdown.
 * @property {String} [header] The markdown that will be pre-pended to the change log.
 * @property {ChangeLogSections} [sections] The sections within the change log which organize changes (omit output a list without sections)
 * @memberof jsdocp
 */

/**
 * The navigation menu options
 * @typedef {Object} MenuOptions
 * @property {String} [position] The navigation menu _position_ (`top`, `left`, `bottom`, `right`)
 * @property {String} [matchMedia] The CSS segment that will be passed into `window.matchMedia` in the client's browser
 * @property {String} [autoHide] `true` to auto hide while vertically scrolling _down_, show when scrolling _up_
 * @memberof jsdocp
 */

/**
 * The options for the logo displayed in the navigation menu
 * @typedef {Object} MenuLogo
 * @property {String} [src] The source URL for the logo icon dsiplayed in the navigation menu (if not overridden by `inlineSvgPath`)
 * @property {String} [inlineSvgPath] A path to an `svg` logo that will be inserted inline within the navigation menu display. Will
 * override the logo `src`, but if present will fall back on the `src` when the `svg` content cannot be extracted.
 * @property {String} [anchorclassName] The CSS class name assigned to the logo icon's anchor tag
 * @property {String} [className] The CSS class name assigned to the logo icon loaded from the `src`
 * @memberof jsdocp
 */

/**
 * The options that apply to __all__ of the navigation menu icons (excluding the `logo`)
 * @typedef {Object} MenuIcons
 * @property {String} [className] The CSS class name applied to __all__ of the icons in the navigation menu (excluding the `logo`)
 * @memberof jsdocp
 */

/**
 * The options for the `npm` package icon that will appear in the navigation menu
 * @typedef {Object} MenuPackage
 * @property {String} [title] The `title` set on the `npm` package icon
 * @property {String} [src] The `src` used on the `img` in the navigation menu that links to the `npm` package (omit to use the
 * default icon)
 * @property {String} [className] The CSS class name assigned to the `npm` package icon
 * @memberof jsdocp
 */

/**
 * The options for an icon that will appear in the navigation menu
 * @typedef {Object} MenuIcon
 * @property {String} [title] The `title` set on the icon
 * @property {String} [src] The `src` used on the `img` in the navigation menu that links to the icon (omit to use the default icon)
 * @property {String} [className] The CSS class name assigned to the icon
 * @memberof jsdocp
 */

/**
 * The options for the generated pages naviagation menu
 * @typedef {Object} Menu
 * @property {MenuOptions} [SM] The navigation menu options for small displays
 * @property {MenuOptions} [MD] The navigation menu options for medium displays
 * @property {MenuOptions} [LG] The navigation menu options for large displays
 * @property {String} [className] The CSS class applied to the main menu
 * @property {MenuLogo} [logo] The options for the logo displayed in the navigation menu
 * @property {MenuIcons} [icons] The options that apply to __all__ of the navigation menu icons (excluding the `logo`)
 * @property {MenuPackage} [package] The options for the `npm` package icon that will appear in the navigation menu
 * @property {MenuIcon} [changelog] The options for the `CHANGELOG` icon that will appear in the navigation menu
 * @property {MenuIcon} [sourceCode] The options for the source `code` icon that will appear in the navigation menu
 * @property {MenuIcon} [versions] The options for the documentation version selection icon that will appear in the navigation menu
 * @memberof jsdocp
 */

/**
 * The versions options used to generate links to previously published version docs
 * @typedef {Object} Versions
 * @property {String} [from] A Semantic Versioning compliant version that designates the first version to show
 * in the version drop-down selection for different docs (omit to list all of them)
 * @property {String} [type] A designation that inidcates what doc versions to show in the drop-down selection.
 * A designation of `major` will only show versions that have been released for __major___ version tags (i.e. the _first_
 * number in the version). A designation of `minor` will only show versions that have been released for __minor__ version
 * tags (i.e. the _second_ number in the version). `undefined` will cause the default value to be used. Any other value, or blank value will cause
 * all versions to be included.
 * @memberof jsdocp
 */

/**
 * The layout fragments used. __Typically, none of the fragment values will be overridden since they are handled internally__
 * @typedef {Object} LayoutFrags
 * @property {String} [head] The path to the template fragment that will be inserted at the __end__ of the `head` section
 * @property {String} [nav] The path to the template fragment that will be inserted at the __beginning__ of the `body` section
 * @property {String} [foot] The path to the template fragment that will be inserted at the __end__ of the `body` section
 * @property {String[]} [layoutCheckTemplateDirs] The directories that the required `conf.templates.default.layoutFile` will be
 * searched for in the order they are defined. Unfortunately, template implementations may store the `conf.templates.default.layoutFile` in different
 * locations. By default, the most likley/typlical directories will be checked.
 * @property {String} [head] The path to the `template`/`*.tmpl` file used for the header at the top of the documentation page
 * @property {String} [nav] The path to the `template`/`*.tmpl` file used for the navigation bar
 * @property {String} [footer] The path to the `template`/`*.tmpl` file used for the footer at the bottom of the documenation page
 * @memberof jsdocp
 */

/**
 * The user options
 * @typedef {Object} User
 * @property {String} [name] The `git` user name
 * @property {String} [email] The `git` email
 * @memberof jsdocp
 */

/**
 * The documentation deployment options
 * @typedef {Object} Deploy
 * @property {Object} [message] The `commit` message used when deploying the documentation
 * @property {Object} [branch] The branch that where documentation will be _pushed_ during deployment
 * @property {Object} [path] The path where the `branch` will be _cloned_ to and _pushed_ from during deployment
 * @property {String} [host] The host name that will be used when _cloning_/_pushing_ during deployment (e.g. `github.com`)
 * @property {User} [user] The user options that will be used when deploying the documentation pages
 * @memberof jsdocp
 */

/**
 * The `jsdocp` options
 * @typedef {Object} JSDocpOptions
 * @property {ChangeLog} [changelog] The change log options used to generate the change log file and link
 * @property {Menu} [menu] The options for the generated pages naviagation menu
 * @property {Versions} [versions] The versions options used to generate links to previously published version docs
 * @property {Boolean} [cleanDestination] `true` to remove the `jsdoc` assigned {@link Options} `destination` prior to publishing
 * @property {Object[]} [links] The definitions used to generate `link` tags in the `head` element. Each object can have any number of
 * properties/values that will get translated to an attribute on the `link` tag matching the property name and an attribute value for the value.
 * @property {Object[]} [metas] The definitions used to generate `meta` tags in the `head` element. Each object can have any number of
 * properties/values that will get translated to an attribute on the `meta` tag matching the property name and an attribute value for the value.
 * @property {Object[]} [scripts] The definitions used to generate `script` tags in the `head` element. Each object can have any number of
 * properties/values that will get translated to an attribute on the `script` tag matching the property name and an attribute value for the value.
 * @property {LayoutFrags} [layoutFrags] The layout fragments used. __Typically, none of the fragment values will be overridden since they are handled
 * internally__
 * @property {Deploy} [deploy] The documentation deployment options
 * @memberof jsdocp
 */

/**
 * The configuration options
 * @typedef {Object} Options
 * @property {String} [destination=./docs] The destination directory where the documentation will be generated in
 * @property {JSDocpOptions} [jsdocp] The `jsdocp` options
 * @memberof jsdocp
 */

/**
 * The configuration used by `jsdocp`
 * @typedef {Object} JSDocpConf
 * @property {Options} [opts] The configuration options
 * @memberof jsdocp
 */

/**
 * Placeholder for [JSDoc Configuration Options](https://jsdoc.app/about-configuring-jsdoc.html)
 * @typedef {Object} JSDocConf
 * @memberof jsdocp
 */

/**
 * The configuration used by `jsdocp`
 * @typedef {JSDocConf & JSDocpConf} Conf
 * @memberof jsdocp
 */