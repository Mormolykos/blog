import React from 'react';

export const EncodersDisagreeArticle: React.FC = () => {
  return (
    <article>
      <h1>Fourteen Encoders Heard the Same Voice. Their Error Rates Differed Five-Fold.</h1>
      <p><em>Eight speakers each recorded the same 1,360 sentences in six phonation states, so the words are held constant and only the delivery changes. On one frozen list of 11,935 trials, equal error rate ran from 0.047 to 0.233 — produced by nothing but the choice of encoder. The encoder that came last is the one shipping inside a widely used open-source TTS system.</em></p>
      <hr />

      <p>A speaker encoder turns a few seconds of speech into a vector, and the distance between two vectors is treated as an answer to "are these the same person." That number gets used for authentication, for voice-cloning pipelines, and increasingly as the yardstick in research papers that ask whether a synthetic voice preserved someone's identity.</p>
      <p>The number is not neutral. It is a reading from an instrument, and I wanted to know how much the instrument itself was contributing.</p>
      <p>So I ran fourteen of them over an identical, frozen list of <strong>11,935 trials</strong> and compared what they said about the same audio.</p>

      <h2>The corpus is the reason the question is answerable</h2>
      <p>Most emotional-speech corpora use different sentences for different emotions. That is a serious problem for this question: a model can learn angry <em>vocabulary</em> instead of angry <em>delivery</em>, and you cannot tell the two apart afterwards.</p>
      <p>This corpus cannot make that mistake. <strong>Eight speakers each recorded the same 1,360 sentences in six phonation states</strong> — neutral, happy, angry, scared, shouting, whisper. Lexical content is held fixed while phonation varies, which separates <em>what is said</em> from <em>how it is said</em>.</p>
      <p>Enrolment is neutral speech. The test is whether the encoder still recognises the same person while they shout, whisper, or are frightened.</p>
      <p>The trial list was frozen in writing before a single model was loaded, and every encoder scored the identical list. That matters more than it sounds: it makes every comparison <strong>paired</strong>, and a paired comparison is a much sharper instrument than comparing two marginal confidence intervals.</p>

      <h2>The headline: a five-fold spread on identical audio</h2>
      <p><strong>Equal error rate spans 0.047 to 0.233 across the panel</strong> — same trials, same speakers, same recordings. Nothing varies but the encoder. <strong>29 of 91</strong> pairwise comparisons survive Holm–Bonferroni correction across the full pairwise family.</p>
      <p>If you are choosing an encoder for expressive or emotional audio, that spread is your decision. It is larger than most of the architectural differences people argue about.</p>

      <h2>The most robust finding: CAMPPlus is last, without exception</h2>
      <p><strong>CAMPPlus has the highest error of the fourteen, and all 13 of its comparisons survive family-wise correction.</strong> It is highest for <strong>every one of the eight speakers</strong> and <strong>every one of the six conditions</strong>. There is no pooling artifact here — it does not win a single cell.</p>
      <p>Margins run from <strong>+0.087 [+0.064, +0.127]</strong> against ECAPA-TDNN to <strong>+0.185 [+0.150, +0.215]</strong> against the lowest-error encoder in the panel.</p>

      <h3>The mechanism is the useful part</h3>
      <p>CAMPPlus's <em>genuine</em> scores are unremarkable. The problem is its <em>impostor</em> scores.</p>
      <p>It places different people at cosine <strong>0.28–0.34</strong>, where ECAPA-TDNN and ReDimNet place the same pairs near <strong>0.034</strong> on the same audio. That is a compressed embedding space: different speakers land close together, so the threshold separating "same person" from "different person" has almost nowhere to sit.</p>
      <p>And it is visible <strong>at neutral speech</strong> — 0.031 EER where several ReDimNet checkpoints reach 0.000. So expressive speech does not cause the problem. Expressive speech makes it visible.</p>
      <p>This matters practically because <strong>a widely used open-source TTS system conditions on CAMPPlus.</strong> I want to be precise about what that does and does not mean, because it is the easiest sentence in this article to over-read. It is a verified fact about that system's source code. It is <em>not</em> a measurement of its audio. I measured encoders on human recordings, in isolation. Whether that choice degrades the system's output is a separate experiment, and I have not run it.</p>

      <h2>Parameter count does not order the panel</h2>
      <p>Spearman ρ between parameter count and expressive EER is <strong>+0.135</strong> over fourteen encoders. No ordering, and if anything the wrong sign.</p>
      <p>The <strong>20.8 M</strong> model ranks 13th of 14. A <strong>4.81 M</strong> model ranks 1st. Published VoxCeleb1-O position does not transfer either — the leaderboard you would pick from is computed on calm read speech, and that is not the condition failing you.</p>
      <p>I have to be careful about the winner, and this is one of the claims I retracted. The 4.81 M model survives as an argmin — selected in <strong>89.4%</strong> of speaker resamples, and leading in all eight leave-one-speaker-out refits — but after correction it is separated from only <strong>7 of 13</strong>. The defensible wording is <em>lowest observed error</em>, not "beats the others."</p>

      <h2>A clean pre-registered negative</h2>
      <p>The obvious objection is that preprocessing produced this. It did not. Spectral denoising does not materially change the measurement: <strong>|ΔEER| ≤ 0.039 over 10,765 twinned trials</strong>, and whispered speech — the condition where removing aspiration noise was the stated worry — is among the <em>least</em> affected.</p>

      <h2>Ten retracted claims, and why they are in the paper</h2>
      <p>The published record ships <code>docs/DECISIONS.md</code> rather than a tidied summary, because several of the things I had to withdraw were the headline at the time.</p>
      <ul>
        <li><strong>An 11.7 dB spectral effect, asserted with an instrument whose F0 artifact budget is 12.09 dB.</strong> Sweeping fundamental frequency with the spectral envelope held exactly fixed moved the descriptor further than the effect I was claiming. It was never a measurement. The fix, <code>gate_f0.py</code>, now runs <em>before</em> analysis and refuses a descriptor until its artifact budget is known — and it proved its own sensitivity by rejecting two of the replacement measures I wrote to satisfy it.</li>
        <li><strong>"Shouting does not transfer."</strong> Judged on RMS after the analyser had peak-normalised every clip, so the figure was crest factor, not loudness. I caught that by ear before the measurement caught it.</li>
        <li><strong>A tie-break defect in the EER estimator.</strong> <code>argmin</code> returns the first minimiser — the lower threshold rather than the balanced operating point. Invisible at unit weights, and common under the integer speaker multiplicities a bootstrap actually runs at. Fixing it moved one comparison across the Holm threshold, <strong>28 → 29 of 91</strong>. The correction <em>favoured</em> the paper, which is exactly why it is published rather than quietly kept: a report about what happens when an instrument is wrong cannot itself carry a number produced by a wrong instrument.</li>
      </ul>
      <p>The rule that came out of this, and I have now paid for it three separate times: <strong>validate the instrument before measuring with it.</strong></p>

      <h2>The statistical procedure</h2>
      <p>The trial list is a <strong>directed graph on 8 speakers</strong>: genuine trials are the self-loops, impostor trials the 56 ordered edges. The independent unit is the speaker, who sits on both sides of the comparison. So the resample is a <strong>vertex bootstrap</strong> — draw the 8 vertices with replacement, take the induced sub-multigraph, weight the impostor edge by the product of the two multiplicities. A speaker who is not drawn contributes to neither side.</p>
      <p>An earlier scheme resampled enrolment speakers only, which dropped a speaker as an enrollee while leaving them in as an impostor. Correcting it widened the marginal intervals (width ratio median 1.11, max 1.58) and <strong>cost two already-written claims</strong>. Paired differences were almost unaffected — both encoders in a pair score the same shared impostor clips, so the dependence cancels in the difference. That is a second, independent argument for the paired design.</p>
      <p>B = 20,000 draws, seed fixed, families declared before testing, Holm–Bonferroni step-down at family-wise α = 0.05. The bootstrap p-value floor at that B is 1×10⁻⁴, below Holm's strictest threshold here (5.5×10⁻⁴), so no comparison is limited by resolution.</p>

      <h2>The companion experiment: enrolment composition</h2>
      <p>A second pre-registered experiment asks whether enrolling a speaker on expressive material, instead of neutral-only, recovers the loss. <strong>It does, on all 14 encoders</strong>, every one surviving Holm and clearing its own null band.</p>
      <p><strong>The mechanism is the opposite of the intuitive one.</strong> Enrolling on a <em>single</em> expressive state helps that state and slightly harms the others — transfer-matrix diagonal median <strong>−0.082</strong>, off-diagonal median <strong>+0.010</strong>. Guessing which state a user will be in, and guessing wrong, is worse than enrolling on calm speech.</p>
      <p>A mixed set carrying a third as much of each state improves all five conditions, because it holds matched material for each. A pre-committed control ruled out the competing explanation: acoustic diversity alone delivers <strong>+0.002</strong> where composition delivers <strong>−0.065</strong>, against a bar of 0.50 recovery share. <strong>It is coverage, not expressiveness.</strong></p>
      <p>If you run voice authentication, that is the cheapest thing in this article: spread enrolment thinly across states rather than guessing one.</p>

      <h2>What this paper does not claim</h2>
      <p>These are in the abstract rather than buried, deliberately.</p>
      <ul>
        <li><strong>Nothing about any TTS system's output quality.</strong> Encoders were measured in isolation on human recordings.</li>
        <li><strong>Eight speakers</strong>, one studio, one recording chain.</li>
        <li><strong>Enrolment and test share a recording session</strong>, so absolute error rates are optimistic and are not comparable to VoxCeleb figures. Only relative comparisons between encoders on identical trials are licensed.</li>
        <li><strong>Architecture is fully confounded with training corpus.</strong> No released checkpoint crosses the two families, so "the larger-speaker-count corpus helps" and "that architecture family is better" are equally consistent with every number here. Separating them requires training, which I did not do.</li>
      </ul>

      <h2>Reproducibility</h2>
      <p>The audio is a private, rights-cleared corpus and is not released. <strong>Everything downstream of it is</strong> — score tables, trial manifest, analysis code, decision record.</p>
      <p>Verified in a clean virtual environment with <strong>numpy, spkproof and matplotlib only — no GPU, no torch, no audio</strong>: the results files regenerate line for line and all four figures rebuild. The analysis opens by checking its own weighted EER estimator against <code>spkproof.panel.equal_error_rate</code> and agreeing to <strong>0.00e+00</strong> across all fourteen encoders.</p>
      <p>The repository also ships the redaction script that produced the release, because "anonymised" is a claim a reader should be able to audit rather than trust. Corpus paths were <em>replaced</em> rather than deleted — each filename embeds the sentence spoken, so publishing 11,935 paths would publish a private 1,360-phrase script — by an opaque clip identifier proven 1:1 across all 10,964 recordings, so the enrolment-leakage audit still runs and still reports zero.</p>

      <h2>The part that generalises</h2>
      <p>An established metric is not automatically a neutral one. An encoder, an evaluator, a classifier, or an LLM judge can become part of the experiment rather than a window onto it.</p>
      <p>Before asking whether a system preserves speaker identity under some transformation, it is worth asking whether the instrument you are measuring with has been validated under that same transformation. Otherwise you will attribute the encoder's behaviour to the speaker — and the number will look perfectly reasonable while you do it.</p>

      <hr />
      <p><strong>Paper:</strong> <em>Speaker Encoders Disagree About Who You Are When You Shout: A Content-Matched Benchmark of Fourteen Speaker Encoders Under Expressive Phonation</em> — Zenodo, 29 August 2026, CC-BY-4.0.</p>
      <p><strong>DOI:</strong> <a href="https://doi.org/10.5281/zenodo.22158030" target="_blank" rel="noopener noreferrer">10.5281/zenodo.22158030</a> (concept DOI — always resolves to the newest version).</p>
      <p><strong>Code, data and the full decision record:</strong> <a href="https://github.com/Mormolykos/speaker-encoders-disagree" target="_blank" rel="noopener noreferrer">github.com/Mormolykos/speaker-encoders-disagree</a> — MIT for code, CC-BY-4.0 for the data tables.</p>
      <p>The evaluation library the analysis checks itself against is <a href="https://github.com/Mormolykos/spkproof" target="_blank" rel="noopener noreferrer">spkproof</a> (<code>pip install spkproof</code>), which ships the trial-design checks and the descriptor gate described above.</p>
    </article>
  );
};
