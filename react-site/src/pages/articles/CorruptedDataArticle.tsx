import React from 'react';

export const CorruptedDataArticle: React.FC = () => {
  return (
    <article>
      <h1>Why Corrupted Training Data Doesn't Show Up as High Loss</h1>
      <p><em>Everyone assumes bad samples announce themselves. Two failures from my own work — one reproducible, one from production — say the opposite: noise is learnable, so it hides.</em></p>
      <hr />

      <p>There's an assumption almost every practitioner carries, usually without examining it: <strong>if your dataset has bad samples in it, the loss will tell you.</strong> Corrupted rows spike. Broken files stick out. Sort by per-sample loss, look at the top of the list, and there's your garbage.</p>

      <p>I believed it too. Two separate failures in my own work say it's wrong, and they fail in the same direction — quietly.</p>

      <h2>The reproducible one: a dataset that cannot be learned</h2>

      <p>While validating <a href="/trainproof/">trainproof</a>, I ran a controlled fault-injection study: one base setup — a Qwen2.5-3B QLoRA — run six ways, three seeds each, eighteen runs total, every log shipped in the repo so anyone can check the verdicts.</p>

      <p>One configuration shuffled the dataset's labels into pure noise. The labels no longer corresponded to the inputs at all. This is not a hard dataset or a noisy dataset. It is a dataset that <em>cannot be learned</em>, because there is no relationship left to learn.</p>

      <p>That run <strong>reduced its loss by 62%.</strong></p>

      <p>On its own curve it was textbook-healthy: a clean downward slope, no spike, no plateau, nothing a human or a rule would flag. It was learning absolutely nothing useful — it was memorising the statistics of noise, which any sufficiently large network will happily do. From a single run's loss curve, it is indistinguishable from a real one.</p>

      <p>That was the moment the assumption broke for me. Not "loss is a weak signal for this" — <em>loss is not a signal for this at all</em>, in isolation.</p>

      <h2>The production one: white noise in a speech corpus</h2>

      <p>The second failure came from real work, not an experiment, and it's the one I think about more.</p>

      <p>Building a text-to-speech dataset, I had a corpus of roughly 110,000 recordings. A small number of those files were pure loud white noise. Not corrupted in the file-format sense — they opened fine, they played fine, they had valid headers and valid duration. They simply contained no speech. Just noise, at volume.</p>

      <p>They did not surface as high-loss outliers.</p>

      <p>I want to be precise about the epistemic status of this one, because it matters: <strong>those training logs no longer exist.</strong> I cannot show you the numbers and I'm not going to reconstruct them from memory. This is a production observation, not a measurement. Treat it as the anecdote that sent me looking, and treat the fault-injection study above as the part that carries evidence.</p>

      <p>But the two line up, and that's the point of writing this down.</p>

      <h2>Why it happens: noise has learnable statistics</h2>

      <p>The mechanism is the same in both cases, and once you see it the surprise goes away.</p>

      <p>We treat "noise" as a synonym for "unpredictable," and then quietly assume a model will fail loudly on it. But white noise is not unpredictable in the way that matters to a loss function. It is <em>stationary</em> and <em>uniform</em>. Its distribution is simple and consistent. A network can fit that distribution quickly and cheaply — and fitting it registers as loss going down.</p>

      <p>Shuffled labels are the same story from the other side. The mapping is destroyed, so nothing generalisable remains, but the network can still memorise the marginal statistics of the targets. Loss falls. Nothing spikes.</p>

      <p><strong>In both cases the model learned something. It just wasn't the thing you wanted.</strong> The loss function has no opinion about which of those two it did.</p>

      <h2>What to do instead</h2>

      <p>Two things follow, and neither is exotic.</p>

      <p><strong>Compare against a baseline, don't judge in isolation.</strong> The shuffled-labels run becomes obvious the moment you put it beside a known-good run and look at the <em>relative</em> floor each one reaches. The corrupted run's loss floor sits in a different regime entirely. One run alone lies; two runs side by side tell the truth. That's why trainproof has a <code>compare</code> mode at all — not as a convenience, but because single-run rules provably cannot catch this class of failure.</p>

      <p><strong>Check the data as data, before training.</strong> This is the part I got wrong for longer than I'd like. I was trying to infer dataset quality from the training curve, which is an indirect measurement of an indirect measurement. For audio, the checks are cheap and direct: spectral flatness, dynamic range, silence ratio, speech-band energy. A pure white-noise file is trivially separable from speech by any of them — <em>if you look at the audio.</em> It is not separable by looking at the loss.</p>

      <h2>The general shape</h2>

      <p>I think this generalises past my two cases, and it's worth stating plainly:</p>

      <p><strong>A loss curve measures whether the model is fitting something. It does not measure whether that something is your task.</strong></p>

      <p>Any corruption that replaces your signal with a distribution the model can fit will pass every loss-shaped check you own. Truncated samples, silence, duplicated rows, label noise, wrong-language text, empty targets — none of these are guaranteed to spike. Some of them are guaranteed <em>not</em> to.</p>

      <p>The failures that burn the most GPU hours aren't the ones that crash. They're the ones that look exactly like success.</p>

      <p><em>The fault-injection logs are all in the <a href="https://github.com/Mormolykos/trainproof" target="_blank" rel="noopener noreferrer">trainproof repo</a>, including the shuffled-labels run and a 9.8-hour Coqui XTTS fine-tune that diverged on its own with nobody touching it. If you've hit a failure mode that a deterministic check would have caught, tell me on the repo — it goes in, with credit.</em></p>
    </article>
  );
};
