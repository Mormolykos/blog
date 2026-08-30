import React from 'react';

export const StructureNotScaleArticle: React.FC = () => {
  return (
    <article>
      <h1>My Headline Was +32 Points. Then I Audited My Own Scorer.</h1>
      <p><em>Over a five-document narrative corpus, 38 questions ask whether one event precedes another when the two are narrated in different documents and share no character, place or causal link. No passage states either relation. Given the passages, every model I tested scored 0 out of 38 and refused almost every time — correctly, because the answer is genuinely not in the text. Given the identical facts as a structured chronology, an 8B model scored 28 out of 38, matching a 14B model given prose. I published that on 30 August 2026. Then I audited the scorer and the question generator that produced it, and two of my published numbers moved.</em></p>
      <hr />

      <p>This is a paper note and a correction note at the same time, which is the only honest way to write it. The result held. The headline did not.</p>

      <h2>The question retrieval evaluation does not ask</h2>

      <p>Retrieval-augmented systems are measured almost entirely on whether the right evidence reaches the model. Recall at <em>k</em>, mean reciprocal rank, context precision — every one of them scores the retrieval step and then assumes that a model holding the right passages can produce the right answer.</p>

      <p>I wanted the other case. What happens when the right evidence <em>does</em> reach the model, and it still cannot answer, because the answer is a relation <em>between</em> passages rather than a statement inside any of them?</p>

      <p>Cross-document event ordering is a clean instance. Take two events narrated in different documents that share no character, no place and no causal link. Nothing in either passage says which came first. A reader who knows the whole work knows the ordering; the text, locally, does not contain it.</p>

      <h2>The setup</h2>

      <p>Five documents, <strong>260,204 words, 13,950 passages</strong>. Thirty-eight questions, each asking whether event A precedes event B across that boundary. Five models of one family — Qwen3, 0.6B through 14B — so that size varies and architecture does not.</p>

      <p>Each model saw the same questions twice. Once with the source passages as text. Once with the identical facts as a structured chronology block, compiled from an explicit state store.</p>

      <h2>The first result is a zero, and the zero is correct</h2>

      <p><strong>Given the passages, every model scored 0 out of 38.</strong> Refusal rates ran 92 to 100 per cent.</p>

      <p>I want to be careful about how that reads, because the obvious interpretation is the wrong one. This is not a failure. The models were asked something the supplied text does not establish, and they said so. A system that answered confidently here would be worse, not better.</p>

      <p>Given the same facts as structure, an 8B model scored <strong>28 out of 38 — 73.7 per cent</strong>.</p>

      <h2>Separating information from form</h2>

      <p>A structured block differs from prose in two ways at once: it may carry information the prose lacks, and it presents whatever it carries in a different shape. Those have to be pulled apart, so the ablation supplies the same ordering four ways.</p>

      <table>
        <thead>
        <tr><th>Condition</th><th>8B</th><th>14B</th></tr>
        </thead>
        <tbody>
        <tr><td>Passages only, no ordering supplied</td><td>0/38</td><td>0/38</td></tr>
        <tr><td>Ordering as an unsorted list</td><td>18/38</td><td>28/38</td></tr>
        <tr><td>Ordering as sorted prose</td><td>20/38</td><td>28/38</td></tr>
        <tr><td>Ordering as prose in order</td><td>22/38</td><td>28/38</td></tr>
        <tr><td>Ordering as a structured block</td><td><strong>28/38</strong></td><td>25/38</td></tr>
        </tbody>
      </table>

      <p><strong>At 14B the form is irrelevant.</strong> Plain prose, sorted prose and the structured block all reach 73.7 per cent. Give a large enough model the information in any shape and it uses it.</p>

      <p>At 8B the shape matters. The structured block leads the best prose condition by 6 items — 73.7 per cent against 57.9.</p>

      <p>The sentence I care about is the one that falls out of the two columns: <strong>an 8B model given structure matches a 14B model given prose.</strong> Both at 73.7 per cent. Structure substituted for roughly 6 billion parameters on this task.</p>

      <h2>The control that makes it a result rather than a coincidence</h2>

      <p>An obvious objection: these are published books. The model may simply recall the ordering from training and the block may be doing nothing.</p>

      <p>So I permuted the supplied story positions — same questions, same block format, ordering scrambled — and re-ran.</p>

      <p>Accuracy collapsed to <strong>10.5 per cent at 8B and 21.1 per cent at 14B</strong>. The models follow the ordering they are handed rather than reciting the one they were trained on. If they were recalling the books, scrambling the block would not have hurt them.</p>

      <h2>The realistic baseline fails in the more dangerous direction</h2>

      <p>Handing a model curated passages is not what a deployed system does. So I built the ordinary version: embed the corpus, retrieve top-<em>k</em>, answer from what comes back.</p>

      <p>It sits at the floor too. What is worth writing down is <em>how</em> it fails as you give it more.</p>

      <table>
        <thead>
        <tr><th>Passages retrieved</th><th>Refusal rate</th><th>Accuracy</th></tr>
        </thead>
        <tbody>
        <tr><td>4</td><td>97%</td><td>at chance</td></tr>
        <tr><td>8</td><td>—</td><td>at chance</td></tr>
        <tr><td>16</td><td>—</td><td>at chance</td></tr>
        <tr><td>32</td><td>50%</td><td>at chance</td></tr>
        </tbody>
      </table>

      <p>Tripling the context did not produce more correct answers. It produced <strong>more confident wrong ones</strong>. The refusal that was protecting the system at <em>k</em>=4 eroded as the window filled, and nothing replaced it. Retrieval coverage stayed flat at 20 of 38 across the whole sweep while token spend tripled.</p>

      <p>If you take one operational thing from this: adding context to a question your corpus cannot answer does not move you toward the answer. It moves you from a system that says “I don’t know” to one that asserts.</p>

      <h2>Then I audited the scorer, and my headline lost half its size</h2>

      <p>Version 1 of this paper reported the 8B form effect as <strong>+32 percentage points</strong>. That figure is now superseded, and the reason is a defect in my own scorer.</p>

      <p>The scorer was under-crediting the prose conditions — accepting a correct answer in one phrasing and failing the same answer in another. Re-scoring <strong>1,786 saved items</strong> produced <strong>30 gains and zero losses</strong>. It never once credited a wrong answer, which is why nothing published was inflated. Two things were understated, and correcting an understatement in the baseline shrinks the gap over it.</p>

      <p>Corrected, the three prose conditions rise: 36.8 to 47.4 per cent, 39.5 to 52.6, 42.1 to 57.9. The structured condition does not move at all. So the honest gap is <strong>6 items and 15.8 points, not 12 items and 32</strong> — roughly half what I published.</p>

      <p>The equivalence — 8B with structure matching 14B with prose, both at 73.7 per cent — is untouched by the audit. So is the 0/38, so is the permutation control, so is the retrieval floor.</p>

      <h2>The limitation that bounds the whole thing</h2>

      <p>The second audit finding is more serious than the first, and it is not a bug I can fix by re-running anything.</p>

      <p>For <strong>36 of the 38 questions, the gold answers derive from author-assigned story positions</strong> — integers in a schema field the schema itself marks as authored — rather than from evidence-backed relations. No evidence table references them. And the generator that emits the questions computes the gold from the same rows, then verifies itself by recomputing the gold from those same two integers. That check is circular.</p>

      <p>One gold is contradicted by the state store’s own records.</p>

      <p>So here is what this benchmark measures, stated plainly: <strong>agreement with an author-assigned ordering.</strong> It does not measure whether a system reports what the evidence establishes. The condition that behaves best by that second standard — full evidence, answering “not established” — scores zero here.</p>

      <p>That is a real bound on the commercial reading of this result, and I would rather write it myself than have it found.</p>

      <h2>What I did not do</h2>

      <p>I did not retract version 1. Its central claims survive intact; two numbers moved and both moved in the direction that shrinks my own effect. Retraction is for work that should not be relied on, and pulling it would make the record less useful rather than more. Version 1 stays up, version 2 carries the corrections in its own section, and both DOIs resolve.</p>

      <p>I also did not run the follow-up experiment the audit suggests. It is not needed for any claim that currently stands, and the clean version of the simultaneity test already exists in the repository unused. The version 1 claim that simultaneity fails universally turned out to be false — an 8B model reaches 4 of 10 when the answer category is offered in the prompt — but that subset is 10 ordered pairs over 4 events at a single story position, and it is underpowered in both directions. I now make no claim about simultaneity at all.</p>

      <h2>Sorting the evidence</h2>

      <p><strong>Measured, and unaffected by the audit:</strong> 0/38 with full evidence at four model sizes. 8B with structure at 28/38. The 73.7 per cent equivalence between 8B-with-structure and 14B-with-prose. The permutation collapse to 10.5 and 21.1 per cent. The retrieval floor and the refusal erosion from 97 to 50 per cent.</p>

      <p><strong>Corrected after publication:</strong> the three 8B prose cells, and with them the size of the form effect. 32 points became 15.8.</p>

      <p><strong>Bounded:</strong> everything above is scored against author-assigned orderings for 36 of 38 items. The one question class with a clean evidence-backed gold is temporal order proper.</p>

      <p><strong>Not claimed:</strong> anything about simultaneity as a capability. Anything about corpora other than this one. Anything about model families other than Qwen3.</p>

      <h2>What I would take from this</h2>

      <ul>
        <li><strong>Retrieval quality is not the only failure mode, and it may not be the interesting one.</strong> A perfect retriever handing over perfect passages still returns zero when the answer is a relation the passages do not contain.</li>
        <li><strong>More context can make a system worse in the way that costs you most.</strong> Refusal fell from 97 per cent to 50 while accuracy stayed at chance. The extra tokens bought confidence, not correctness.</li>
        <li><strong>Structure can substitute for scale, and the substitution has a size.</strong> On this task it was worth about 6 billion parameters — and the effect disappears entirely once the model is large enough to parse prose properly.</li>
        <li><strong>Audit the scorer before you trust the score.</strong> Mine was conservative, which is the good direction, and it still moved three published numbers.</li>
        <li><strong>Check where your gold answers come from.</strong> If the generator computes the gold and then verifies itself against the same rows, you have measured your generator.</li>
        <li><strong>Correct in place rather than retracting.</strong> A paper with a visible correction section is more useful than a clean one you cannot check.</li>
      </ul>

      <p>The honest summary: the result I set out to test survived an attack on it, the headline number I led with did not, and the benchmark measures something narrower than the sentence I would like to write about it.</p>

      <p>Paper, data and code: <a href="https://doi.org/10.5281/zenodo.22169643">10.5281/zenodo.22169643</a>.</p>
    </article>
  );
};
