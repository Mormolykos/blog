import React from 'react';

export const SpeakerDriftArticle: React.FC = () => {
  return (
    <article>
      <h1>How Little Your Voice Has to Change Before a Machine Stops Recognising It</h1>
      <p><em>Four speakers, eight matched sentences, three encoder architectures. One speaker moved his pitch by less than a semitone and lost a quarter of his identity score. Here is the whole experiment, including the prediction I withdrew and the prior-art audit that killed my best-sounding claim.</em></p>
      <hr />

      <p>Voice biometrics are deployed. Telephone banking, device unlock, assistant personalisation — all of it rests on a single assumption: <strong>your identity vector stays put when you speak differently.</strong></p>

      <p>That assumption fails. This is not news, and I want to establish that before anything else, because I spent a day believing otherwise.</p>

      <p>Hughes et al. showed it at Interspeech 2023 with six trained phoneticians across seventeen vocal conditions, matched text, fixed studio channel, three sessions. Prieto et al. showed it for whisper and shout. González Hautamäki et al. showed it for deliberate disguise, finding mean-F0 difference to be the largest single factor. A 2023 <em>Scientific Reports</em> study of over 3,800 subjects showed that people with dysphonia carry measurably higher re-identification risk. Shriberg et al. built controlled vocal-effort corpora in 2008.</p>

      <p>I found all of that <em>after</em> running my experiment, in a prior-art audit I ran specifically to try to kill my own claims. It killed the biggest one. What follows is what survived.</p>

      <h2>The setup</h2>

      <p>Four speakers — me, my mother, my sister, and my sister's partner. Eight fixed English sentences, deliberately boring: <em>"The train arrives at seven every morning."</em> Common vocabulary, nothing emotional, nothing phonetically clever.</p>

      <p>Each speaker recorded the same eight sentences clean, then again under controlled changes: pitch low, pitch high, breathy. In my own case, a five-level pitch ladder from 80 Hz to 345 Hz, plus an older corpus of rasp, growl, breathiness, nasality and staccato versus legato.</p>

      <p>48 kHz, 32-bit float, mono. No normalisation, no compression, no noise reduction, no gate. Microphone position and input gain fixed <em>within</em> each speaker — different people sat at different distances, but nobody moved once they started.</p>

      <p>Scoring is leave-one-out within each speaker: to score one utterance, enrollment is the mean embedding of all that speaker's <em>other</em> clean utterances. Text-independent, same session, same person. There is no cross-session mismatch available to contaminate anything — which is a control in one direction and a ceiling in the other, since real systems <em>do</em> enroll you on a different day.</p>

      <p>What my design adds over the studies above is narrow: those report verification outcomes per condition. I measured six acoustic properties of every single utterance — F0, HNR, CPPS, jitter, shimmer, spectral centroid — and put them in a regression together, so the condition label never has to be trusted.</p>

      <h2>The control that could have killed it</h2>

      <p>If you change how someone speaks and their embedding moves, the boring explanation is that your pipeline degrades whatever you feed it. Every number is worthless without a condition that <em>should</em> come back flat and does.</p>

      <p>Mine was staccato versus legato — same words, same pitch, same voice quality, only the joining between words changes.</p>

      <pre><code>          staccato Δ    below baseline    sign test p
ECAPA       −0.030          7/16            0.80
ResNet      −0.010          7/16            0.80
WavLM       +0.025          5/16            0.21</code></pre>

      <p>Flat in all three. For scale, the largest real effects in the same encoders are −0.308, −0.324 and −0.128. <strong>The control is an order of magnitude smaller than the effects.</strong></p>

      <p>This null is also not new — a 2025 study reports that these embeddings encode static spectral structure and largely ignore dynamic markers like speech rate and rhythm, which is exactly what articulation timing is. What it does for me is local: it's an internal control, in the same corpus, same speakers, same pipeline that produced everything else.</p>

      <h2>What did move</h2>

      <p>Everything else. Thirty speaker × condition × encoder cells, every one negative, twenty-eight of them unanimous across every utterance in the block.</p>

      <pre><code>                    ECAPA    ResNet   WavLM
Stelina  low       −0.234   −0.229   −0.091
         high      −0.249   −0.287   −0.068
Vagelis  low       −0.238   −0.213   −0.076
         breathy   −0.287   −0.264   −0.032
Panos    very_low  −0.271   −0.306   −0.061
         very_high −0.287   −0.313   −0.128</code></pre>

      <p>Three architectures: ECAPA-TDNN, a ResNet speaker encoder, and WavLM — the first two supervised on VoxCeleb, the third a self-supervised transformer with an x-vector head. Same audio, same protocol.</p>

      <p>WavLM's displacements are two to four times smaller throughout. I originally wrote that up as self-supervision buying robustness. <strong>I've since cut that claim</strong>, because my design can't support it: I have one model per family, and they differ simultaneously in architecture, training data, objective, pooling head and embedding dimension. There's no way to attribute the gap to any one of those. The literature also tends to use WavLM <em>combined with</em> an ECAPA backend rather than instead of one.</p>

      <p>What's left is still worth having, just smaller: <strong>on this audio, three deployed checkpoints differ several-fold in how far the same production change moves the embedding.</strong> If you're picking an encoder for a population whose voices vary, measure it rather than assuming parity.</p>

      <p>What does <em>not</em> transfer is the ranking. Vagelis's breathy condition is his worst under ECAPA and ResNet and among his mildest under WavLM. "Attribute X is the most damaging" is a claim about a model, not about voices.</p>

      <h2>Less than one semitone</h2>

      <p>Here's the result I keep returning to.</p>

      <p>Vagelis's "low" block sits <strong>0.7 semitones</strong> below his clean voice. That is below the threshold at which you'd reliably hear a pitch change at all. His verification score dropped <strong>0.238</strong>, on all eight sentences.</p>

      <p>His harmonics-to-noise ratio over the same block fell from 10.63 to 8.39 dB.</p>

      <p>So he didn't lower his pitch. He <em>tried</em> to, and what actually changed was how he was producing the voice. The damage tracked the production change, not the frequency.</p>

      <p>I'd seen the same thing in my own recordings hours earlier without understanding it. I recorded three separate "low" takes that all came out at the same 81 Hz — confirmed by Praat at three different pitch floors and independently by YIN — and everyone in the house insisted they sounded different. They were right. The takes differed by 3.1 semitones of <em>spectral brightness</em> and 6 dB of HNR at identical fundamental frequency. I was measuring the one thing that hadn't changed.</p>

      <h2>The part where I was wrong, repeatedly</h2>

      <p>This is an engineering notebook, so: I got a lot wrong, and the errors were more informative than the plan.</p>

      <p><strong>I asked for levels a human can't produce.</strong> I wanted graded rasp — light, medium, heavy. The speaker told me he couldn't. I proposed a smooth glide instead, which is harder. Then I proposed eight graded levels across eight sentences, which is <em>much</em> harder, after he'd told me three was impossible.</p>

      <p>He was right and the data proves it. Three attempted rasp levels all landed within 3 dB of maximum roughness, against a 17 dB clean-to-full range. He could hold five distinct pitch targets across eight sentences each, tight and repeatable. He could not grade roughness at all.</p>

      <p>That's in the paper as a result, not an apology: <strong>a speaker can reliably hold pitch and cannot reliably hold phonation intensity</strong>, which constrains what a controlled vocal-attribute corpus can contain.</p>

      <p><strong>My silence splitter miscounted his sentences twice.</strong> Once because a fixed 0.6 s merge threshold glued five sentences into one when he happened to pause faster; once because I measured a version of the file that had been re-saved between my two reads. Both times I told him he'd recorded fewer sentences than he had. Both times he was right and the tool was wrong.</p>

      <p><strong>I claimed an effect that was already published.</strong> "Controlled production change displaces modern speaker embeddings" was going to be my headline. It's Hughes et al. 2023, with better speakers and four times the conditions. Two models searching independently converged on it within minutes. I withdrew the claim.</p>

      <h2>The finding that survived, and it isn't the one I wanted</h2>

      <p>I pre-registered a prediction: downward pitch deviation would cost more than upward. Run as registered, across everything, ECAPA came back at <em>p</em> = 0.947 — almost perfectly symmetric.</p>

      <p>So I looked at the inputs. The upward predictor reached <strong>32.1 semitones</strong>. Two and a half octaves. Nobody did that.</p>

      <p>Praat's pitch tracker fails on rough phonation, returning a 478 Hz median for a raspy male voice. Ten of 145 utterances carried impossible pitch values, with a raw median F0 of 530 Hz for men who speak near 100 Hz. And they weren't scattered:</p>

      <pre><code>{`                     rough phonation    modal
impossible (>20 st)        10             0
plausible                   7           128

Fisher exact p = 2.4e-11`}</code></pre>

      <p><strong>Every single impossible value sat in rough phonation, and none in modal.</strong> Those observations also carried 2.7× the leverage of the rest, and up to 13× the Cook's distance. And the contamination is one-directional — octave errors push pitch estimates <em>up</em>, essentially never down — so it loads onto the upward coefficient specifically. Of the observations most influential on the pitch-up coefficient, 9 of 10 were rough phonation; for pitch-down, 3 of 11.</p>

      <p>That is differential measurement error: not a missing variable, but a variable that's in the model being mismeasured, in one direction, in one identifiable subset of the data.</p>

      <p>Then I tried to clean it, two defensible ways, and <strong>they disagreed with each other</strong>:</p>

      <pre><code>ECAPA, pitch direction

all data, contaminated        up 0.0408   down 0.0416   p = 0.947
drop impossible F0 only       up 0.0846   down 0.0565   p = 0.099
restrict to the clean corpus  up 0.0556   down 0.0845   p = 0.013</code></pre>

      <p>Look at the last two rows. They're near mirror images. Drop only the physically impossible values and <em>upward</em> deviation costs more. Restrict to the corpus where tracking is reliable throughout and <em>downward</em> costs more, at <em>p</em> = 0.013.</p>

      <p>I could have published the 0.013. It's significant, it matches my prediction, and the restriction is justifiable. But that restriction also throws out an entire corpus, so I can't attribute the result to removing bad F0 rather than to changing which manipulations are in the sample. And I chose it after seeing the null.</p>

      <p><strong>So the direction claim is withdrawn.</strong> I don't report that downward pitch costs more, because whether it does depends on which cleaning I pick, and I have no principled reason to prefer one.</p>

      <p>What I report instead is the instability itself — which is the more useful result anyway, and generalises further than a direction would have:</p>

      <p><strong>If you relate pitch to speaker-embedding behaviour across varied phonation, validate your F0 tracker per condition and publish the validation.</strong> Otherwise your pitch coefficient isn't interpretable, and a symmetric-looking result isn't evidence of symmetry. Plotting semitone deviation against condition would have caught mine in about thirty seconds.</p>

      <h2>The speaker nobody could explain</h2>

      <p>The last pre-registered analysis was per-speaker, with no prediction attached.</p>

      <p>Pitch predicts displacement in two of three fittable speakers, consistently across all three encoders. And then there's Vagelis, who has <strong>no significant association with any measured variable in any encoder</strong> — while having among the largest raw displacements in the entire study.</p>

      <p>Six acoustic variables, and together they don't explain where within his conditions the displacement lands.</p>

      <p>The temptation is to write "we haven't found the right variable yet." The honest version is narrower:</p>

      <p><strong>Large embedding displacement occurred without being adequately explained by the acoustic variables measured here.</strong></p>

      <p>With four speakers I'm not entitled to say anything about why.</p>

      <h2>What this is and isn't</h2>

      <p>It is not a demonstration that anyone gets locked out of their bank. No utterance in the new corpus crossed a 0.30 acceptance threshold. Scores degrade substantially; they don't cross.</p>

      <p>It is four speakers, unevenly distributed across two corpora, with corpus confounded against manipulation type and only one speaker bridging both, in a single session each, with one model per encoder family. It is a case series, and Hughes et al. is a better-controlled study than mine on the part where we overlap.</p>

      <p>No priority claim is made anywhere in the paper.</p>

      <h2>The two things I'd actually defend</h2>

      <p><strong>Pitch and jitter both predict displacement, independently, in all three encoders — and harmonics-to-noise ratio predicts nothing once jitter is in the model.</strong> HNR is the measure most people reach for. It correlates 0.55 with jitter and loses all independent power beside it. A study measuring only HNR concludes voice quality matters. A study measuring both attributes it correctly. I couldn't find this in the retrieved literature; the closest work either doesn't measure jitter, or measures it under channel degradation rather than production change.</p>

      <p><strong>And the effect appears at magnitudes nobody protects against.</strong> Not shouting, not whispering, not disguise. Someone speaking a little lower than usual, in a way you would not consciously notice.</p>

      <p><em>Everything is archived: <a href="https://doi.org/10.5281/zenodo.21921958">doi:10.5281/zenodo.21921958</a>. The manuscript, the pre-registration, the full prior-art audit including the claim it killed, per-utterance measurement tables for all three encoders, a provenance manifest mapping every row to its source recording and time offsets, every analysis script, and the 137 source recordings.</em></p>

      <p><em>The audio carries restricted terms. Research, benchmarking, evaluation and teaching are permitted. <strong>Use as training, fine-tuning or distillation data for any machine-learning model, and use for voice cloning or synthetic-voice generation, are prohibited.</strong> The speakers are four identifiable adults, three of whom are under separate commercial voice contract. If you maintain a training-data exclusion list, this record is meant to be on it.</em></p>
    </article>
  );
};
