var jsdocp = new JSDocp();

function JSDocp() {
  var jp = this, py = window.pageYOffset, y = py, mobile = window.matchMedia('(max-width: 680px)');
  var chglogId = 'jsdocpChangelog', chglogContentId = 'jsdocpChangelogContent';
  var chglogCloseId = 'jsdocpChangelogClose', navId = 'jsdocpNav';
  var logoSrcSel = '.jsdocp-logo-svg', logoSrcAttr = 'jsdocp-logo-src';
  var throttles = {};

  // handles mobile nav menu showing/hiding based upon scrolling direction
  window.addEventListener('scroll', function scroller(evt) {
    var y = window.pageYOffset;
    throttle(navId, evt.type, 100, function scrollerThrottle() {
      if (!mobile.matches) return;
      var nav = document.getElementById('jsdocpNav');
      if (nav) nav.style.bottom = py > window.pageYOffset ? '0' : '-' + getComputedStyle(nav).height;
    });
    py = y;
  });

  // handle loading of versions.json and populates the version drop-down select
  window.addEventListener('load', function loaded() {
    changelogLink();
    jp.loadVersions();
    jp.imgSvgToInline(document.querySelectorAll(logoSrcSel), logoSrcAttr);
  });

  /**
   * Attempt to override the link to the CHANGELOG in order to keep it within the same page wrapper
   */
  function changelogLink() {
    var cla = document.getElementById(chglogId), cl = document.getElementById(chglogContentId);
    if (cla && cl) {
      var cls = document.getElementById(chglogCloseId);
      var toggleChangelog = function toggleChangelog() {
        var isOpen = cl.classList.contains('jsdocp-open');
        var hasSB = window.innerHeight ? document.body.offsetHeight > window.innerHeight : document.documentElement.scrollHeight > 
          document.documentElement.offsetHeight || document.body.scrollHeight > document.body.offsetHeight;
        document.body.classList[!isOpen && hasSB ? 'add' : 'remove']('jsdocp-noscroll');
        if (isOpen) {
          var stl = getComputedStyle(cl), mtch = stl && stl.transition && stl.transition.match(/\s+(\d+\.?\d+)(m?s)/i);
          var dur = (mtch && mtch[1] && parseFloat(mtch[1])) || 0;
          dur = mtch && mtch[2] && mtch[2].length > 1 ? dur : dur * 1000;
          cl.classList.toggle('jsdocp-open');
          setTimeout(function cltko() {
            document.body.classList.toggle('jsdocp-cover');
          }, dur);
        } else {
          document.body.classList.toggle('jsdocp-cover');
          cl.classList.toggle('jsdocp-open');
        }
      };
      if (cls) cls.addEventListener('click', toggleChangelog);
      cla.addEventListener('click', function overrideChglogClick(event) {
        try {
          toggleChangelog();
        } catch (err) {
          console.error(err);
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
      }, { capture: true });
    }
  }

  /**
  * Throttles a function call
  * @param {*} [id] an id that will be used for throttling
  * @param {String} [type] the type of throttle (e.g. event type)
  * @param {Integer} [timeout] the number of milliseconds to wait between function calls before re-executing
  * @param {function} fn the function that will be throttled
  * @returns {String} the cached id
  */
  function throttle(id, type, timeout, fn) {
    var nid = id + '-type-' + type;
    clearTimeout(throttles[nid]);
    if (timeout >= 0) throttles[nid] = setTimeout(function throttleTimeout() {
      fn(nid);
    }, timeout);
    return id;
  }
}

/**
 * Loads the `versions.json` into the `#jsdocpVersions` select element from it's `data-jsdocp-json-url` attribute URL. Uses the `data-jsdocp-from`,
 * `data-jsdocp-type` to filter what versions are shown.
 */
JSDocp.prototype.loadVersions = function loadVersions() {
  var jp = this, sel = document.querySelector('#jsdocpVersions > select');
  if (!sel) return;
  var versioned = function(ver) {
    var parts = String(ver).split('.');
    return {
      major: (parts && parts[0] && !isNaN(parts[0]) && parseInt(parts[0])) || 0,
      minor: (parts && parts[1] && !isNaN(parts[1]) && parseInt(parts[1])) || 0,
      patch: (parts && parts[2] && !isNaN(parts[2]) && parseInt(parts[2])) || 0
    };
  };
  sel.addEventListener('change', function versionChange(event) {
    var trg = event.currentTarget || event.target, base = (trg && trg.dataset.jsdocpVersionBase) || '';
    if (trg && trg.value) window.location = (base ? base + '/' : '') + trg.value;
  });
  jp.fetch(sel.dataset.jsdocpJsonUrl, 'application/json', function versionsLoaded(error, req) {
    if (error) return console.warn(error);
    var vrs = JSON.parse(req.responseText);
    var i = vrs.length, last, curr, from = sel.dataset.jsdocpFrom ? versioned(sel.dataset.jsdocpFrom) : null;
    while (i--) { // add in reverse order 
      if (from || sel.dataset.jsdocpType) {
        if (!last) last = versioned(sel.dataset.jsdocpVersion);
        curr = versioned(vrs[i]);
        if (from && curr.major < from.major) break;
        if (from && curr.major === from.major && curr.minor < from.minor) break;
        if (from && curr.major === from.major && curr.minor === from.minor && curr.patch < from.patch) break;
        if (sel.dataset.jsdocpType === 'major' && curr.major === last.major) continue;
        if (sel.dataset.jsdocpType === 'minor' && curr.minor === last.minor) continue;
        last = curr;
      }
      opt = document.createElement('option');
      opt.setAttribute('value', vrs[i]);
      opt.appendChild(document.createTextNode(vrs[i]));
      sel.appendChild(opt);
    }
  });
};

/**
 * Replaces element(s) that have the `urlAttr` with a value ending in `.svg` with the retrieved svg content-
 * preserving the `className` of the original element
 * @param {(NodeList | Element[] | Element)} els The element(s) to replace in the DOM with retrieved svg content
 * @param {String} [urlAttr='src'] The attribute that will contain the URL to retrieve the svg content from 
 */
JSDocp.prototype.imgSvgToInline = function imgSvgToInline(els, urlAttr) {
  var jp = this;
  els = els instanceof NodeList || Array.isArray(els) ? els : (els && [els]) || [];
  urlAttr = urlAttr || 'src';
  var svgHandler = function svgHandler(error, req, el) {
    if (error) return console.warn(error);
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(req.responseText, 'text/xml');
    var svg = xmlDoc.getElementsByTagName('svg')[0];
    svg.className = el.className;
    svg.removeAttribute('xmlns:a');
    if (!svg.getAttribute('viewBox') && svg.getAttribute('height') && svg.getAttribute('width')) {
      svg.setAttribute('viewBox', '0 0 ' + svg.getAttribute('height') + ' ' + svg.getAttribute('width'));
    }
    el.parentNode.replaceChild(svg, el);
  }
  for (var i = 0, url; i < els.length && (url = els[i].getAttribute(urlAttr)); i++) {
    if (url.indexOf('.svg')) {
      if (els[i].tagName.toLowerCase() === 'iframe') els[i].outerHTML = els[i].contentWindow.document.documentElement.innerHTML;
      else jp.fetch(url, null, svgHandler, els[i]);
    }
  }
};

/**
 * Fetches resources
 * @param {String} url The URL to the resource
 * @param {String} [mime] The mime to override (if any)
 * @param {Function} [cb] The callback `function(error, request, arg)`
 * @param {*} [arg] An argument to pass to the callback as the last argument
 */
JSDocp.prototype.fetch = function fetch(url, mime, cb, arg) {
  var req = new XMLHttpRequest();
  if (mime) req.overrideMimeType(mime);
  req.open('GET', url, true);
  req.onreadystatechange = function fetched() {
    if (req.readyState === 4) {
      error = req.status !== 200 ? new Error(req.status + ' (' + req.statusText + '): Unable to capture ' + url) : null;
      if (error) error.status = req.status;
      cb(error, req, arg);
    }
  };
  req.onerror = function fetchError(error) {
    cb(error, req, arg);
  };
  req.send(null);
};