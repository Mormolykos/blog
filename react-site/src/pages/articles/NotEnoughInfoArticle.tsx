import React from 'react';

export const NotEnoughInfoArticle: React.FC = () => {
  return (
    <article>
      <h1>The Less the Text Said, the More Sure It Got</h1>
      <p><em>I measured whether a contradiction detector knows when it cannot tell. On the standard benchmark, 77% of the pairs do not contain what a verdict would need — and seven of eight model runs asserted contradiction <strong>more</strong> often on exactly those pairs. Telling the model to be conservative raised its refusal rate by forty points and did not change the direction at all.</em></p>
      <hr />

      <p>Ask a language model whether two scientific findings contradict each other and it will compare two sentences. But two published findings can differ because the populations differ, the dose differs, the instrument differs, or the definition differs — and none of those is a contradiction. Before you can ask whether two results conflict, you have to establish that they were ever about the same thing.</p>

      <p>That step has a name in evidence synthesis — comparability — and benchmarks supply it by construction. <a href="https://doi.org/10.1186/s13326-016-0083-z">ManConCorpus</a> groups claims under an expert-written PICO question, and its annotators read whole abstracts before labelling anything. Their labels are sound.</p>

      <p>But what the corpus <em>ships</em>, and what every downstream system consumes, is a single claim sentence. So the question I set was narrower than "is this a contradiction":</p>

      <blockquote><p>Reading only the claim sentences, is there enough stated to establish that the two findings concern the same conditions at all?</p></blockquote>

      <h2>First: what a claim sentence actually says</h2>

      <p>I annotated each of the 259 claims for six comparability axes, with one hard rule: an axis the sentence does not state is recorded as <strong>not stated</strong>, never inferred. Nulls are the measurement.</p>

      <table>
        <thead>
          <tr><th>Axis</th><th>Stated in the sentence</th></tr>
        </thead>
        <tbody>
          <tr><td>outcome measure</td><td>98.5%</td></tr>
          <tr><td>intervention</td><td>76.4%</td></tr>
          <tr><td>population</td><td>69.9%</td></tr>
          <tr><td>conditions</td><td>32.0%</td></tr>
          <tr><td>methodology</td><td>13.5%</td></tr>
          <tr><td>measurement</td><td>8.1%</td></tr>
        </tbody>
      </table>

      <p>Of the 728 opposed pairs — the ones the corpus flags as potentially contradictory — <strong>561, or 77.1%, never state population, intervention or outcome measure on at least one side.</strong> Population is the biggest hole, missing in 55.9% of pairs.</p>

      <p>None of that is a criticism of the corpus. It is a measurement of what survives into the unit of text that later systems are handed.</p>

      <h2>The deterministic version returns nothing</h2>

      <p>I have a claim layer that refuses to call a pair contradictory unless the comparability axes are recorded on both sides and agree. Run against these 728 pairs it returns <strong>zero contradictions</strong>. Recall zero, precision undefined.</p>

      <p>My first instinct was that this was string matching failing, and the sharpest example makes that hard to argue with:</p>

      <pre><code>{`[YS] population='patients with HCM'   outcome='adverse outcome'
[NO] population='HCM patients'        outcome='adverse prognosis'
      -> "the claims differ on population, outcome_measure"`}</code></pre>

      <p>Identical population, word order reversed, ruled a different study. And a softer matcher does not rescue it: median token overlap between the stated axes of an opposed pair is <strong>0.000</strong>, and accepting <em>any shared token whatsoever</em> across all three axes recovers four pairs out of 728.</p>

      <p>But when I audited my own numbers I found something cleaner and slightly embarrassing. <strong>Zero pairs state all six axes on both sides.</strong> Not "few" — zero. So the deterministic layer could never have returned a contradiction on this corpus regardless of how the strings were compared. The 0-of-728 follows from the booleans alone. The string-matching story was true but it was not the reason.</p>

      <h2>Then: what a model does with the same input</h2>

      <p>Two local models — qwen3:14b and qwen3:8b — judged all 728 pairs with three allowed answers: CONTRADICTION, NO_CONTRADICTION, NOT_ENOUGH_INFO. Each was given exactly what the deterministic layer got: the research question and the two sentences. Nothing else.</p>

      <p>My first run used one prompt, and it showed something I wrote up as insensitivity: the rate of "not enough information" was statistically indistinguishable between pairs that stated their conditions and pairs that did not (p = 0.469 and p = 0.791). Models answering the same way whether or not the evidence was there.</p>

      <p>That was the weakest version of the result, and it was a property of one prompt. The obvious rebuttal is <em>"you just prompted it badly — tell it to be conservative and it will refuse properly."</em> So I wrote four prompts, fixed them before running anything, and ran all four against both models.</p>

      <ul>
        <li><strong>p0</strong> — the original, re-run as a replication</li>
        <li><strong>p1</strong> — lists the conditions that must be present and requires NOT_ENOUGH_INFO if any is absent</li>
        <li><strong>p2</strong> — forbids using any knowledge outside the supplied sentences</li>
        <li><strong>p3</strong> — instructs conservative adjudication, preferring NOT_ENOUGH_INFO</li>
      </ul>

      <p>5,824 judgements. Zero unparsed replies. All eight variants are reported below; none was selected after the fact.</p>

      <h2>Caution works on the rate</h2>

      <p>The rebuttal is right about the thing it is most obviously right about. Refusal moves enormously:</p>

      <table>
        <thead>
          <tr><th>NOT_ENOUGH_INFO rate</th><th>original prompt</th><th>cautious prompt</th></tr>
        </thead>
        <tbody>
          <tr><td>qwen3:14b</td><td>28.4%</td><td>70.3%</td></tr>
          <tr><td>qwen3:8b</td><td>19.6%</td><td>86.3%</td></tr>
        </tbody>
      </table>

      <p>Forty and sixty-seven points. If you wanted a model that says "I can't tell" more often, you have one.</p>

      <h2>And it does nothing to the direction</h2>

      <p>Here is every run, split by whether the sentences state all three of population, intervention and outcome measure on both sides. Correct behaviour is a <em>negative</em> difference — assert contradiction <em>less</em> often when the conditions are missing.</p>

      <table>
        <thead>
          <tr><th>Run</th><th>CONTRADICTION when stated</th><th>when missing</th><th>difference</th></tr>
        </thead>
        <tbody>
          <tr><td>14b · original</td><td>40.1%</td><td>39.4%</td><td>−0.7 pp</td></tr>
          <tr><td>14b · caution</td><td>11.4%</td><td>21.2%</td><td><strong>+9.8 pp</strong> (p=0.004)</td></tr>
          <tr><td>14b · strict evidence</td><td>17.4%</td><td>25.3%</td><td><strong>+7.9 pp</strong> (p=0.033)</td></tr>
          <tr><td>14b · conservative</td><td>24.0%</td><td>30.3%</td><td>+6.4 pp</td></tr>
          <tr><td>8b · original</td><td>19.2%</td><td>25.7%</td><td>+6.5 pp</td></tr>
          <tr><td>8b · caution</td><td>0.0%</td><td>1.6%</td><td>+1.6 pp</td></tr>
          <tr><td>8b · strict evidence</td><td>12.0%</td><td>17.6%</td><td>+5.7 pp</td></tr>
          <tr><td>8b · conservative</td><td>9.0%</td><td>16.6%</td><td><strong>+7.6 pp</strong> (p=0.015)</td></tr>
        </tbody>
      </table>

      <p><strong>Seven of eight runs point the wrong way</strong> — contradiction asserted more often precisely where the text says less. Sign test across runs, one-sided, p = 0.035. And the inversion is <em>largest</em> under p1, the most cautious prompt I wrote.</p>

      <p>So the answer to "you just prompted it badly" is: a better prompt raises refusal by forty points and leaves the direction untouched, or worse.</p>

      <h2>A guess at why, which I have not tested</h2>

      <p>When the conditions are stated, a model can see that they differ — "Korean women" against "Mexican Mestizo population" — and it refuses. When the conditions are absent there is nothing visible to differ, so two bare opposing claims read as a clean conflict.</p>

      <p>On that account the model is not reasoning about evidence at all. It is reacting to the presence of visible obstacles, and <strong>absence of stated conditions is being treated as absence of confounds</strong>. That would explain the sign, but it is a hypothesis and I want to be clear that it is one. Testing it needs pairs whose conditions are stated <em>and identical</em>, and this corpus contains four.</p>

      <h2>The part I keep coming back to</h2>

      <p>Prompt wording alone changes <strong>45% of the verdicts</strong> on the same model at temperature 0. Two models on the same prompt agree on 61%. And the single largest disagreement between the two models is 115 pairs where the larger one says <em>"I cannot tell"</em> and the smaller says <em>"they do not conflict"</em>.</p>

      <p>That last one is the whole problem in one row. An absent value being reported as a negative finding. Not "I don't know" — "no".</p>

      <h2>What this does and does not license</h2>

      <p>It does <strong>not</strong> say the models are wrong on any particular pair. There is no ground truth for true contradiction here, and a model may well be right from memorised knowledge of the underlying literature; this design cannot tell that apart. It does not say the corpus is mislabelled. The claim is narrower and it is about <em>warrant</em>: a verdict asserted where the supplied text does not state what would be needed to rule out a difference in setup.</p>

      <p>Other things I would rather say myself than have someone find. Only three of the eight runs reach p &lt; 0.05 on their own, and sixteen tests were run across the matrix, so the direction claim rests on the sign test rather than on any single run. Pooling the runs gives +5.6 pp at z = 4.4 and I am deliberately not quoting that as a result, because the eight runs share the same 728 pairs and are not independent. Two models, one family, one quantisation. The axis annotation is by one model, checked against an independent re-run that agreed on 97.5% of the null decisions — not by human annotators.</p>

      <p>And one thing went wrong mechanically, which is worth recording because the fix is the interesting part. My first extraction run fired 259 API calls flat out and 119 were refused by a rate limit. The survivors were not a smaller sample, they were a <em>biased</em> one — whichever calls landed between throttles, which correlates with position in the file and therefore with topic. I threw that run away rather than patching it and re-ran paced, with zero errors. A partial run is not a small run.</p>

      <h2>The shape of it</h2>

      <p>Neither approach works, and they fail as mirror images. The deterministic check refuses everything, because no pair supplies what it asks for. The models answer everything, and answer more confidently where the text says least.</p>

      <p><strong>The bottleneck is not detecting contradiction. It is establishing that two findings were ever about the same thing — and the sentences do not contain what that requires.</strong></p>

      <p>Everything runs locally. 5,824 judgements on a consumer GPU, no API key read anywhere, and an audit script that recomputes every number in the write-up from the raw files and prints PASS or FAIL — it re-derives the checkable split independently rather than trusting the flag stored in the result files. The corpus is not redistributed; a fetch script pulls it from the authors' page and verifies its SHA-256.</p>

      <p>Source and data: <a href="https://github.com/Mormolykos/warrant">github.com/Mormolykos/warrant</a>.</p>

      <p>If you run contradiction detection, claim verification or conflict surfacing over retrieved documents, I would like to know whether you see the same sign — particularly if you have ground truth I do not, or a prompt that moves the direction rather than the rate. That last one is the result I could not produce.</p>
    </article>
  );
};
