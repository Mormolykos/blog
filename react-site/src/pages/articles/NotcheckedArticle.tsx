import React from 'react';

export const NotcheckedArticle: React.FC = () => {
  return (
    <article>
      <h1>The Same Bug, Four Times, Three of Them Mine</h1>
      <p><em>A validator that reports a verdict without reporting its coverage is asserting something it did not measure. I found that in four systems before I admitted it was one problem.</em></p>
      <hr />

      <p>Most validation tooling has two states: it passed, or it failed. Everything that was not actually evaluated has to be forced into one of them — and it is wrong in both directions.</p>

      <p>I did not work that out from first principles. I worked it out by shipping the same defect four times.</p>

      <h2>One: a run that learned nothing, reported as healthy</h2>

      <p>In <a href="/trainproof/">trainproof</a>, a training run whose loss was exactly <code>0.0</code> on every step returned <strong>PASS</strong>.</p>

      <p>Every loss-shape check in that tool is guarded against dividing by zero. A curve that is identically zero trips every guard, so all of them skipped — silently. And then the report listed those same skipped checks as having <em>run</em>. A run that learned nothing passed, accompanied by a list of the checks that had cleared it.</p>

      <p>That is the whole problem in one artifact. The tool had no way to say <em>I could not judge this</em>, so the absence of a judgement rendered as a favourable one.</p>

      <h2>Two: the same tool, one loop earlier</h2>

      <p>The fix for that was a report field listing which checks ran and which did not. Good. Then a nastier version turned up somewhere else entirely.</p>

      <p><code>trainproof doctor</code> walks a directory twice — once to discover candidate logs, once to judge them. The judging pass reported anything it could not read. The discovery pass had <code>except Exception: pass</code>.</p>

      <p>So a file that raised <em>while being found</em> never became a candidate, and never appeared in the report at all. Plainly visible on disk. Absent from the output. Indistinguishable from a file that passed.</p>

      <p>Same failure as the first, one loop earlier than I had been looking. That is when I stopped treating it as a bug.</p>

      <h2>Three: not my system</h2>

      <p>I wrote the first two up publicly. Someone working on infrastructure compliance replied with the identical shape from a domain I know nothing about.</p>

      <p>A compliance framework document is mostly prose. Most of it describes things no generated artifact can satisfy or violate — staff training, review procedures, who signs what. Only a fraction maps to something a machine can check.</p>

      <p>The trap is reporting against the framework's name. Do that and everything unevaluated looks identical to everything that passed, and the ninety per cent that was never in scope disappears from the output entirely.</p>

      <p>That exchange is why this became a library rather than another <code>trainproof</code> feature. One person hitting a shape twice is a habit. Two people hitting it in unrelated domains is a primitive.</p>

      <h2>Four: found while I was busy being pleased with myself</h2>

      <p>Then I ran an evaluation harness of my own over a retrieval experiment, and found three instances in a single afternoon.</p>

      <p>It recorded model refusals under a failure type asserting an ordering the model had never given. It scored ten refusals as <strong>correct</strong>, because the expected phrase appeared inside the sentence explaining what could not be determined. And it missed eight correct answers because its negative pattern required a comma — so <em>"No. The voice speaks at 3600, before the whisper"</em> matched nothing and was marked wrong.</p>

      <p>One absent value. Wrong in both directions. Inside the instrument I was using to judge my own hypothesis.</p>

      <h2>What the states actually are</h2>

      <p>Three instead of two — checked, could-not-check, never-in-scope — and eight once you ask two more questions of each gap: <strong>who can fix it</strong>, and <strong>can it ever change</strong>.</p>

      <table>
        <thead>
          <tr><th>state</th><th>owner</th><th>does it move?</th></tr>
        </thead>
        <tbody>
          <tr><td><code>CHECKED</code></td><td>—</td><td>a determination was made</td></tr>
          <tr><td><code>NOT_CHECKED / DATA_DEGENERATE</code></td><td>the data</td><td>with better data</td></tr>
          <tr><td><code>NOT_CHECKED / CHECKER_FAILED</code></td><td>your tooling</td><td>when you fix it</td></tr>
          <tr><td><code>NOT_CHECKED / WAIVED</code></td><td>a named person</td><td>at expiry</td></tr>
          <tr><td><code>NOT_CHECKED / PREREQUISITE_FAILED</code></td><td>another target</td><td>when that one is fixed</td></tr>
          <tr><td><code>OUT_OF_SCOPE / CALLER</code></td><td>the caller</td><td>next invocation</td></tr>
          <tr><td><code>OUT_OF_SCOPE / DATA_TRANSIENT</code></td><td>the deployment</td><td>when it changes</td></tr>
          <tr><td><code>OUT_OF_SCOPE / DATA_PERMANENT</code></td><td>nobody</td><td>never</td></tr>
        </tbody>
      </table>

      <p>The owner column is the point. Two gaps sharing a bucket hand the reader a to-do they cannot action — <em>"accept the gap"</em> and <em>"fix your parser"</em> are opposite instructions, and only one of them will ever change on its own. A test enforces that no two states share both an owner and a remediation.</p>

      <h2>Then I attacked it, and it did not survive</h2>

      <p>Before publishing anything I tried to break the design. Twice. Both attacks landed.</p>

      <p><strong>The API attack found five holes, and two of them were the library committing its own thesis error one level up.</strong></p>

      <p>Declare every target out of scope and the evaluable denominator went to zero — and it <strong>exited 0</strong>. A report that judged nothing read as green. Worse: I had written a test asserting that as correct behaviour, so the bug was encoded as intent.</p>

      <p>And a target that never became a record was invisible. The report claimed perfect coverage. That is failure two, from the top of this article, unprevented by the library written because of it.</p>

      <p>Also: duplicate targets counted twice in silence; <code>failing_verdicts</code> defaulted to <code>{"{"}"FAIL"{"}"}</code>, so a compliance tool emitting <code>NON_COMPLIANT</code> exited 0 on real failures; and <code>frozen=True</code> protected the binding but not the dict behind it.</p>

      <p><strong>The taxonomy attack was the useful one.</strong> Twenty-four realistic cases across ML training, compliance, RAG evaluation, CI/CD and production monitoring. Twelve fit exactly one state. <strong>Five fit none.</strong> Four fit two.</p>

      <p>Two of the five needed new states. A <strong>waived</strong> control is in scope, is applicable, and was deliberately not evaluated by a named person — filing it under "not requested" is false, and it removes the control from the denominator, which is exactly where an accepted risk goes to hide. And a check skipped because a <strong>prerequisite failed</strong> is not a broken checker; calling it one sends someone to debug a parser that works.</p>

      <p>The other three needed rules, not states. One matters more than the rest:</p>

      <blockquote>
        <p><strong>Unreachable is not unhealthy.</strong> A health check that could not observe its target has made no determination. Reporting that as a failing verdict is this library's own error wearing a different costume.</p>
      </blockquote>

      <p>That one was a single commit from shipping as a feature.</p>

      <h2>What it cannot do, largest first</h2>

      <p><strong>A misconfigured check reports <code>CHECKED</code>.</strong> If your threshold is wrong, the check runs, produces a meaningless number, and this library faithfully records a clean determination. It accounts for what your checks report. It cannot know whether a check is meaningful, and nothing in it mitigates that.</p>

      <p>It has no notion of history, so it will not notice a flake. It has no sub-target granularity, so a checker that sampled ten per cent of a target reports <code>CHECKED</code> for all of it. Evidence freshness is invisible. And <code>expected</code> — the fix for the vanished-target hole — is only as good as the target list you declare.</p>

      <h2>Why this is a schema and not a feature</h2>

      <p>Every instinct I had said to fix it in <code>trainproof</code> and move on. I had already done that twice, and the second fix did not prevent the third or fourth instance, because the bug is not in any of those tools. It is in the shape of the report they all produce.</p>

      <p>The library is small on purpose — an enum, a record, a reporter that derives its counts rather than storing them. The value is in the vocabulary being right, and in having been proven wrong twice before anyone else saw it.</p>

      <p><a href="https://github.com/Mormolykos/notchecked">github.com/Mormolykos/notchecked</a> — MIT, no dependencies. The ownership axis and the four-state split are mine; the fixed reason vocabulary, counts-from-rows and the permanence split came from the compliance side of that conversation, and are credited in the README.</p>
    </article>
  );
};
