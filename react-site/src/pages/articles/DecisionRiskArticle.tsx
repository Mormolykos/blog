import React from 'react';

export const DecisionRiskArticle: React.FC = () => {
  return (
    <article>
      <h1>The Compiler Got 5% Slower. The Benchmark Called It a 10% Regression a Quarter of the Time.</h1>
      <p><em>IBM's Benchpress pins the seeds that build its circuits and passes no seed to the code that compiles them. On one circuit, over 400 seeds per version, the real change between two Qiskit releases is +5.37%. The suite's own three-run protocol reports it as a ≥10% regression 24.4% of the time. Twenty runs per version — about forty hours of compute — still leaves 3.7%.</em></p>
      <hr />

      <p>A benchmark suite is an instrument. You point it at two versions of a compiler and it tells you whether the new one got worse. Somebody then merges or reverts a pull request on the strength of that answer.</p>
      <p>So the question I care about is not "is this compiler slower". It is <strong>how often does the instrument give an answer that disagrees with its own long-run behaviour</strong>. I call that <strong>finite-sample decision risk</strong>: the probability that a verdict computed from <em>k</em> runs per version disagrees with the verdict implied by the mean of the same measurement.</p>

      <h2>Where the randomness comes from</h2>
      <p>Qiskit's transpiler is stochastic. Its routing pass uses randomness, and <code>generate_preset_pass_manager</code> takes a <code>seed_transpiler</code> argument to pin it.</p>
      <p>At the pinned revision I measured, Benchpress's Qiskit gym does not pass it. Circuit <em>construction</em> seeds are fixed — <code>seed=12345</code>, fourteen occurrences. The <em>compilation</em> seed is not. So every gate count the suite reports is one draw from a distribution nobody measured.</p>
      <p>One detail matters for honesty here, and I got it wrong in an earlier draft: this is not universal across the suite. The BQSKit gym in the same repository <em>does</em> seed its compiler, with <code>seed=0</code>. <code>seed_transpiler</code> is a Qiskit-specific API that the other gyms cannot call. The claim is about the Qiskit gym, and only about it.</p>

      <h2>What one circuit does</h2>
      <p><code>bv_n140</code> is a Bernstein–Vazirani circuit that Qiskit issue #14402 names directly. Mapped to a heavy-hex lattice, going from Qiskit 1.4.3 to 2.0.0, measured at <strong>400 seeds per version across 21 operating-system processes</strong>:</p>

      <table>
        <thead>
          <tr><th>quantity</th><th>value</th><th>95% interval</th></tr>
        </thead>
        <tbody>
          <tr><td>long-run mean change</td><td><strong>+5.37%</strong></td><td>+4.27% to +6.50%</td></tr>
          <tr><td>called a ≥10% regression, 3 runs/version</td><td><strong>24.4%</strong></td><td>19.5% to 31.1%</td></tr>
        </tbody>
      </table>

      <p>The true change is nowhere near the threshold. The verdict crosses it a quarter of the time anyway.</p>
      <p>I did not trust that number when I first got it, because all 200 of the original seeds came from one contiguous block inside one process — so any per-process state, hash randomisation, allocator layout, a cached RNG, was held constant. I drew a <strong>disjoint</strong> set of 200 seeds spanning 5.9 million to 1.08 billion, ran them across ten fresh processes with differing <code>PYTHONHASHSEED</code>, and got <strong>22.6%</strong> [16.4, 30.6] against <strong>26.3%</strong> [18.5, 34.2] from the contiguous set. Each point falls inside the other's interval.</p>

      <h2>Running it more does not fix it</h2>
      <p>The obvious response is "then run it more times". I measured exactly how much that buys, pooling all 400 seeds:</p>

      <table>
        <thead>
          <tr><th>runs per version</th><th>1</th><th>3</th><th>5</th><th>8</th><th>10</th><th>20</th></tr>
        </thead>
        <tbody>
          <tr><td>false-positive rate</td><td>34.58%</td><td>24.38%</td><td>18.56%</td><td>12.94%</td><td>10.36%</td><td><strong>3.74%</strong></td></tr>
        </tbody>
      </table>

      <p>Twenty runs per version is on the order of <strong>forty hours of compute</strong>, at the issue's own stated "about two hours" per suite run. It still leaves 3.74%. One <code>seed_transpiler</code> argument removes the sampling variance at a single run.</p>
      <p>Taking the minimum of three runs instead of the mean — a common instinct — makes it worse, not better. All eight circuits I tested still err, and every rate roughly doubles: <code>bv_n280</code> goes from 17.3% to 28.4%.</p>

      <h2>The number in the issue</h2>
      <p>Issue #14402 reports <strong>+46.1%</strong> for that circuit. A single three-run comparison of the same circuit, under the same protocol, returns anywhere from <strong>−10.5% to +100.0%</strong>, with a 95% range of [+9.3%, +57.2%].</p>
      <p>+46.1% sits at the 88th percentile of that distribution. The same range extends below the +10% threshold. The reported figure is not wrong — it is one draw, reported as though it were a measurement.</p>

      <h2>The part I pre-registered</h2>
      <p>One circuit is an anecdote. So before I looked at any result, I wrote down the selection rule, the analysis, the endpoint and the labels, and committed them. Then I collected the data. The commit ordering is checkable:</p>

      <pre><code>a36a34a  2026-09-03 23:51:08  pre-registration
fbc573d  2026-09-03 23:52:38  analysis code
30224a0  2026-09-04 09:13:07  raw data</code></pre>

      <p>The rule selected every <code>qasmbench-large</code> circuit whose twelve-seed heavy-hex runtime was under ten seconds — 39 circuits, 200 seeds per version per arm.</p>
      <p>The pre-registered endpoint: <strong>12 of 26</strong> eligible circuits have a decision-error rate whose interval excludes zero. That is 46.2%, Wilson 95% [28.8%, 64.5%]. Seven of 26 sit at 5% or worse, four at 10% or worse.</p>

      <h2>What I withdrew</h2>
      <p>That 46.2% is the number I trust least in this work, and I want to say why rather than let someone find it.</p>
      <p>The 26 circuits are not 26 independent observations. They come from eleven algorithm families, and within a family the results are nearly all-hit or all-miss. A cluster bootstrap over families gives <strong>[17.4%, 81.0%]</strong> — against the Wilson interval's [28.8%, 64.5%]. The effective sample size is far below 26, and no interval I can compute is informative about a population of circuits.</p>
      <p>So the suite-level rate is <strong>withdrawn as a headline</strong>. The 12/26 stands as a descriptive count of these 26 circuits and nothing more.</p>
      <p>Three other claims went the same way, and all four withdrawals are still in the repository with the evidence that defeated them. One of them was mine: I had reported a correlation of ρ = +0.876 between "compilation is stochastic" and risk, presented as a discovered mechanism. Circuits whose two arms are constant have zero risk by arithmetic, so a correlation computed over a sample containing them is measuring a definition, not a finding. Simulated data containing no compiler at all reproduces the statistic.</p>

      <h2>What went wrong in my own instrument</h2>
      <p>The paper's whole argument is that measurement apparatus should be checked rather than trusted, so it would be poor form not to turn that on myself.</p>
      <p>After three rounds of adversarial review and a sixteen-phase red team — all of which attacked the <em>claims</em> — I had an independent audit read the ~4,600 lines of Python that nobody had ever read. It found six defects. None changed a published number. The worst one was this:</p>
      <p>My numeric inventory recomputed every reported figure and compared it to a recorded value. But the recorded value was <em>itself</em> a function call evaluated when the registry was built, and the recomputation called the same function on the same file. It compared f() with f(). <strong>It could not fail.</strong> I proved it by falsifying every value in a summary file — tripling them and adding 40 percentage points — and the checker still reported "41/41 reproduce".</p>
      <p>The values are frozen literals now, twenty-nine of forty-one re-derive from raw measurements rather than from a summary, and re-running that same falsification produces twelve failures. A checker that cannot fail is worse than no checker, because it buys confidence it has not earned.</p>

      <h2>What this does and does not say</h2>
      <p>It does not say Qiskit's transpiler got worse, or that Benchpress is a bad suite. It measures one property of one benchmarking protocol: that an unseeded stochastic compiler, sampled three times, produces regression verdicts that disagree with its own long-run behaviour at rates that are not small.</p>
      <p>Limits, stated plainly: one SDK, one version pair, one machine. The +10% threshold is mine — Benchpress defines none and the issue states no formal cut. The estimate of the true change is a plug-in from 200 seeds, not an external criterion. And <code>seed_transpiler</code> is not a universal remedy: it removes false positives on the circuits I tested, but was <em>worse</em> on three of the four circuits showing false negatives.</p>

      <h2>Everything is in the record</h2>
      <p>The paper, the complete analysis code, and all <strong>41,790 raw per-seed measurements</strong> are archived with a DOI. <code>verify.py</code> re-runs the toolchain pin check, the test suite, the numeric inventory, the replication artifact and a proof of one withdrawn claim, in under a minute.</p>
      <p><a href="https://doi.org/10.5281/zenodo.22310059">10.5281/zenodo.22310059</a></p>
      <p>If you maintain a benchmark that drives accept/reject decisions on a stochastic system, the cheap version of this check is: run the same comparison twenty times without changing anything, and look at the spread of verdicts rather than the spread of values. If the verdict moves, the number of runs is part of your instrument, and it belongs in the write-up.</p>
    </article>
  );
};
