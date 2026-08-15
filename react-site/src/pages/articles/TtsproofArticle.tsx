import React from 'react';
import { getProject } from '../../data/site';
import { ProjectStatus } from '../../components/ProjectStatus';

export const TtsproofArticle: React.FC = () => {
  const project = getProject('ttsproof');
  return (
    <article>
      <h1>Your TTS Model Sounds Great — Until It Says "GPUB"</h1>
      <p><em>ttsproof: automated failure-mode QA for text-to-speech, backed by a published 390-sample study.</em></p>
      <hr />
      
      <ProjectStatus project={project} currentArticleId="ttsproof" />

      <p>I built a text-to-speech product, and I kept getting burned by the same thing. On normal sentences the model sounded great. Then it would hit a number, a date, an acronym, or a name — and quietly mangle it. Worse, the standard metric everyone reaches for, Word Error Rate, was lying to me in <em>both</em> directions: it flagged perfectly good audio as broken because the script said <code>3:30 PM</code> and the transcript said "three thirty pee em," and it <em>missed</em> real failures on short tokens where the speech recognizer was as unreliable as the TTS.</p>
      <p>So I wrote the QA framework I wished I'd had, packaged it as <strong>ttsproof</strong>, and then ran it as a blind study against a production TTS service so the results would be more than an opinion.</p>
      
      <h2>The two failures WER can't see</h2>
      <p>A TTS pipeline breaks in two different ways, and a single WER number blurs both:</p>
      <ol>
      <li><strong>Structural defects.</strong> The clip is empty, truncated, three times too long, stuck in a repeated-chunk loop, clipping, or has a click/pop at the tail. These have nothing to do with pronunciation — you can catch them with no model at all, from the waveform.</li>
      <li><strong>Pronunciation / content errors</strong> on the hard cases: numbers, decimals, dates, clock times, acronyms, single letters, URLs, names.</li>
      </ol>
      <p>ttsproof splits them apart and handles each honestly:</p>
      <ul>
      <li><strong>Structural checks (no model needed)</strong> — empty/truncated audio, duration explosions, long internal silences, clipping, loop detection, end-of-clip artifacts. Just numpy + soundfile.</li>
      <li><strong>Equivalence-aware WER/CER</strong> — the expected text and the ASR transcript are <em>both</em> canonicalized to spoken form (numbers, decimals, dates, clock times, acronyms, letters) before scoring, so <code>3:30 PM</code> vs "three thirty" stops counting as an error.</li>
      <li><strong>ASR-uncertainty quarantine</strong> — when the audio is structurally clean but the recognizer disagrees on a very short utterance (a letter, an acronym), the sample is set aside for a human instead of being auto-failed — because at that length, the ASR is as likely to be wrong as the TTS.</li>
      </ul>
      
      <h2>The study: 390 samples, and a blind human check</h2>
      <p>I evaluated the method against a production neural TTS service — <strong>130 edge cases × 3 voices = 390 samples</strong> — and published it as a citable technical report (<a href="https://doi.org/10.5281/zenodo.20757553" target="_blank" rel="noopener noreferrer">DOI 10.5281/zenodo.20757553</a>, CC-BY-4.0).</p>
      <ul>
      <li><strong>Zero structural audio-integrity defects</strong> across all 390 clips — the audio was always structurally clean, which matters, because it means the failures that <em>did</em> exist were all pronunciation, exactly the kind WER mislabels.</li>
      <li>Exact-match rate <strong>0.769</strong>.</li>
      <li>Then the honest part: a <strong>blind human review</strong> of the ASR-uncertain "quarantine" zone. Of 42 uncertain clips, <strong>23 (55%) were ASR false-negatives</strong> (the TTS said it right, the recognizer misheard) and <strong>19 (45%) were genuine TTS mispronunciations</strong>. Fifteen control clips: 15/15 rated correctly, so the rater was reliable.</li>
      </ul>
      <p>That 45/55 split is the entire argument for the quarantine verdict. Auto-passing that zone would ship 19 real mispronunciations; naive ASR-WER auto-failing it would wrongly kill 23 correct clips. Neither is acceptable, so ttsproof refuses to guess there.</p>
      
      <h2>What the real failures looked like</h2>
      <p>All 19 genuine failures were short, isolated letters and acronyms — and the pattern is oddly specific:</p>
      <table>
      <thead>
      <tr>
      <th>Failure mode</th>
      <th>Examples</th>
      </tr>
      </thead>
      <tbody>
      <tr>
      <td>A-vowel substitution</td>
      <td><code>NATO</code> → "NITO", <code>USA</code> → "USI", <code>CIA</code> → "CII"</td>
      </tr>
      <tr>
      <td>Trailing appended phoneme</td>
      <td><code>GPU</code> → "GPUB", <code>EU</code> → "EUU"</td>
      </tr>
      <tr>
      <td>Early truncation</td>
      <td><code>R</code> chopped short</td>
      </tr>
      <tr>
      <td>Doubling</td>
      <td><code>X</code> said twice</td>
      </tr>
      <tr>
      <td>Other substitution</td>
      <td><code>CEO</code> → "CEE", <code>Z</code> → "SZ"</td>
      </tr>
      </tbody>
      </table>
      <p>Note that the structural tail/too-short detectors did <strong>not</strong> fire on these — "GPUB" is intelligible speech, not a click. Structural checks and ASR-quarantine are complementary; neither alone catches everything.</p>
      
      <h2>Benchmark any engine in one command</h2>
      <p>Beyond the study, ttsproof ships a built-in <strong>corpus of 817 curated edge cases across 39 categories</strong> — numbers, currencies, dates, ISO timestamps, phone numbers, URLs, file paths, pronunciation-torture words (Worcestershire, synecdoche…), proper names (Reykjavík, Nguyễn…), Greek, Norwegian, and more. The corpus is versioned independently of the software, so published scores stay comparable across tool updates.</p>
      <p>It's engine-agnostic — point it at any TTS via a command template or a folder of audio you already generated:</p>
      <pre><code className="language-bash">ttsproof benchmark --cmd "mytts --text {'{'}text{'}'} --wav {'{'}out{'}'}"
      </code></pre>
      <p>You get a category scoreboard, a self-contained <code>report.html</code> (waveforms, an audio player, and what the ASR actually heard), and a CI regression gate. You can even benchmark closed-source engines (ElevenLabs, OpenAI) through a SpeechSDK wrapper — an integration a user suggested after the first release.</p>
      
      <h2>Try it</h2>
      <pre><code className="language-bash">pip install ttsproof            # structural checks + metrics + corpus
pip install "ttsproof[asr]"     # + faster-whisper for pronunciation gating
      </code></pre>
      <ul>
      <li>Repo: <strong><a href="https://github.com/Mormolykos/ttsproof" target="_blank" rel="noopener noreferrer">https://github.com/Mormolykos/ttsproof</a></strong> (MIT)</li>
      <li>The study: <strong><a href="https://doi.org/10.5281/zenodo.20757553" target="_blank" rel="noopener noreferrer">https://doi.org/10.5281/zenodo.20757553</a></strong></li>
      </ul>
      <p>It's already had its first outside contribution — a community fix for a real number-formatting bug — which is exactly the kind of thing I hoped for. If your TTS breaks on something, open an issue with the case; the corpus grows from real failures.</p>
    </article>
  );
};
