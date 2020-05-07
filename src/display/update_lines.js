import { heightAtLine } from "../line/spans.js"
import { getLine, lineAtHeight, updateLineHeight } from "../line/utils_line.js"
import { paddingTop, charWidth } from "../measurement/position_measurement.js"
import { ie, ie_version } from "../util/browser.js"

// FT-CUSTOM
function updateHeightInViewport(cm, view, height) {
  const display = cm.display;
  const diff = view.line.height - height;
  if (height < 2) height = textHeight(display);
  if (diff > .005 || diff < -.005) {
    updateLineHeight(view.line, height);
    updateWidgetHeight(view.line);
    if (view.rest) for (let j = 0; j < view.rest.length; j++)
      updateWidgetHeight(view.rest[j]);
  }
}
// END-FT-CUSTOM


// Read the actual heights of the rendered lines, and update their
// stored heights to match.
export function updateHeightsInViewport(cm) {
  let display = cm.display
  let prevBottom = display.lineDiv.offsetTop
  // FT-CUSTOM
  let prev;
  for (let i = 0; i < display.view.length; i++) {
    let cur = display.view[i]
    let width = 0
    if (cur.hidden) continue
    const offsetTop = cur.node.offsetTop;
    const offsetHeight = cur.node.offsetHeight;
    const offsetBottom = offsetTop + offsetHeight;
    const gap = (offsetTop - prevBottom);
    if (gap) {
      updateHeightInViewport(cm, prev, prev.line.height + gap);
    }

    updateHeightInViewport(cm, cur, offsetHeight);
    prevBottom = offsetBottom;
    prevHeight = offsetHeight;
    prev = cur;
    // END-FT-CUSTOM

    if (width > cm.display.sizerWidth) {
      let chWidth = Math.ceil(width / charWidth(cm.display))
      if (chWidth > cm.display.maxLineLength) {
        cm.display.maxLineLength = chWidth
        cm.display.maxLine = cur.line
        cm.display.maxLineChanged = true
      }
    }
  }
}

// Read and store the height of line widgets associated with the
// given line.
function updateWidgetHeight(line) {
  // FT-CUSTOM
  // if (line.widgets) for (let i = 0; i < line.widgets.length; ++i) {
  //   let w = line.widgets[i], parent = w.node.parentNode
  //   if (parent) w.height = parent.offsetHeight
  // }

  if (line.widgets) for (let i = 0; i < line.widgets.length; ++i) {
    var each = line.widgets[i];
    if (each.overlay) {
      each.height = 0;
    } else {
      each.height = each.node.offsetHeight;
    }
  }
  // END-FT-CUSTOM
}

// Compute the lines that are visible in a given viewport (defaults
// the the current scroll position). viewport may contain top,
// height, and ensure (see op.scrollToPos) properties.
export function visibleLines(display, doc, viewport) {
  let top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop
  top = Math.floor(top - paddingTop(display))
  let bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight

  let from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom)
  // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
  // forces those lines into the viewport (if possible).
  if (viewport && viewport.ensure) {
    let ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line
    if (ensureFrom < from) {
      from = ensureFrom
      to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight)
    } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
      from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight)
      to = ensureTo
    }
  }
  return {from: from, to: Math.max(to, from + 1)}
}
