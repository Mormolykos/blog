import React from 'react';

export const PhotopeaArticle: React.FC = () => {
  return (
    <article>
      <h1>Six Things Photopea's Scripting API Does That Nobody Wrote Down</h1>
      <p><em>Undocumented behaviours in Photopea's Live Messaging API — measured, with the workaround for each. If your automation reports success and changes nothing, one of these is probably why.</em></p>
      <hr />

      <p>Photopea is a full image editor in a browser tab, it is free, and it exposes an automation surface: <a href="https://www.photopea.com/api/live" target="_blank" rel="noopener noreferrer">Live Messaging</a>. You <code>postMessage</code> a string of JavaScript into an iframe, Photopea executes it, and you get <code>"done"</code> back. That is essentially the whole official documentation.</p>

      <p>It is enough to get started and nowhere near enough to build on. I spent a day driving Photopea from a headless browser, and six behaviours cost me most of that day. None of them are in the docs. Each one fails <em>silently</em> — no exception, no error string, and in three cases a cheerful <code>"done"</code> confirming that nothing happened.</p>

      <p>Everything below was measured against photopea.com on 8 August 2026, from Python via Playwright and Chromium. Where a claim is a number, it came from a probe, not from memory.</p>

      <h2>1. Live Messaging is off unless the URL hash carries a config</h2>

      <p>This is the first wall, and it looks like a dead detector rather than a configuration problem.</p>

      <p>Load <code>https://www.photopea.com</code> in an iframe and it works perfectly. It renders, it is interactive, the console is clean. It simply never sends <code>"done"</code> — so your bridge sits waiting for a handshake that is not coming, and the natural conclusion is that your message listener is broken.</p>

      <p>It isn't. Photopea only enters Live Messaging mode when the URL fragment carries a configuration object. Measured: with no hash, zero messages in 32 seconds. With a hash, <code>"done"</code> in under two seconds.</p>

      <pre><code>{`// Silent forever:
iframe.src = "https://www.photopea.com";

// Handshake in <2s:
iframe.src = "https://www.photopea.com#" +
  encodeURIComponent(JSON.stringify({ environment: {} }));`}</code></pre>

      <p>An empty <code>environment</code> object is sufficient. The official demos do this, but the docs never state it as a requirement.</p>

      <h2>2. Calling a function stored on an object literal kills the interpreter</h2>

      <p>This is the worst one, and it is worth reading twice.</p>

      <pre><code>{`var o = { m: function () { return 7; } };
o.m();   // interpreter dead`}</code></pre>

      <p>Not "throws". Not "returns undefined". The script interpreter <strong>aborts</strong>, and no further script runs for the lifetime of that page. Inside an IIFE or at top level, whatever the object is named, whatever the method does. Meanwhile the page keeps rendering normally, so nothing looks wrong.</p>

      <p>Plain function declarations and function expressions are both fine:</p>

      <pre><code>{`function m() { return 7; }        // fine
var m = function () { return 7; }; // fine`}</code></pre>

      <p>Which means the single most natural way to organise a script prelude — a namespace object holding your helpers — is the one construct that destroys it. I lost the most time here because the symptom impersonates a name collision: my helper object was called <code>ovl</code>, and <code>typeof ovl</code> came back <code>"object"</code> <em>before I declared it</em>, so I spent a long time convinced I was shadowing something in Photopea's own runtime. Renaming it to something unique changed nothing, because the name was never the problem.</p>

      <p>Rewrite every helper as a top-level <code>function</code>.</p>

      <h2>3. Layer bounds are objects that lie when you convert them</h2>

      <p><code>layer.bounds</code> returns four values, and <code>typeof</code> reports them as numbers. They are not. They are minified <code>UnitValue</code> objects — <code>JSON.stringify</code> exposes the shape:</p>

      <pre><code>{`[{"Hk":"UnitValue","n":0,"asR":"px"},
 {"Hk":"UnitValue","n":0,"asR":"px"},
 {"Hk":"UnitValue","n":400,"asR":"px"},
 {"Hk":"UnitValue","n":300,"asR":"px"}]`}</code></pre>

      <p>Their <code>toString</code> yields <code>"[object Object]"</code>, so the two conversions everyone reaches for both return <code>NaN</code>:</p>

      <pre><code>{`var b = layer.bounds;
parseFloat(b[2])   // NaN
Number(b[2])       // NaN
b[2] * 1           // 400  <- works (valueOf)
b[2].value         // 400  <- works, but a minified property name`}</code></pre>

      <p>A <code>NaN</code> raises nothing. It flows into your positioning arithmetic, every comparison against it is false, and layers land in places you never asked for. Multiplying by 1 goes through <code>valueOf</code> and is the conversion I would trust, since it does not depend on a property name surviving the next minifier pass.</p>

      <p>The same applies to <code>document.width</code> and <code>document.height</code>.</p>

      <h2>4. A text layer measures 0×0 until the script that created it has returned</h2>

      <p>Create a type layer, set its contents, then read its bounds in the same script, and you get <code>[0, 0, 0, 0]</code> — always. Read the bounds in the <em>next</em> message and they are correct.</p>

      <pre><code>{`// script 1
var l = app.activeDocument.artLayers.add();
l.kind = LayerKind.TEXT;
l.textItem.contents = "MIRELANDS";
l.textItem.size = 36;
var b = l.bounds;    // [0,0,0,0]

// script 2, next postMessage
var b = app.activeDocument.layers[0].bounds;  // [33,223,241,251]`}</code></pre>

      <p>The layer renders after the script returns. This matters more than it looks, because there is a real and separate hazard nearby: fonts arrive <em>after</em> the ready signal, and text created too early genuinely does come out zero-sized. So an inline bounds check is a validator that reports every font as broken, forever, and points you at the wrong bug.</p>

      <p>Split creation and measurement across two messages.</p>

      <h2>5. <code>app.open(url)</code> is a silent no-op</h2>

      <p>The documented signature is <code>app.open(url, as, asSmart)</code>, where <code>asSmart</code> places the file into the current document as a Smart Object. That would be the ideal way to bring an asset in: one call, non-destructive, re-editable.</p>

      <p>It does nothing. It returns <code>"done"</code>, the document count is unchanged, the layer count is unchanged.</p>

      <p>My first theory was CORS, which is the usual suspect. It is not the answer. I served the asset from a local <code>127.0.0.1</code> HTTP server sending <code>Access-Control-Allow-Origin: *</code> and <code>Cross-Origin-Resource-Policy: cross-origin</code>, and tested with <code>asSmart</code> both true and false. Same result: <code>"done"</code>, nothing opened.</p>

      <p>The working route is to send the file as an <code>ArrayBuffer</code> over <code>postMessage</code>. That opens it as a <em>new document</em>, so getting it into an existing one costs a copy:</p>

      <pre><code>{`var scratch = app.documents[app.documents.length - 1];
app.activeDocument = scratch;
app.activeDocument.selection.selectAll();
app.activeDocument.selection.copy();
app.activeDocument = app.documents[BASE_INDEX];
app.activeDocument.paste();
try { scratch.close(); } catch (e) {}`}</code></pre>

      <p>Which leads directly to the next problem.</p>

      <h2>6. Documents cannot be identified by name, or by reference</h2>

      <p>Every file loaded through Live Messaging is named <code>"file"</code>. Not "cover.png" — <code>"file"</code>. Open two and you have two documents sharing a name, so any lookup keyed on <code>document.name</code> silently returns the wrong one. In my case that meant copying the background into itself instead of copying the asset.</p>

      <p>The obvious fix is identity comparison. That fails too:</p>

      <pre><code>{`for (var i = 0; i < app.documents.length; i++) {
  if (app.documents[i] === app.activeDocument) found = i;  // never true
}`}</code></pre>

      <p>Each property access returns a fresh wrapper, so the comparison is false for every <code>i</code>. Index is the only handle that holds. Record it before you open anything else, and note that a newly loaded document is appended to the end of <code>app.documents</code> and becomes active.</p>

      <h2>One more, for completeness</h2>

      <p><code>app.documents.add()</code> aborts the interpreter, in the same permanent way as finding #2. There are no scratch documents. If you need a throwaway layer to probe something — font readiness, for instance — create it in the open document and remove it afterwards.</p>

      <h2>The lesson under all six</h2>

      <p>Photopea's <code>"done"</code> means <strong>the message was processed</strong>. It does not mean the operation worked. Four of the six behaviours above return <code>"done"</code> while doing nothing at all, and one of them silently disables everything that follows.</p>

      <p>So the acknowledgement is not a result, and any automation built on it needs a second layer: after every mutating call, read back the specific thing it claimed to change — layer count, bounds, index, a pixel — and treat disagreement as a failure rather than a warning. That read-back layer is most of the work in driving this API, and it is the part a quick prototype never has.</p>

      <p>There is a wider point here that has nothing to do with Photopea. An API that fails by returning success is far more expensive than one that throws, because the cost lands hours later, in the wrong place, looking like a different bug. When you meet one, the read-back is not defensive programming. It is the only thing standing between you and a confident wrong answer.</p>

      <h2>Where this came from</h2>

      <p>These surfaced while building a small MCP server that lets an AI assistant compose layers onto an image without repainting it — assets placed as real layers, type set in real fonts, and the original pixels verifiably untouched. The findings outlived the project, which is why they are written down here.</p>

      <p>The code, including the read-back layer and the working import route, is at <a href="https://github.com/Mormolykos/overlayer" target="_blank" rel="noopener noreferrer">github.com/Mormolykos/overlayer</a> (MIT).</p>

      <p>If you have hit a seventh, I would like to know.</p>
    </article>
  );
};
