import React from 'react';

export const DecoderBenchmarkArticle: React.FC = () => {
  return (
    <article>
      <h1>Three of Twenty Decoders Actually Stream. My Quality Metric Was Beaten by an Algorithm from 1984.</h1>
      <p><em>Twenty neural audio decoders, five pre-registered gates, identical audio. Only three reproduce full-context output from partial input with load-bearing state — fifteen are stateless chunking. The sole pre-registered cross-arm quality metric was topped by Griffin-Lim, which has zero trained parameters, in six states of six. A second measurement sharing no implementation found a near-zero median additional change for the same three arms when streamed. No listening test was run, and nothing here says which decoder sounds best.</em></p>

      <aside>
        <p><strong>Corrected 16 September 2026 — version 1.0.1.</strong> After I published v1.0.0, an independent adversarial review of the <em>published package</em> found reporting and reproducibility defects that four earlier audit rounds had missed, because those rounds all ran inside the private research tree rather than against what shipped. The advertised public reproduction commands did not run. A first-audio latency range borrowed a steady-state number for its upper end. Three sentences — including one in this article — claimed more than the measurements support.</p>
        <p>A sixth round then attacked the correction itself and found five more, two of them claims in the repair that outran their evidence in the same way. All are fixed.</p>
        <p>This article has been corrected in place and describes <strong>v1.0.1, the current release</strong> (<a href="https://doi.org/10.5281/zenodo.22811349">DOI 10.5281/zenodo.22811349</a>). <strong>No measurement changed</strong> — 51,495 non-string scalar leaves were compared across both versions and none differ. Every correction is listed in <a href="https://github.com/Mormolykos/decoder-vocoder-benchmark/blob/main/CORRECTIONS_v1.0.1.md"><code>CORRECTIONS_v1.0.1.md</code></a>, with the original wording beside the corrected wording, and v1.0.0 remains permanently available at tag <code>v1.0.0</code>.</p>
      </aside>

      <hr />

      <p>If you are building a streaming text-to-speech system, you have to choose a decoder. The published record makes that harder than it should be: real-time factors quoted without hardware, "streaming" claimed for architectures that need the whole utterance, quality figures from different corpora at different sample rates through different measurement paths. None of it composes into a decision.</p>
      <p>So I measured twenty of them under one frozen protocol on identical audio — <strong>representation to waveform only</strong>, because generator timing is a different question and a decode-only number read as end-to-end TTS performance is a failed report.</p>

      <h2>The reframing that changed the candidate set</h2>
      <p>The survey nearly excluded several candidates for the wrong reason. <strong>For a TTS build, only the decoder needs to be causal.</strong> The encoder runs at training time on complete utterances; at inference the generator emits tokens directly and no encoder sits in the serving path. NVIDIA's NanoCodec makes it concrete — non-causal encoder, causal HiFi-GAN decoder. "Is this codec causal?" is the wrong question.</p>

      <h2>Gate 2: "streaming" is a property almost nothing has</h2>
      <p>An arm counts as truly incremental only if <strong>both</strong> hold: stateful chunked decode reproduces full-context output to <code>max|err| ≤ 1e-3</code>, <em>and</em> state is load-bearing — the stateless error is at least 10× the stateful one. The second conjunct exists because the first can be satisfied by an arm that ignores state entirely.</p>
      <table>
        <thead><tr><th>classification</th><th>arms</th></tr></thead>
        <tbody>
          <tr><td>Stateless chunking</td><td><strong>15</strong></td></tr>
          <tr><td>True incremental, representation → PCM</td><td><strong>3</strong> — the explicitly causal FocalCodec configurations</td></tr>
          <tr><td>Neural decoder streams, iSTFT streaming not established</td><td>1 — MelFlow</td></tr>
          <tr><td>Blocked, platform</td><td>1 — NanoCodec</td></tr>
        </tbody>
      </table>
      <p>The three causal configurations pass the state test with ratios of <strong>3,530 to 36,740</strong> against a threshold of 10. State is not marginally load-bearing; it is decisive.</p>
      <p><strong>The negative controls are what make the positives mean anything.</strong> The non-causal FocalCodec configurations are driven through the <em>identical</em> stateful code path. Their ratio is exactly <strong>1</strong> — carrying state changes nothing. Had a negative control passed, the experiment would have been void rather than the arm promoted.</p>
      <p>Several of the fifteen never claimed to stream. The classification measures what they do; it is not a charge against what they advertised.</p>

      <h2>Gate 3: speed is not validity</h2>
      <p>First-audio latency spans <strong>1.37 ms</strong> to <strong>27.64 ms</strong> across the arms that have a first-audio number at all. MelFlow does not: it emits spectrogram frames, so producing playable audio from a partial stream needs an overlap-add stage this study records as not established, and its first-audio time is <strong>NOT ESTABLISHED</strong>. Its <strong>375.91 ms is a steady-state median</strong> — a different quantity, and the two are never mixed. Real-time margin spans <strong>64×</strong> down to <strong>0.2×</strong>.</p>
      <p>But <strong>two</strong> arms produce streamed output that fails the study's own validity gate at <em>every</em> chunk size tested. A third, <code>focalcodec_12_5hz</code>, fails at the 80 ms anchor but passes 2 of 5 tested sizes — its smallest viable configuration is <strong>640.8 ms</strong>, not 80 ms.</p>
      <p>The sharpest case: <code>vocos_mel24</code> has the <strong>fastest first-audio in the study and no achievable streaming configuration at all</strong>. Its timing numbers are real; what they timed is not a valid streaming configuration.</p>
      <p>One environment finding governs how any of these numbers may be read. A controlled probe — byte-identical tokens, same GPU, one arm run in every environment — found a <strong>50.2% difference</strong> attributable purely to the <code>transformers</code> version, device-side, at identical torch. So the incumbent decoder may not be compared numerically against the other arms at all. That is not a statement about whether it is fast; it is a statement that the comparison does not exist.</p>

      <h2>Gate 4: the metric failed its own validity instrument</h2>
      <p>The pre-registration installed Griffin-Lim — a phase-retrieval algorithm from 1984, zero trained parameters — as a floor, and declared <em>in advance</em> what it would mean if it scored close to a trained neural codec: a finding about the metric, not about the decoders.</p>
      <p>It did not score close. <strong>It scored best, in six states of six.</strong></p>
      <table>
        <thead><tr><th>state</th><th>griffinlim</th><th>bigvgan22</th><th>vocos_mel24</th></tr></thead>
        <tbody>
          <tr><td>Neutral</td><td><strong>81.6</strong></td><td>102.6</td><td>127.7</td></tr>
          <tr><td>Angry</td><td><strong>76.2</strong></td><td>110.0</td><td>133.9</td></tr>
          <tr><td>Happy</td><td><strong>75.9</strong></td><td>106.5</td><td>130.7</td></tr>
          <tr><td>Scared</td><td><strong>80.8</strong></td><td>112.2</td><td>134.0</td></tr>
          <tr><td>Shouting</td><td><strong>72.7</strong></td><td>115.7</td><td>137.1</td></tr>
          <tr><td>Whisper</td><td><strong>96.8</strong></td><td>126.2</td><td>156.1</td></tr>
        </tbody>
      </table>
      <p>The obvious explanation was tested and <strong>refuted</strong>. The hypothesis that a low-level frame floor favours a magnitude-matching algorithm failed: splitting each cell at its own median energy, Griffin-Lim leads in <em>both</em> halves and by <em>more</em> in the loud half.</p>
      <p>What remains is an explanation <em>consistent with</em> the result rather than a demonstrated mechanism, and the difference matters. Mel-cepstral distance as implemented here is derived from the magnitude spectrum and is blind to phase by construction. Griffin-Lim iterates toward consistency of the <em>linear STFT magnitude</em> and optimises nothing else, accepting whatever phase error that leaves. The two objectives are aligned in domain but are not the same quantity, and nothing in this study demonstrates that Griffin-Lim minimises the released cepstral distance exactly.</p>
      <p><strong>What is established does not depend on the mechanism: a metric whose ranking puts an untrained phase-retrieval algorithm first is not, on its own, a sufficient authority for cross-decoder quality.</strong> That is the pre-registered consequence, and it fired on the evidence rather than on the explanation.</p>
      <p>Two limits travel with this. The instrument exists only in the mel route, so the same check is <strong>not established</strong> — not passed — in the codec route. And no new metric was introduced afterwards, because choosing a ruler once you know who won under the old one is precisely the failure the check exists to catch.</p>

      <h2>Q5: does the speaker survive, and does he stay one person?</h2>
      <p>A single similarity score conflates two different things, so this measures them separately: <strong>retention</strong>, how close a reconstruction sits to its own source, and <strong>dispersion</strong>, how tightly <em>different</em> reconstructions of the same speaker cluster together. A decoder can move a voice consistently — a stable new identity — or make the speaker wander. Those are not the same failure.</p>
      <p>Both are read against references measured on <strong>source audio alone, before any reconstruction was opened</strong>: the human within-speaker ceiling and the between-speaker floor. Three speaker encoders, chosen mechanically from a previously frozen fourteen-encoder study, each calibrated independently. <strong>Cosine values are encoder-specific and never averaged.</strong></p>
      <p>Retention runs from <strong>0.9952</strong> down to <strong>0.4316</strong> (values quoted for ECAPA). <strong>The three encoders show broadly similar ordering, with some pairwise reversals</strong> — <code>encodec24_q8</code> sits above <code>dualcodec_12hz_v1</code> under ECAPA and below it under both ReDimNet encoders. Per-encoder spread reaches 0.1193, which is why a bare cosine without its encoder name is not a result, and why neighbouring arms should not be read as ranked against each other at all.</p>
      <p>And here the two instruments agree on something uncomfortable: <strong>Griffin-Lim also has the highest speaker-embedding retention of the eighteen arms.</strong> That sentence is the whole claim — not that it is the best decoder, and not a perceptual claim. Two measurements, a spectral distance and three speaker encoders, both rank a phase-blind algorithm first. Both are blind to the same thing.</p>

      <h2>The streaming result, from a second direction</h2>
      <p>The identity measurement compares each arm against <strong>its own offline decode</strong> on the same recording, so no ceiling or floor enters and no cross-arm ranking is implied.</p>
      <p>Two distinct quantities, and they are never quoted as one range: the <strong>offline ↔ streamed cosine</strong>, and the <strong>paired retention delta</strong>. All values below are ECAPA.</p>
      <table>
        <thead><tr><th>arm</th><th>offline ↔ streamed cosine</th><th>retention delta</th></tr></thead>
        <tbody>
          <tr><td><code>focalcodec_50hz_2k_causal</code></td><td><strong>0.999880</strong></td><td><strong>−2.8×10⁻⁵</strong></td></tr>
          <tr><td><code>focalcodec_50hz_4k_causal</code></td><td><strong>0.999866</strong></td><td><strong>−3.9×10⁻⁵</strong></td></tr>
          <tr><td><code>focalcodec_50hz_65k_causal</code></td><td><strong>0.999878</strong></td><td><strong>−3.1×10⁻⁵</strong></td></tr>
          <tr><td>bigvgan22</td><td>0.9153</td><td>−0.0778</td></tr>
          <tr><td>fish_modified_dac</td><td>0.5196</td><td>−0.4054</td></tr>
          <tr><td>dualcodec_25hz_v1</td><td>0.2008</td><td><strong>−0.7420</strong></td></tr>
        </tbody>
      </table>
      <p>The three causal configurations show a <strong>near-zero median additional change under the tested encoders, supported recordings and imposed chunking regime</strong>. Their retention deltas are small but consistently negative. That is the whole claim — this study establishes <em>no</em> minimum detectable streaming change and <em>no</em> equivalence threshold, so "near-zero median" must not be read as "below what the instrument can detect". Nothing is claimed to be lost, and nothing is claimed to be preserved.</p>
      <p>Thirteen others lose between <strong>−0.078 and −0.742 on the retention delta</strong>, an amount nowhere near the resolution limit. For <code>focalcodec_25hz</code> under one encoder the offline-versus-streamed cosine itself reaches <strong>−0.013</strong>: the streamed output is essentially orthogonal to that arm's own offline decode <em>in this embedding space</em>. That is a statement about speaker-embedding similarity only — it does not establish the absence of waveform or linguistic relationships, which were not measured.</p>
      <p>This agrees with the quality gate's separate streaming detector — an aligned maximum-error detector on the waveform — which found the same three arms at <strong>0.69–0.74%</strong> error where every other arm sat at 105–225%. <strong>Two measurements sharing no implementation, the same three survivors.</strong> They do share their input, the same reconstructions of the same corpus. The agreement is <em>corroborating evidence</em>: it makes an independent implementation error in both less likely. It cannot rule out an error in either — agreement between two implementations never can — and it says nothing about an artefact of the material both were computed on.</p>

      <h2>What the audit changed</h2>
      <p>Six rounds of independent adversarial review ran against this study — four before publication, one against the published package, and one against the correction itself. Three of the defects they found <em>changed conclusions</em>. They are in the paper because a methods section that hides them would misrepresent how the numbers were obtained.</p>
      <ul>
        <li><strong>The cross-state reference used pairs the measurement forbade.</strong> Dispersion compared different sentences; its human ceiling did not, admitting the same sentence spoken in two emotions — in a parallel corpus, the most similar cross-state pair that exists. Eight labels changed when it was repaired.</li>
        <li><strong>A ceiling measured on the wrong duration.</strong> Calibration used full-length recordings where the measurement compares 14-second prefixes. Counterfactual: <strong>73 of 108 strata would have carried a different label, 67 of them false drift verdicts.</strong></li>
        <li><strong>A pair-grouping convention that was order-dependent.</strong> Permuting row order moved estimates by up to 0.089 — enough to flip a label. Replaced with a symmetric rule, verified invariant to machine precision.</li>
      </ul>
      <p>The fifth round ran after publication and found the same pattern a fourth time, in the release itself: the scripts I advertised as the public reproduction commands resolved their data relative to where they sat in my <em>private</em> tree, and the package ships them flat. None of the three ran. The verifier I pointed readers at was the manifest of the private tree, which cannot verify a redacted package and reported 26 of 32 artifacts as drift.</p>
      <p>Then a sixth round attacked the correction, before any of it went out, and found five more — including two claims in the repair that outran their evidence, a privacy scanner still listing the paths it knew about instead of declaring what counts as private, and a package verifier that printed its own integrity fingerprint without ever comparing it to anything.</p>
      <p>The pattern is worth naming because it has now recurred in six disguises: <strong>verification that checks what is present rather than what is required.</strong> The estimator without its reference; the instrument without its evidence; the manifest without its inventory; a package that verified its own private origin rather than what it shipped; a scanner that listed roots instead of declaring a domain; and a verifier that printed a value instead of comparing it.</p>

      <h2>What this does not establish</h2>
      <ul>
        <li><strong>Perceptual quality was never measured.</strong> No listening test was run. Which decoder <em>sounds</em> best is not established and no sentence here implies it.</li>
        <li>The identity result is about <strong>speaker-encoder representations</strong>, not about how audio sounds and not about cloning quality.</li>
        <li>A large majority of cells fall outside the quality metric's validated support domain. Support is carried as a covariate, never as an exclusion.</li>
        <li>For one decoder family, <strong>identity dispersion and band-limiting cannot be separated</strong> in this design, so no causal claim is made about it.</li>
        <li>Seven speakers, one studio, one recording chain, English. Absolute values are not comparable to VoxCeleb-scale benchmarks.</li>
        <li>Thirteen arms were driven with chunked context they were never designed for. The result is the cost of streaming a decoder that was not built to stream.</li>
      </ul>

      <h2>What comes next</h2>
      <p><strong>Human listening and adversarial detectability are declared later phases, neither started.</strong> The reconstructions are retained for exactly that reason — 35.65 GB kept rather than deleted, because a listening test is the only thing that can settle what two phase-blind metrics agreed to ignore.</p>

      <h2>The part that generalises</h2>
      <p>Two metrics ranked a zero-parameter algorithm first. Neither was wrong about what it measured; each was computed correctly. What neither establishes is perceptual quality — and the pre-registration that named that outcome in advance is the only reason it reads as a finding rather than an embarrassment.</p>
      <p>If you are choosing a decoder on a published quality number, the question worth asking first is whether that metric has ever been shown a floor it should beat.</p>

      <hr />
      <p><strong>Paper:</strong> <em>What a Streaming Decoder Costs: A Five-Gate Benchmark of Twenty Neural Audio Decoders, and a Metric That Failed Its Own Validity Check</em> — Zenodo, September 2026, CC-BY-4.0.</p>
      <p><strong>DOI (v1.0.1, this version):</strong> <a href="https://doi.org/10.5281/zenodo.22811349" target="_blank" rel="noopener noreferrer">10.5281/zenodo.22811349</a> · <strong>all versions:</strong> <a href="https://doi.org/10.5281/zenodo.22798415" target="_blank" rel="noopener noreferrer">10.5281/zenodo.22798415</a> · superseded v1.0.0: <a href="https://doi.org/10.5281/zenodo.22798416" target="_blank" rel="noopener noreferrer">10.5281/zenodo.22798416</a></p>
      <p><strong>Release:</strong> <a href="https://github.com/Mormolykos/decoder-vocoder-benchmark/releases/tag/v1.0.1" target="_blank" rel="noopener noreferrer">v1.0.1</a> — the current corrected release.</p>
      <p><strong>Code, specifications, machine-readable results and the full audit trail:</strong> <a href="https://github.com/Mormolykos/decoder-vocoder-benchmark" target="_blank" rel="noopener noreferrer">github.com/Mormolykos/decoder-vocoder-benchmark</a></p>
      <p><strong>Corrections since v1.0.0:</strong> <a href="https://github.com/Mormolykos/decoder-vocoder-benchmark/blob/main/CORRECTIONS_v1.0.1.md" target="_blank" rel="noopener noreferrer">CORRECTIONS_v1.0.1.md</a>. Three commands regenerate every table and re-trace every headline claim from this package alone. That is a consistency check, not independent reconstruction — rebuilding the aggregates and their confidence intervals needs the withheld per-recording rows, and one published claim is marked <code>WITHHELD</code> in the public audit for exactly that reason.</p>
      <p>The source audio, the derived speaker embeddings and the reconstructed audio are not released: the corpus is private, rights-cleared recordings of seven consented speakers, and an embedding of a named human is biometric data. Speaker names are pseudonymised throughout and every substitution is recorded with its source hash.</p>
    </article>
  );
};
