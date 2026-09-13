import React from 'react';

export const RetrievalAblationArticle: React.FC = () => {
  return (
    <article>
      <h1>I Assumed My Retriever Failed at Stage One. The Bigger Failure Was at Stage Three.</h1>
      <p><em>Hierarchical retrieval came third of five on a 240,767-word corpus, behind a much simpler baseline. I blamed chapter selection. A stage-level ablation over 80 questions and 400 scored rows says chapter selection cost me 27 questions — and neighbour expansion, the last stage, cost me 32. Turning that stage off raised recall from 0.3365 to 0.4771 and drew level with the baseline I was losing to.</em></p>
      <hr />

      <p>Hierarchical retrieval is supposed to help on long documents. Pick the right chapter first, then search inside it. Narrow the haystack, then find the needle.</p>
      <p>On my long-book benchmark it came <strong>third of five</strong>, beaten by a chapter-summary chain and by flat chunk RAG, and only barely ahead of naively grabbing the end of the book.</p>

      <table>
        <thead>
          <tr><th>method</th><th>context precision</th><th>context recall</th></tr>
        </thead>
        <tbody>
          <tr><td><code>naive_first_context</code></td><td>0.1475</td><td>0.1458</td></tr>
          <tr><td><code>naive_last_context</code></td><td>0.4150</td><td>0.3302</td></tr>
          <tr><td><code>flat_chunk_rag</code></td><td>0.3375</td><td>0.4302</td></tr>
          <tr><td><code>chapter_summary_chain</code></td><td>0.4000</td><td><strong>0.4771</strong></td></tr>
          <tr><td><code>hierarchical_book_rag</code></td><td>0.3475</td><td>0.3365</td></tr>
        </tbody>
      </table>

      <p>My hypothesis was <strong>error compounding</strong>, and it is the obvious one: if the first stage picks the wrong chapter, every later stage is searching the wrong text, and no amount of good ranking inside that chapter can recover.</p>
      <p>That hypothesis turned out to be true and incomplete, which is a worse outcome than being wrong — it would have sent me to fix the right thing for the wrong reason, and stop there.</p>

      <h2>The ablation</h2>
      <p>Same corpus, same 80 gold questions, nothing about the manuscript or the questions touched. Five variants, 400 scored rows.</p>
      <ul>
        <li><code>hier_current</code> — the original pipeline: chapter selection, chunk retrieval, neighbour expansion.</li>
        <li><code>hier_no_neighbors</code> — identical, with neighbour expansion switched off.</li>
        <li><code>chapter_summary_chain</code> — the baseline that was beating it.</li>
        <li><code>hier_oracle_chapter</code> — a diagnostic that is <em>given</em> the correct chapter and retrieves only inside it.</li>
        <li><code>hier_oracle_chapter_neighbors</code> — the same, with neighbour expansion back on.</li>
      </ul>
      <p>The oracle variants are not retrieval methods. They cannot be deployed — they read the gold chapter label. Their only job is to measure how much is lost <em>before</em> the chapter-selection stage versus <em>after</em> it.</p>

      <h2>What came back</h2>
      <table>
        <thead>
          <tr><th>method</th><th>recall</th><th>precision</th><th>hit@1</th><th>hit@3</th><th>hit@5</th></tr>
        </thead>
        <tbody>
          <tr><td><code>hier_current</code></td><td>0.3365</td><td>0.3475</td><td>0.2000</td><td>0.3875</td><td>0.4375</td></tr>
          <tr><td><code>hier_no_neighbors</code></td><td><strong>0.4771</strong></td><td>0.4000</td><td>0.2000</td><td>0.3875</td><td>0.4375</td></tr>
          <tr><td><code>chapter_summary_chain</code></td><td>0.4771</td><td>0.4000</td><td>0.2000</td><td>0.3875</td><td>0.4375</td></tr>
          <tr><td><code>hier_oracle_chapter</code></td><td><strong>0.7844</strong></td><td>0.6796</td><td>1.0000</td><td>1.0000</td><td>1.0000</td></tr>
          <tr><td><code>hier_oracle_chapter_neighbors</code></td><td>0.7688</td><td>0.6925</td><td>1.0000</td><td>1.0000</td><td>1.0000</td></tr>
        </tbody>
      </table>

      <p>Two things fall out of that table immediately.</p>
      <p><strong>Deleting a feature closed the entire gap to the baseline.</strong> <code>hier_no_neighbors</code> lands on 0.4771 recall and 0.4000 precision — the same numbers as <code>chapter_summary_chain</code>, to four decimal places. The method I thought was structurally worse was not worse. It was carrying a stage that was hurting it.</p>
      <p><strong>Look at the hit@k columns.</strong> They are <em>identical</em> across the first three rows: 0.2000, 0.3875, 0.4375. Chapter selection did not change at all between <code>hier_current</code> and <code>hier_no_neighbors</code> — it could not, it is the same code. Every point of recall that moved, moved downstream of retrieval, in the stage that pads results with adjacent chunks.</p>

      <h2>Counting the failures directly</h2>
      <p>Each of the 80 questions was assigned a failure type for the original pipeline.</p>
      <table>
        <thead>
          <tr><th>failure type</th><th>count</th></tr>
        </thead>
        <tbody>
          <tr><td><code>neighbor_dilution</code> — expansion made precision or recall worse</td><td><strong>32</strong></td></tr>
          <tr><td><code>wrong_chapter</code> — the expected chapter was never selected</td><td><strong>27</strong></td></tr>
          <tr><td><code>right_chapter_wrong_chunk</code></td><td>7</td></tr>
          <tr><td><code>ok</code></td><td>14</td></tr>
        </tbody>
      </table>
      <p>My hypothesis accounted for 27 questions. The stage I had not suspected accounted for 32. I would have fixed chapter routing, seen a real improvement, and never looked at the expansion step — because the improvement would have confirmed the theory I walked in with.</p>

      <h2>How much is routing?</h2>
      <p>Forcing the correct chapter raises recall from 0.3365 to <strong>0.7844</strong>, and precision from 0.3475 to 0.6796. Oracle mapping succeeded for all 80 questions, so that is measured on the whole set rather than a subset.</p>
      <p>That number is the ceiling this architecture has if routing were solved perfectly. It is a large gap, and it says first-stage selection genuinely is the dominant remaining constraint once the expansion bug is gone. But it is a <em>diagnostic</em> ceiling, not an achievable score.</p>
      <p>The conditional recalls make the same point without an oracle. For <code>hier_current</code>, recall was 0.4000 when the expected chapter made the top 5 and 0.2870 when it did not. For <code>hier_no_neighbors</code> and the baseline, 0.6190 when it made the top 5 and 0.3667 when it did not. Getting the chapter right roughly doubles what the later stages can do — but only once expansion has stopped diluting them.</p>

      <h2>Neighbour expansion is not simply bad</h2>
      <p>This is the result I would most want someone to take away correctly, because the headline invites the wrong lesson.</p>
      <p>With the oracle chapter, adding neighbours moves recall 0.7844 → 0.7688 and precision 0.6796 → <strong>0.6925</strong>. Recall down slightly, precision <em>up</em> slightly. When you are already in the right chapter, expansion is roughly a wash and it can help precision.</p>
      <p>The damage happens when expansion runs on top of an uncertain chapter choice. It crowds out the good chunks you did find with adjacent text that is only adjacent, not relevant. It is a stage whose value depends on the confidence of the stage above it — which is exactly the kind of interaction a single end-to-end score cannot show you.</p>
      <p>So the finding is not "turn off neighbour expansion." It is <strong>treat it as a tunable stage rather than a default</strong>, and condition it on how sure the router is.</p>

      <h2>The generalisable part</h2>
      <p>A multi-stage retrieval pipeline reports one number, and that number is a sum over stages that can fail independently and in opposite directions. My pipeline had a stage that was helping and a stage that was hurting, and the aggregate said "hierarchical retrieval underperforms" — a conclusion about the architecture that was not true of the architecture.</p>
      <p>You cannot interpret that failure without taking the stages apart. In practice the sequence that worked was:</p>
      <ol>
        <li><strong>Disable each optional stage in turn.</strong> Cheap, and it found the larger of my two problems.</li>
        <li><strong>Insert an oracle at each boundary.</strong> Not deployable, but it partitions the loss into "before this point" and "after this point."</li>
        <li><strong>Only then attribute the failure.</strong></li>
      </ol>
      <p>If I had skipped to step three, which is where the instinct goes, I would have published "hierarchical RAG underperforms chapter-summary retrieval on long narrative corpora." That sentence would have been well-supported by my headline numbers and wrong about the cause.</p>

      <h2>What this does not show</h2>
      <p>Stated plainly, because the result is narrow and the temptation to widen it is real.</p>
      <ul>
        <li><strong>One private narrative corpus, 80 gold questions</strong>, written from the corpus rather than by independent annotators.</li>
        <li><strong>Evidence-term overlap scoring</strong> — a lightweight audit signal, not full semantic correctness.</li>
        <li><strong>No confidence intervals.</strong> The package did not compute them, and I am not going to imply precision I did not measure.</li>
        <li><strong>The oracle variants are diagnostic only.</strong> They read gold labels and are not production-realistic.</li>
        <li><strong>This is not a universal rule against hierarchical retrieval.</strong> It is a demonstration that multi-stage pipelines need stage-level ablation before their failures can be interpreted at all.</li>
      </ul>

      <hr />
      <p><strong>Paper:</strong> <em>Diagnosing Hierarchical Retrieval Failure in Long-Document RAG: A LongBook Verifier Ablation Study</em> — Zenodo, June 2026.</p>
      <p><strong>DOI:</strong> <a href="https://doi.org/10.5281/zenodo.20692450" target="_blank" rel="noopener noreferrer">10.5281/zenodo.20692450</a> (concept DOI — always resolves to the newest version).</p>
      <p>The public package ships the ablation script, the summary tables, the plots and the packaging script. It excludes the manuscript text, which protects the corpus and does limit full public reproducibility until a public-domain parallel corpus is added.</p>
      <p><em>Related: <a href="/retrieval-coverage/">retrieval as an unreported measurement instrument</a> — what a retriever does not tell you about how little of the corpus it read.</em></p>
    </article>
  );
};
