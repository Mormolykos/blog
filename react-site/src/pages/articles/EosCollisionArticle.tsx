import React from 'react';

export const EosCollisionArticle: React.FC = () => {
  return (
    <article>
      <h1>One Integer Deleted the Stop Token From My Loss. The Curve Never Noticed.</h1>
      <p><em>My text-to-speech model trained for weeks and never learned to stop talking. The cause was two constants that happened to be equal — and no loss curve, anywhere, could have told me.</em></p>
      <hr />

      <p>For a long time I had a model that trained cleanly and produced nothing usable. The loss fell. The gradients were finite. Nothing crashed. It simply never learned to stop — every generation ran to the length cap and got truncated.</p>

      <p>The cause was two lines of my own source that were individually correct.</p>

      <h2>The collision</h2>

      <p>In a neural codec language model, the audio vocabulary has a fixed size, and the stop token is added on top of it as one extra class. So the output layer is one wider than the codebook:</p>

      <pre><code className="language-python">nn.Linear(d_model, NUM_AUDIO_TOKENS + 1)   # 1025 classes: 0..1023 audio, 1024 = EOS
eos_id = NUM_AUDIO_TOKENS                  # 1024
</code></pre>

      <p>That is all correct. EOS is the last class, and the layer has room for it.</p>

      <p>Then, elsewhere, the loss:</p>

      <pre><code className="language-python">F.cross_entropy(logits, targets, ignore_index=NUM_AUDIO_TOKENS)
</code></pre>

      <p>Also, on its own, a reasonable line. <code>ignore_index</code> is how you tell cross-entropy to skip padding.</p>

      <p><strong>But the sentinel and the stop token are the same integer.</strong> Every position whose target was "stop" was discarded before the loss was computed. Not down-weighted — removed. The model was never once shown an example of stopping, across every epoch it ever ran.</p>

      <p>PyTorch's default <code>ignore_index</code> is <code>-100</code> precisely because it must be a value that can never be a real class. The moment you replace it with a real vocabulary constant, that guarantee is gone, and nothing warns you: the shapes are valid, the loss is finite, the run looks healthy.</p>

      <h2>The part that should worry you: the curves are identical</h2>

      <p>I built a minimal reproduction — small, fast, two arms differing only in the sentinel value. One with the collision, one without.</p>

      <p><strong>The broken arm finished at 0.0035. The fixed arm finished at 0.0034.</strong></p>

      <p>Those are the same curve to any human, any dashboard, and any threshold you would write. One of them has a working objective and one of them has an objective with a hole in it, and the loss cannot distinguish them — because the loss is computed <em>over what survived the mask</em>. A metric cannot report on the examples it never received.</p>

      <p>This is the general statement, and it's the reason I'm writing this down rather than just fixing my code:</p>

      <p><strong>The training loss is not a sufficient statistic for model capability. It cannot reveal a corrupted objective, and it cannot select the best checkpoint.</strong></p>

      <h2>The second half: lowest loss, worse model</h2>

      <p>The checkpoint-selection half was measured separately, and it's the part I'd have believed least.</p>

      <p>Taking the checkpoint with the best loss instead of an earlier one bought a <strong>20% improvement in loss</strong> and cost <strong>54% of the model's stop-capability.</strong> Measured twice, independently.</p>

      <p>"Save the checkpoint with the lowest validation loss" is the default in more or less every training script in existence, including the ones I have written. On this run it was actively the wrong rule, and the number it optimised looked better the whole way down.</p>

      <h2>The same integer, safe one stage over</h2>

      <p>The detail I find most instructive: the identical line is harmless in the next stage of the same model.</p>

      <p>The autoregressive stage predicts the first codebook plus EOS — <strong>1025 classes</strong>, so <code>1024</code> is a real class, and using it as a sentinel is fatal. The non-autoregressive stage predicts audio codes only — <strong>1024 classes</strong>, so <code>1024</code> is out of range, and the exact same <code>ignore_index</code> is correct.</p>

      <p>One <code>+ 1</code> in a different file decides whether that line destroys your objective. Both stages read identically at the call site. That is not a mistake you catch by reading carefully; it's a mistake you catch by checking a relationship between two numbers that never appear together.</p>

      <h2>Which is what a linter is for</h2>

      <p>This is now a check in <a href="/trainproof/">trainproof</a>, my linter for training runs, as two rules:</p>

      <ul>
        <li><strong>Sentinel collision.</strong> Compare the output layer's class count against the <code>ignore_index</code>. If the sentinel is a valid class, fail. If it sits exactly one past the end, say so explicitly — because the same integer is fatal one class earlier, and that distinction deserves to be visible rather than silently passed.</li>
        <li><strong>Dead class.</strong> Accumulate which classes ever reach the loss as a positive target during the first epoch, then flag any class the output layer can emit but that never once appears as an answer. This is the check that would have saved a year.</li>
      </ul>

      <p>My own two stages are the regression fixture — the fatal case and its safe twin, one integer apart. Not a synthetic example.</p>

      <p>The design decision worth stating: the dead-class rule only fires when coverage is already broad and few classes are missing. One unseen class out of 1025 is a structural exclusion. Nine hundred unseen is a small sample. Without that guard the check screams on every short run and gets switched off — which is how good checks die.</p>

      <h2>What it cost, and what it didn't</h2>

      <p>Weeks of GPU time on a model that could not have learned the thing I was training it for. Not because the architecture was wrong or the data was bad, but because one constant was reused in two roles and both uses read as correct in isolation.</p>

      <p>I don't think this is rare. Any codebase where a padding sentinel, an end-of-sequence id, and a vocabulary size are all defined as named constants in different files can produce it, and none of your instrumentation will complain. The loss goes down. The run looks fine. The model quietly never learns one specific thing, and you spend months looking at the wrong layer.</p>

      <p>If you fine-tune anything with a custom <code>ignore_index</code>, go and check it against your output layer's width right now. It takes thirty seconds and the failure mode is silent.</p>

      <p><em>Related: <a href="/corrupted-training-data/">why corrupted training data doesn't show up as high loss</a> — the same lesson from the data side. <a href="https://github.com/Mormolykos/trainproof" target="_blank" rel="noopener noreferrer">trainproof on GitHub</a>, MIT.</em></p>
    </article>
  );
};
