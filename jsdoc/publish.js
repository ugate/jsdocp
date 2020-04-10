"use strict";

const markdown = require('jsdoc/util/markdown');
const logger = require('jsdoc/util/logger');

const { exec } = require('child_process');
const Fs = require('fs');
const Fsp = Fs.promises;
const Path = require('path');

const pkg = require(Path.join(process.env.JSDOCP_MODULE_PATH, 'package.json'));

/**
 * Publishes a modules documentation along with the following:
 * - A `versions.json` that contains an array of published `npm` versions in descending order
 * - A `CHANGELOG.html` containing change log details from the current version back to the previously published `npm` version
 * - Selection menu for available documentations by module versions
 * - Menu icon/link to the `npm` package
 * - Menu icon/link to the source code
 * - Menu icon/link to the change log
 * @param {TAFFY} taffyData See <http://taffydb.com/>
 * @param {Object} opts The `jsdoc` options
 * @param {Object} opts.jsdocp The `jsdocp` options
 * @param {Tutorial} tutorials The turtorials
 */
exports.publish = function(taffyData, opts, tutorials) {
  //console.dir(tutorials, {depth:100});
  // console.dir(opts, {depth:10});
  const thiz = this, args = arguments;
  let repoURL = (pkg && pkg.homepage) || '';
  if (pkg && pkg.repository && pkg.repository.url) {
    // strip any prefixes that the repo URL may have
    const ridx = pkg.repository.url.indexOf('http');
    repoURL = ridx >= 0 ? pkg.repository.url.substr(ridx) : pkg.repository.url;
  }
  return new Promise(async (resolve, reject) => {
    env.meta = { // accessibility in templates
      package: pkg,
      repoURL: repoURL,
      publish: {
        lastVersionPublished: process.env.JSDOCP_PUBLISH_LAST_VER_PUB,
        lastVersion: process.env.JSDOCP_PUBLISH_LAST_VER,
        moduleURL: process.env.JSDOCP_PUBLISH_MODULE_URL,
        date: process.env.JSDOCP_PUBLISH_DATE
      }
    };
    try {
      await destination(opts);
      const chglogPath = Path.join(opts.destination, 'CHANGELOG.md'), verPath = Path.join(opts.destination, 'versions.json');
      const chglogHtmlPath = Path.join(opts.destination, 'CHANGELOG.html');
      logger.info(`Writting ${verPath}: ${process.env.JSDOCP_PUBLISH_VERSIONS}`);
      const wrVerProm = Fsp.writeFile(verPath, process.env.JSDOCP_PUBLISH_VERSIONS);
      const span = env.meta.publish.lastVersionPublished ? `v${env.meta.publish.lastVersionPublished}..HEAD ` : '';
      const line = opts.jsdocp.changelog && opts.jsdocp.changelog.line ? opts.jsdocp.changelog.line.replace(/"/g, '\\"') : '* %s';
      const header = opts.jsdocp.changelog && opts.jsdocp.changelog.header ? opts.jsdocp.changelog.header : `## ${env.meta.package.version}`;
      const gitlog = (grepo, merges) => {
        const mrgs = merges ? '--merges' : '--no-merges';
        const grep = grepo && grepo.regexp ? `--grep="${grepo.regexp.replace(/"/g, '\\"')}" ` : '';
        const rxi = grepo && grepo.ignoreCase ? '-i ' : '', rxe = grepo && grepo.extendedRegexp ? '-E ' : '';
        return new Promise((resolve, reject) => {
          exec(`git --no-pager log ${span}--oneline ${mrgs} ${rxi}${rxe}${grep}--pretty=format:"${line}" `, async (error, stdout, stderr) => {
            if (error) return reject(error);
            if (stderr) return reject(new Error(stderr));
            resolve(stdout || '');
          });
        });
      };
      var chglog = '', cltxt = '', clps = [], sctns = opts.jsdocp.changelog && opts.jsdocp.changelog.sections;
      if (sctns) {
        if (sctns.breaks && sctns.breaks.grep) clps.push({ promise: gitlog(sctns.breaks.grep), clopts: sctns.breaks });
        if (sctns.features && sctns.features.grep) clps.push({ promise: gitlog(sctns.features.grep), clopts: sctns.features });
        if (sctns.fixes && sctns.fixes.grep) clps.push({ promise: gitlog(sctns.fixes.grep), clopts: sctns.fixes });
        if (sctns.merges && sctns.merges.grep) clps.push({ promise: gitlog(sctns.merges.grep, true), clopts: sctns.merges });
      } else chglog += await gitlog();
      for (let cl of clps) {
        try {
          cltxt = await cl.promise;
          if (cltxt) chglog += `\n\n${cl.clopts.header}\n${cltxt}`;
        } catch (err) {
          err.message += ` (Unable to generate CHANGELOG section "${cl.clopts.header}" for grep "${cl.clopts.grep}")`;
          return reject(err);
        }
      }
      var logoPath;
      if (opts.jsdocp.menu.logo.inlineSvgPath) {
        if (!/.svg$/i.test(opts.jsdocp.menu.logo.inlineSvgPath)) {
          throw new Error(`"conf.opts.jsdocp.menu.logo.inlineSvgPath" must be in SVG format for: ${conf.opts.jsdocp.menu.logo.inlineSvgPath}`);
        }
        logoPath = Path.resolve(process.env.JSDOCP_MODULE_PATH, opts.jsdocp.menu.logo.inlineSvgPath);
        env.meta.logo = Fsp.readFile(logoPath);
      }
      try {
        const mdParse = markdown.getParser();
        env.meta.changelog = `${header}\n${chglog}`;
        env.meta.changelogHTML = mdParse(env.meta.changelog);

        // write standalone changelog markdown file
        logger.info(`Writting ${chglogPath}`);
        const wrClProm = Fsp.writeFile(chglogPath, env.meta.changelog);

        // write standalone changelog HTML file
        logger.info(`Writting ${chglogHtmlPath}`);
        const wrClPromHTML = Fsp.writeFile(chglogHtmlPath, env.meta.changelogHTML);
        
        await wrClPromHTML;
        await wrClProm;
      } catch(err) {
        err.message += ` (Unable to write ${chglogPath} and/or ${chglogHtmlPath})`;
        return reject(err);
      }
      try {
        await wrVerProm;
      } catch (err) {
        err.message += ` (Unable to write ${verPath})`;
        return reject(err);
      }

      // extract logo inline content
      try {
        env.meta.logo = env.meta.logo instanceof Promise ? (await env.meta.logo).toString(): env.meta.logo;
      } catch (err) {
        err.message += ` (Unable to extract logo content from ${logoPath}.${opts.jsdocp.menu.logo.src ? ` Falling back on ${opts.jsdocp.menu.logo.src}` : ''})`;
        logger.warn(err.message);
        logger.warn(err);
      }

      // use the actual template
      opts.template = opts.jsdocp.templateProxy;

      logger.debug(`Running markdown extensions on tutorials...`);
      await tutorialExts(tutorials);
      
      // transfer control over to template engine
      //const moduleName =opts.template.match(/.*node_modules(?:\\|\/)([^\/\\]*)/);
      const Engine = require(`${opts.template}/publish.js`);
      resolve(Engine.publish.apply(thiz, args)); // no need to customize how docs are parsed
    } catch(err) {
      reject(err);
    } finally {
      try {
        await rmrf(process.env.JSDOCP_TMPDIR);
        logger.info(`Removed ${process.env.JSDOCP_TMPDIR}`);
      } catch (err) {
        logger.warn(`Unable to cleanup ${process.env.JSDOCP_TMPDIR}`);
        logger.warn(err);
      }
    }
  });
};

/**
 * Handles the removal/creation of the destination directory
 * @private
 * @param {Object} opts The `jsdoc` options
 */
async function destination(opts) {
  var chkdest = !opts.jsdocp.pages || !opts.jsdocp.cleanDestination, mkdest = true;
  try {
    if (!chkdest) {
      logger.info(`Cleaning ${opts.destination}`);
      await rmrf(opts.destination);
    }
  } catch (err) {
    chkdest = true;
    logger.warn(`Unable to clean opts.destination: ${opts.destination} ${err.message}`);
  }
  try {
    if (chkdest) {
      await Fsp.access(opts.destination, Fs.constants.F_OK);
      mkdest = false;
    }
  } catch (err) {
    logger.debug(`Inaccessible opts.destination: ${opts.destination}`);
  }
  if (mkdest) {
    logger.debug(`mkdir for opts.destination: ${opts.destination}`);
    return Fsp.mkdir(opts.destination, { recursive: true });
  }
}

/**
 * Parses/sets the tutorial content that matches any of the markdown extensions
 * @private
 * @param {Object[]} tuts The tutorial object
 * @param {String} tuts[].content The content of the tutorial
 */
async function tutorialExts(tuts) {
  if (!tuts) return;
  if (tuts.content) markdownExt(tuts);
  const prms = [];
  for (let tut of tuts.children) {
    prms.push(markdownExt(tut));
  }
  await Promise.all(prms);
}

/**
 * Parses/sets the _markdown_ content for extended features
 * @private
 * @param {Object} md The markdown string to parse
 * @param {String} md.content The markdown content
 */
async function markdownExt(md) {
  if (!md.content) return;
  // replace all jsdocp inline code blocks with the actual code blocks unless wrapped in a "pre"
  const rx = /^\s*(`{3,})jsdocp\s*([^\r\n\@]+)?\s*(@[^\r\n]*?)?[\r\n]([\s\S]*?)[\r\n]?\s*(`{3,})\s*(?:\n+|$)/igm, prms = [];
  md.content.replace(rx, (mtch, bktckStart, pth, args, cnt, bktckEnd) => {
    if (bktckStart.length > 3 && bktckEnd.length > 3) return mtch;
    prms.push(Fsp.readFile(Path.resolve(process.env.JSDOCP_MODULE_PATH, pth.trim())));
    return mtch;
  });
  if (!prms.length) return;
  let vals = await Promise.all(prms), idx = -1;
  md.content = md.content.replace(rx, (mtch, bktckStart, pth, args, cnt, bktckEnd, offset) => {
    if (bktckStart.length > 3 && bktckEnd.length > 3) {
      return mtch.replace(/`{4,}/g, '```');
    }
    let val = vals[++idx].toString();
    let lang = pth.split('.').pop();
    if (lang) lang = lang.trim();
    const argsArray = args && args.split('@');
    if (argsArray) argsArray.shift(); // anything before first @ is not needed
    if (lang === 'json' && argsArray && argsArray.length) val = jsonArgs(JSON.parse(val), argsArray);
    return `\`\`\`${lang}\n${cnt ? `${cnt}\n` : ''}${val}\n\`\`\`\n`;
  });
}

/**
 * Constructs a JSON string based upon a JSON object and arguements where each arguement
 * is a `/` delimited path that points to a destination property value within the supplied
 * JSON object. For example `{ prop1: { prop2: 1 } otherProp: 2 }` with args `['prop1.prop2']`
 * would result in a return value of `1` whereas args of `['prop1.prop2', 'otherProp']` would
 * result in a return value of `{ prop2: 1, otherProp: 2 }` (note how multiple args will always
 * result in property names/values while a single arg will always result in just the value of
 * arg path).
 * @param {Object} json The JSON to extract the `args` from
 * @param {String[]} args The arguements that contain one or more JSON paths
 * @returns {String} The composed JSON string using the path destinations from the `args`
 */
function jsonArgs(json, args) {
  const dest = {};
  for (let arg of args) {
    jsonPaths(json, dest, arg.split('.'));
  }
  return JSON.stringify(dest, null, '  ');
}

/**
 * Traverses the paths of a specified JSON object and returns the property name/value (or `undefined`
 * when the path does not exist).
 * @param {Object} src The JSON to traverse
 * @param {String[]} pths The paths to traverse that reside in the JSON
 * @returns {Object | undefined} An object if the paths lead to valid destination withon the JSON
 * or `undefined` when they do not. The returned object will contain a `name` of the final JSON
 * property name and a `value` for the JSON property value.
 */
function jsonPaths(src, dest, pths) {
  let val = dest, sval = src, cnt = 0;
  for (let pth of pths) {
    cnt++;
    pth = pth.trim();
    if (!sval.hasOwnProperty(pth)) return;
    if (!val.hasOwnProperty(pth)) {
      if (cnt === pths.length || typeof sval[pth] !== 'object') {
        val[pth] = sval[pth];
      } else {
        val[pth] = {};
      }
    }
    val = val[pth];
    sval = sval[pth];
  }
}

/**
 * Recursively removes the directory and any subdirectories/files
 * @private
 * @param {String} dir The path that will be removed
 */
async function rmrf(dir) {
  // TODO : ESM use... export async function rmrf(dir) {
    await Fsp.access(dir, Fs.constants.F_OK);
    var sdir;
    for (let entry of await Fsp.readdir(dir)) {
      sdir = Path.join(dir, entry);
      if ((await Fsp.lstat(sdir)).isDirectory()) await rmrf(sdir);
      else await Fsp.unlink(sdir);
    }
    await Fsp.rmdir(dir);
  }