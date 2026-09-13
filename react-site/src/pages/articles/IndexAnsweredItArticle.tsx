import React from 'react';

export const IndexAnsweredItArticle: React.FC = () => {
  return (
    <article>
      <h1>I Abandoned a Study Because the Index Already Answered It. Then I Checked the Index.</h1>
      <p><em>A code-intelligence tool indexes your repository and answers questions about it. The obvious objection to benchmarking a language model on graph reachability is that nobody would ask a model — the index answers it exactly, in microseconds. That objection was strong enough to stop a study I had already built the apparatus for. Before dropping it I ran the index. Its knowledge graph turned out to have no function-level nodes at all, so the question I was told it answered perfectly is one it does not answer. Two bugs fell out on the way. Both are now filed, both were confirmed by the maintainer at source level, and one of his answers is the part worth keeping.</em></p>
      <hr />

      <p>This is a note about checking a premise, and about a specific failure mode that has nothing to do with the tool it was found in: <strong>a system can hand you a correct answer attached to a reason that is fabricated, and give you no way to tell.</strong></p>

      <h2>The premise that stopped the study</h2>

      <p>I had built a benchmark apparatus to ask whether a language model, handed a code graph as text, can determine that one function is reachable from another. Gold computed by traversal, contamination controls, a permuted-graph control, a closed-book positive control. No model had been called yet.</p>

      <p>Then the objection arrived, and it was a good one. <em>Nobody asks a language model whether X is reachable from Y.</em> A code index answers that exactly and instantly. Whatever number the study produced, positive or negative, it would change nobody's decision — because the capability is already solved by a lookup.</p>

      <p>That is a study-killing objection and I accepted it. But it rests on a factual claim about what an index does, and I had not checked the claim. So before dropping the work I installed <a href="https://github.com/Muvon/octocode">octocode</a> 0.23.1, indexed eighteen small Python files, and asked its knowledge graph a reachability question.</p>

      <h2>The graph has no function-level nodes</h2>

      <pre><code>Loaded GraphRAG knowledge graph with 18 nodes and 4 relationships
Node Types:          - file: 18 nodes
Relationship Types:  - calls: 4 relationships</code></pre>

      <p>Eighteen nodes for eighteen files. Every node is a <em>file</em>. There is no node for a function, and therefore no <code>calls</code> edge between two functions.</p>

      <p>So <em>"is <code>dispatch</code> reachable from <code>main</code>"</em> is not answered slowly or approximately by this graph. It is outside what the graph represents. The control file in my corpus containing the textbook chain <code>a → b → c → d</code> — four functions, no dynamism, deliberately trivial — returns <strong>no relationships at all</strong>, because every edge in it is intra-file and a file-node graph has nowhere to put those.</p>

      <p>The premise that killed the study was false for the tool it was about. That does not automatically revive the study, and I will come back to why. It does mean the objection has to be re-argued rather than assumed.</p>

      <h2>The first bug: a function that calls itself resolves to someone else</h2>

      <p>While mapping what the graph did represent, an edge appeared that could not be right. Two files, no imports between them, connected by <code>calls</code>.</p>

      <p>The minimal reproduction is five lines:</p>

      <pre><code>{`mkdir demo && cd demo
printf 'def target():\\n    return 1\\n\\ndef main():\\n    target()\\n' > a.py
printf 'def target():\\n    return 2\\n' > b.py
octocode config --graphrag-enabled true
octocode index --no-git
octocode graphrag get-relationships --node-id a.py`}</code></pre>

      <p>This reports <code>calls → b (b.py): a calls target</code>. But <code>a.py</code> defines <code>target()</code> three lines above the call site and never imports or mentions <code>b.py</code>. The call binds locally. The edge points somewhere else.</p>

      <p>My first write-up said the trigger was a name collision. An independent audit of my own work showed I had never varied the thing that actually controls it. Same package, one variable changed:</p>

      <table>
        <thead>
          <tr><th>Other files defining the name</th><th>Result</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td><code>a.py → b.py</code> — the wrong file</td></tr>
          <tr><td>2</td><td>no relationship</td></tr>
          <tr><td>3</td><td>no relationship</td></tr>
        </tbody>
      </table>

      <p><strong>The local definition is never the answer.</strong> With one competing definer, that file wins. With two or more, the resolution abstains and the valid local call is dropped entirely. Package structure changes nothing — I had briefly believed it did, and that was wrong too.</p>

      <p>Muvon, octocode's maintainer, confirmed it and named the line: <code>select_scoped_targets</code> in <code>src/indexer/graphrag/relationships.rs</code> filters the source file out of the candidate list <em>in both passes</em>, so a file can never resolve against itself. Suppressing the self-edge at the call site is correct. Falling through to the cross-file pass when the symbol already binds locally is not.</p>

      <h2>The second bug, and the part that generalises</h2>

      <p>In a small package, two files each import a third. <code>api.py</code> imports both <code>core.base</code> and <code>utils.auth</code>. <code>auth.py</code> imports only <code>core.base</code>. Nothing imports in the other direction.</p>

      <pre><code>{`api.py  → auth.py   "Imports ..core.base from app\\utils\\auth.py"
auth.py → api.py    "Imports app.core.base from app\\handlers\\api.py"`}</code></pre>

      <p>Two problems sit on top of each other.</p>

      <p><strong>The reverse edge does not exist in the source.</strong> <code>auth.py → api.py</code> is not an import in any form. The two files share an import of <code>base</code>, and that appears to have produced a link between the importers.</p>

      <p><strong>And the descriptions name the wrong files.</strong> The first says <code>auth.py</code> imports <code>..core.base</code>, but <code>auth.py</code> contains no relative import at all. The second says <code>api.py</code> imports <code>app.core.base</code>, but <code>api.py</code>'s import of base is the relative form. Each string attributes the other file's syntax to the file it names. The maintainer's diagnosis: the description is built as <code>format!("Imports &#123;&#125; from &#123;&#125;", import, target_id)</code>, pairing the source file's import string with the target's name.</p>

      <p>Now the part I actually care about. <strong><code>api.py → auth.py</code> is a genuine import.</strong> That edge is correct. Its stated reason is not — the reason names a module that has nothing to do with why those two files are connected.</p>

      <p>So the output contains a true fact justified by a false one, and nothing distinguishes that from a true fact justified by a true one. Score the endpoints and it passes. Read the reasons and it does not.</p>

      <h2>What the maintainer said, which is the most useful sentence in this whole exercise</h2>

      <p>I asked him directly whether the explanation string is meant to be authoritative evidence for the edge or a descriptive label. His answer:</p>

      <blockquote>
        <p>Treat that string as a descriptive label. Nothing in the code makes it authoritative, so an agent reasoning from it is reasoning from a promise we never made.</p>
      </blockquote>

      <p>That is a maintainer stating plainly that a field which looks like evidence is not evidence, and that the guarantee a consumer might infer was never offered. He is right, and he is right in a way that indicts the consumer rather than the tool.</p>

      <p>It generalises immediately. Retrieval systems return a passage <em>and a relevance score</em>. Agents return an answer <em>and a citation</em>. Knowledge graphs return an edge <em>and a justification</em>. In every case the second field is easy to display, easy to log, easy to feed into a downstream model — and in every case it may carry no promise whatsoever. <strong>The failure is not that the reason is wrong. It is that a wrong reason and a right one look identical.</strong></p>

      <p>Both findings are filed: <a href="https://github.com/Muvon/octocode/issues/85">issue #85</a> and <a href="https://github.com/Muvon/octocode/issues/86">issue #86</a>.</p>

      <h2>Why both bugs were in Python, which the maintainer volunteered</h2>

      <p>Python and markdown are the only two language modules in octocode's tree with no test file beside them. Python is the least-exercised parser they ship.</p>

      <p>I would not have known that, and it changes how the findings should be read. They are not evidence that the graph is broadly unreliable. They are evidence about the least-covered parser in a multi-language tool, found by pointing adversarial input at it. That is a smaller claim and it is the true one. He gave it up unprompted, against his own interest, which is worth recording.</p>

      <h2>Three things I got wrong on the way here</h2>

      <p><strong>I claimed the collision alone was the trigger.</strong> Every variant in my ladder had exactly one competing file, so the count was never varied and the claim was wider than the evidence. Corrected after an independent audit of my own harness.</p>

      <p><strong>I claimed the counts were a floor on what any static indexer misses.</strong> Not earned. Tree-sitter is a parsing library; an application built on it can add any resolution it likes. The floor holds for the resolution strategy I tested and transfers to nothing else without measurement.</p>

      <p><strong>A second agent auditing my harness introduced a defect while fixing another one</strong> — it gave the tracer a node name the static reader could never produce, and an ordinary list comprehension began reporting two missed edges. Code every analyser on earth handles correctly. Caught by a third pass, which is the entire argument for having one.</p>

      <h2>The third finding, which is the one worth keeping</h2>

      <p>0.24.0 shipped while this was being written, so I pre-registered a prediction about it — hashed and frozen before the new binary was on the machine — and re-ran everything against a real Rust workspace instead of eighteen toy files.</p>

      <p>Fifteen intra-crate import statements that produced an edge on 0.23.1 produced none on 0.24.0. That looked like a regression of fifteen. It was not. Six were genuine resolution failures — <code>crate::Url</code> from five different files, where the walk never tries the crate root. <strong>Seven were not failures at all: the edge was still there and only the statement had vanished.</strong> Two were actually gone. So the regression is two, not fifteen — the third time that number came down, each time because I checked one layer further rather than publishing the first defensible figure.</p>

      <p>The seven are the interesting ones. The store keeps one edge per <code>(source, target, relation_type)</code>, and the description — the only field that says <em>which</em> import — is not in that key. Two import statements between the same ordered pair of files collapse into one, and the survivor is whichever the sort happened to leave standing. That is why the same statement resolves from one file and disappears from another: <code>crate::host::HostInternal</code> survives from <code>lib.rs</code> and dies from <code>parser.rs</code>, because in <code>parser.rs</code> it is competing with <code>crate::host::Host</code> and in <code>lib.rs</code> it is not.</p>

      <p>The maintainer named the dedupe and told me the sort was unstable, which retracted three denominator analyses I had already written. I confirmed the instability from outside: two clean runs of the <em>same</em> 0.23.1 binary produced different surviving symbols.</p>

      <p><strong>And this is the part that generalises past this tool.</strong> A statement that resolved and was then merged away leaves exactly what a statement that never resolved leaves, which is nothing. Both render as a file with no imports. The graph cannot tell the two apart, and neither can anything built on top of it — so a missing edge carries no information about whether anything was missing.</p>

      <p>Then the fix nearly reproduced the bug. I suggested carrying a count of how many statements collapsed into each surviving edge: not a recovery, but enough to turn "this file imports one thing from that file" into "three imports, two not shown". The maintainer pointed out the field already existed and was already named for it — <code>weight: f32</code>, commented "Relationship strength/frequency", set once at construction and never touched by the merge. It looked free. Then he went and checked, and found <code>search.rs:358</code> scoring neighbours with <code>rel.weight * rel.confidence</code>. Folding a count into it would have silently reweighted every search result, and a weight of 3 would have meant two different things depending on which code path wrote it. <strong>The same defect, one level down, introduced by the repair for it.</strong></p>

      <h2>What this does not show</h2>

      <p>Not that octocode's file-level graph is inaccurate in general. Eighteen single-file cases with almost no imports is a deeply unfair corpus for a graph whose nodes are files, and its accuracy on a real repository is unmeasured.</p>

      <p>Not that the tool is bad at its job. Its job is helping an agent find code — semantic search, structural AST search, signatures, LSP. I exercised two of those surfaces and can say nothing about the rest.</p>

      <p>Not that the abandoned study is revived. The premise that killed it was false for this tool, but the study had a second, independent problem: on real Python a static call graph misses dynamic dispatch, decorators, callbacks and <code>getattr</code>, so a model that genuinely understands the code disagrees with the parser and is marked wrong — biasing a model-size comparison toward the result I had predicted. That one is still fatal and no amount of checking premises fixes it.</p>

      <h2>The thing I would take from this</h2>

      <p>The objection that stopped the study was correct in form and false in fact, and it cost nothing to check. One install, one index, one query.</p>

      <p>I nearly did not run it. The argument was good, it came from someone who knew the domain, and accepting it felt like discipline rather than laziness. <strong>The cheapest measurement in this entire exercise was the one I almost skipped because a plausible sentence had already answered it.</strong></p>

      <hr />
      <p><strong>Findings:</strong> <a href="https://github.com/Muvon/octocode/issues/85" target="_blank" rel="noopener noreferrer">issue #85</a> and <a href="https://github.com/Muvon/octocode/issues/86" target="_blank" rel="noopener noreferrer">issue #86</a>, both confirmed at source level by the maintainer, who also located <code>search.rs:358</code> himself and said so publicly. Every measurement here was made against a pinned build, from outside, with no access to the source.</p>
      <p>I do this deliberately, to other people's systems, as paid work: two weeks against one retrieval or agent system, every finding delivered with the exact commands to reproduce it and an explicit statement of what it does not show. <a href="https://bedvibe.studio/#audit">Scope and price</a>.</p>
    </article>
  );
};
