var JSPUB = {}, jspub = new JSPUB();

(function jspub() {

  var py = window.pageYOffset, mobile = window.matchMedia('(max-width: 680px)');

  // handles mobile nav menu showing/hiding based upon scrolling direction
  window.addEventListener('scroll', function scroller() {
    var y = window.pageYOffset;
    if (mobile.matches) {
      var nav = document.getElementById('jspubNav');
      if (nav) nav.style.bottom = py > y ? '0' : '-' + getComputedStyle(nav).height;
    }
    py = y;
  });

  // handle loading of versions.json and populates the version drop-down select
  window.addEventListener('load', function loaded() {
    jspub.loadVersions();
  });
})();

/**
 * Loads the `versions.json` into the `#jspubVersions` select element from it's `data-jsonUrl` attribute URL. Uses the `data-from`,
 * `data-include` to filter what versions are shown.
 */
JSPUB.prototype.loadVersions = function loadVersions() {
  var sel = document.querySelector('#jspubVersions');
  if (!sel) return;
  var versioned = function(ver) {
    var parts = String(ver).split('.');
    return {
      major: (parts && parts[0] && !isNaN(parts[0]) && parseInt(parts[0])) || 0,
      minor: (parts && parts[1] && !isNaN(parts[1]) && parseInt(parts[1])) || 0,
      patch: (parts && parts[2] && !isNaN(parts[2]) && parseInt(parts[2])) || 0
    };
  };
  var req = new XMLHttpRequest();
  req.overrideMimeType('application/json');
  req.open('GET', sel.dataset.jsonUrl, true);
  req.onreadystatechange = function versionsLoaded() {
    if (req.readyState === 4) {
      if (req.status !== 200) return console.warn(req.status + ' (' + req.statusText + '): Unable to capture ' + sel.dataset.jsonUrl);
      var vrs = JSON.parse(req.responseText);
      var i = vrs.length, last, curr, from = sel.dataset.from ? versioned(sel.dataset.from) : null;
      while (i--) { // add in reverse order 
        if (from || sel.dataset.include) {
          if (!last) last = versioned(sel.dataset.version);
          curr = versioned(vrs[i]);
          if (from && curr.major < from.major) break;
          if (from && curr.major === from.major && curr.minor < from.minor) break;
          if (from && curr.major === from.major && curr.minor === from.minor && curr.patch < from.patch) break;
          if (sel.dataset.include === 'major' && curr.major === last.major) continue;
          if (sel.dataset.include === 'minor' && curr.minor === last.minor) continue;
          last = curr;
        }
        opt = document.createElement('option');
        opt.setAttribute('value', vrs[i]);
        opt.appendChild(document.createTextNode(vrs[i]));
        sel.appendChild(opt);
      }
    }
  };
  req.send(null);
};

/**
 * Blends a color extracted by an element `style` property based upon another color extracted by another element `style` property
 * @param {Element} el the element that color attributes will be extracted from
 * @param {String} [fromStyleName='background-color'] the element's computed style attribute that blending will be __from__
 * @param {String} [toStyleName='color'] the element's computed style attribute that blending will be __to__
 */
JSPUB.prototype.blendByColor = function blendByColor(el, fromStyleName, toStyleName) {
  var jp = this, els = getComputedStyle(el);
  styleName = styleName || 'background-color';
  toStyleName = toStyleName || 'color';
  var fromStyleAttr = styleName.replace(/-(.)/g, function rpl(mtch, char) {
    return char.toUpperCase();
  });
  el.style[fromStyleAttr] = jp.colorBlend(-.5, els.getPropertyValue(fromStyleName), els.getPropertyValue(toStyleName));
};

/**
 * Blends color(s)
 * @param {Number} percentage the percentage that the `from` color will be shaded (zero to convert from `rgb`/`rgba` to `hex` or vice versa)
 * @param {(String | Object)} fromColor color parts from {@link JSPUB.colorParts} or the from color in `hex` or `rgb`/`rgba` format
 * @param {(String | Object)} toColor color parts from {@link JSPUB.colorParts} or the to color in `hex` or `rgb`/`rgba` format that the from will be 
 * blended to (a value of `c` will blend/convert)
 * @returns {String} the blended color in `hex` or rgb`/`rgba` format (always in the `toColor` format unless omitted, then defaults to `rgb`/`rgba`)
 */
JSPUB.prototype.colorBlend = function colorBlend(percentage, fromColor, toColor) {
  var jp = this, p = percentage, from = fromColor, to = toColor;
  if (typeof(p) != 'number' || p <- 1 || p > 1 || typeof(from) != 'string' || (from[0] != 'r' && from[0] != '#') || (to && typeof(to) != 'string')) return null;
  var h = typeof(to) === 'string' ? to.length > 9 ? true : to === 'c' ? from.length <= 9 : false : from.length > 9;
  var b = p < 0, p = b ? p * -1 : p, to = to && to != 'c' ? to : b ? '#000000' : '#FFFFFF';
  var f = from && typeof(from) === 'object' ? from : jp.colorParts(from), t = to && typeof(to) === 'object' ? to : jp.colorParts(to);
  if (!f || !t) return null;
  if (h) return 'rgb' + (f.a > -1 || t.a >- 1 ? 'a(' : '(') + Math.round((t.r - f.r) * p + f.r) + ',' + Math.round((t.g - f.g) * p + f.g)
    + ',' + Math.round((t.b - f.b) * p + f.b) + (f.a < 0 && t.a < 0 ? ')' : ','
    + (f.a > -1 && t.a > -1 ? Math.round(((t.a - f.a) * p + f.a) * 10000) / 10000 : t.a < 0 ? f.a : t.a) + ')');
  else return '#' + (0x100000000 + Math.round((t.r - f.r) * p + f.r) * 0x1000000 + Math.round((t.g - f.g) * p + f.g) * 0x10000
    + Math.round((t.b - f.b) * p + f.b) * 0x100 + (f.a > -1 && t.a > -1 ? Math.round(((t.a - f.a) * p + f.a) *255) : t.a > -1
    ? Math.round(t.a * 255) : f.a > -1 ? Math.round(f.a * 255) : 255)).toString(16).slice(1, f.a > -1 || t.a > -1 ? undefined : -2);
};

/**
 * Inverts a color
 * @param {(String | Object)} color color parts from {@link JSPUB.colorParts} or the color in `hex` or `rgb`/`rgba` format
 * @param {Boolean} isBlackWhite true to invert to either *black* or *white*
 * @returns {String} the inverted color in `hex` or rgb`/`rgba` format (always in the `color` format)
 */
JSPUB.prototype.invertColor = function invertColor(color, isBlackWhite) {
  var jp = this, cp = color && typeof(color) === 'object' ? color : jp.colorParts(color);
  var r = parseInt(cp.r, 16), g = parseInt(cp.g, 16), b = parseInt(cp.b, 16);
  var bw = isBlackWhite ? ((r * 0.299 + g * 0.587 + b * 0.114) <= 186 && 255) || 0 : null;
  r = bw === null ? 255 - r : bw;
  g = bw === null ? 255 - g : bw;
  b = bw === null ? 255 - b : bw;
  if (cp.isHex) {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
    var padZero = function padZero(str, len) {
      len = len || 2;
      var zeros = new Array(len).join('0');
      return (zeros + str).slice(-len);
    };
    return '#' + padZero(r) + padZero(g) + padZero(b);
  }
  return 'rgb' + (cp.a >= 0 ? 'a(' : '(') + r + ',' + g + ',' + b + (cp.a >= 0 ? cp.a + ')' : ')');
};

/**
 * Parses a `hex` or `rgb`/`rgba` string into corresponding color parts
 * @param {String} color a color in either `hex` or `rgb`/`rgba` format
 * @returns {Object} an object containing each color part (e.g. `{ r:255, g:255, b:255, a:1, isHex:false }`, *red, green, blue, alpha, isHex*)
 */
JSPUB.prototype.colorParts = function colorParts(color) {
  var jp = this, d = color, l = d.length, RGB = {};
  if (l > 9) {
    d = d.split(',');
    if (d.length < 3 || d.length > 4) return null;
    RGB.r = parseInt(d[0].split('(')[1]),
    RGB.g = parseInt(d[1]);
    RGB.b = parseInt(d[2]);
    RGB.a = d[3] ? parseFloat(d[3]) : -1;
    RGB.isHex = false;
  } else {
    if (l == 8 || l == 6 || l < 4) return null;
    if (l < 6) d = '#' + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + '' + d[4] : ''); // allow for 3 or 4 digit hex values
    d = parseInt(d.slice(1), 16);
    RGB.r = d >> 16 & 255;
    RGB.g = d >> 8 & 255;
    RGB.b = d & 255;
    RGB.a = -1;
    RGB.isHex = true;
    if (l == 9 || l == 5) RGB.a = Math.round((RGB.b / 255) * 10000) / 10000;
    RGB.b = RGB.g;
    RGB.g = RGB.r;
    RGB.r = d >> 24 & 255;
  }
  return RGB;
};