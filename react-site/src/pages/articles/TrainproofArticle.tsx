import React from 'react';
import { getProject } from '../../data/site';
import { ProjectStatus } from '../../components/ProjectStatus';

export const TrainproofArticle: React.FC = () => {
  const project = getProject('trainproof');
  return (
    <article>
      <h1>Loss Curves Lie: Building a Deterministic Linter for ML Training Runs</h1>
      <p><em>A run learning pure noise reduced its loss by 62% and looked textbook-healthy. trainproof catches the training failures that can be caught — and is honest about the ones that can't.</em></p>
      <hr />
      
      <ProjectStatus project={project} currentArticleId="trainproof" />

      <p>I kept losing GPU hours to runs that were already dead. A fine-tune that had quietly gone to NaN somewhere after step 300 and trained on garbage the rest of the night. A run that was training at learning-rate-<em>zero</em> the whole time and updating nothing. A dataset with a few hundred broken rows I only discovered at the end. Every time, the pattern was the same: the run <em>looked</em> like it was working, and nothing told me otherwise until the hours were already spent.</p>
      <p>So I built a linter for training runs — <strong>trainproof</strong> — and then I spent days trying to prove it wrong.</p>
      <pre><code className="language-bash">pip install trainproof
trainproof doctor .   # zero-config: discovers and judges every training log it finds
      </code></pre>
      <p><em>Repo: <a href="https://github.com/Mormolykos/trainproof" target="_blank" rel="noopener noreferrer">github.com/Mormolykos/trainproof</a> (MIT)</em></p>
      
      <h2>The philosophy: no ML judging ML</h2>
      <p>The most important decision in trainproof is what it <em>isn't</em>. There's no model scoring your run. No "87%-confidence this looks unhealthy." <strong>Every verdict is a deterministic rule that either fires or it doesn't, and every finding cites the exact numbers behind it.</strong> When it can't be sure, it says so instead of guessing.</p>
      <p>That constraint is the whole point. A reliability tool that hallucinates is worse than no tool, because now you don't trust your own alarms. trainproof's engine is IO-free and doesn't even import torch — it reads plain logs and applies rules. You can read every rule and know exactly why it fired.</p>
      
      <h2>Validating the rules: controlled fault injection</h2>
      <p>You validate a detector by feeding it faults whose answer you already know, then measuring what it catches. One base setup — a Qwen2.5-3B QLoRA on an RTX 5080 — run six ways:</p>
      <ul>
      <li><strong>healthy</strong> — the control.</li>
      <li><strong>lr_hot</strong> — learning rate cranked 100× too high.</li>
      <li><strong>lr_zero</strong> — learning rate at zero.</li>
      <li><strong>fp16_nan</strong> — an fp16 overflow that NaNs the loss.</li>
      <li><strong>bad_labels</strong> — the dataset's labels shuffled into pure noise.</li>
      <li><strong>overfit</strong> — 64 training samples and many epochs: pure memorisation, with a held-out eval set to prove it.</li>
      </ul>
      <p>Three seeds each: <strong>18 runs</strong>, real logs, all shipped in the repo so you can reproduce every verdict. A nineteenth log ships beside them with no injected fault at all — a 9.8-hour Coqui XTTS fine-tune that diverged on its own.</p>
      <p>Four of the five failures got caught fast. <code>lr_hot</code> spiked the gradient norm to <strong>2,650× the median</strong> — flagged in seconds. The NaN and the flatline were trivial. But one config beat the tool completely, and it's the one that taught me the most.</p>
      
      <h2>The one that fooled it: shuffled labels</h2>
      <p><code>bad_labels</code> was pure garbage — a dataset that <em>cannot be learned</em>, because the labels no longer correspond to the inputs. And that run <strong>reduced its loss by 62%.</strong></p>
      <p>On its own loss curve it looked like textbook-healthy training: a clean downward slope. It was learning absolutely nothing useful — just memorizing the statistics of noise, which any sufficiently large network will happily do. From a single run's loss curve, <strong>it is indistinguishable from a real run.</strong> No loss-only rule, looking at that run in isolation, can catch it.</p>
      <p>That's not a gap I papered over — I wrote it straight into the README. It's also <em>why</em> trainproof has a <code>compare</code> mode: the failure becomes obvious the moment you put the run next to a known-good baseline and look at the <em>relative</em> floor it reaches. The corrupted run's loss floor sits in a different regime. One run in isolation lies; two runs side by side tell the truth.</p>
      
      <h2>What trainproof actually does</h2>
      <p>It covers a run's whole life, and every stage exits with a status code so it drops straight into CI:</p>
      <ul>
      <li><strong>Before a single GPU-second — <code>preflight</code>.</strong> Lints the dataset and tokenizer: malformed JSONL (with the line number), empty rows, duplicates, missing <code>eos_token</code>, <code>pad == eos</code>, over-length samples. Catch the broken dataset <em>before</em> you rent the GPU.</li>
      <li><strong>During training — the guardian.</strong> A one-line Hugging Face callback. It warns by default; flip on <code>stop_on_fail</code> and it will abort a doomed run itself. In one guarded demo, it killed a diverging run at <strong>step 20 of 300 scheduled steps</strong> — so 280/300 (≈93%) of the scheduled steps never executed. (That's a statement about <em>that run</em>, not a promise about your GPU bill — but a diverging run you stop at step 20 is a diverging run you didn't pay to finish.)</li>
      <li><strong>After — <code>epoch</code> and <code>doctor</code>.</strong> Read the finished log and classify it: diverged, flatlined, NaN'd, spiked, overfitting.</li>
      <li><strong>Versus a baseline — <code>compare</code>.</strong> The relative-floor rules that catch the shuffled-labels case.</li>
      </ul>
      <p>It reads the logs you already produce — Hugging Face <code>trainer_state.json</code>, Coqui, plain JSONL/CSV — so there's nothing to instrument.</p>
      
      <h2>Try it</h2>
      <pre><code className="language-bash">pip install trainproof
      </code></pre>
      <ul>
      <li>Repo (with all 18 fault-injection logs, plus the one that broke by itself): <strong><a href="https://github.com/Mormolykos/trainproof" target="_blank" rel="noopener noreferrer">https://github.com/Mormolykos/trainproof</a></strong></li>
      <li>MIT licensed.</li>
      </ul>
      <p>If you fine-tune, you've had at least one of these failures. I'd genuinely like to know <strong>which failure mode has burned your GPU hours</strong> — if a deterministic check would have caught it, tell me on the repo and it goes in, with credit.</p>
      
      <h2>Update: what came after</h2>
      <p>Since this article was written, trainproof has grown from the experiment above into a fuller tool. The release timeline at the top of this page is generated from GitHub Releases and PyPI, so it is always current — this section covers what changed in kind, not which version you are on:</p>
      <ul>
      <li><strong><code>trainproof doctor .</code></strong> — point it at a directory; it discovers every training log, judges them all, and prints a triage-sorted summary. The six configurations above are now one command.</li>
      <li><strong>Guardian telemetry</strong> — the Hugging Face callback measures wall-clock step time live; deterministic rules catch step-time cliffs and dataloader-bound runs, and <code>watch --stall-timeout</code> warns when the log stops growing.</li>
      <li><strong>Stable rule IDs</strong> (<code>TP-DIVERGE</code>, <code>TP-DEAD-RUN</code>, …) documented in <a href="https://github.com/Mormolykos/trainproof/blob/main/RULES.md" target="_blank" rel="noopener noreferrer">RULES.md</a>, an honest PASS that lists which checks ran and which were skipped, and <code>--json</code> output built for CI pipelines and AI coding agents.</li>
      <li><strong>A failure nobody injected.</strong> Injected faults are cleaner than real ones. That is the known limitation of any fault-injection study, and it is why this one does not stand alone. The gallery now ships <code>examples/real_world/xtts_diverged</code>: a 9.8-hour Coqui XTTS fine-tune that diverged on its own, in my own work, with nobody touching it. All three seeds of every configuration ship too — 18 runs at seeds 42/43/44, where before only one seed per configuration was committed — so "three seeds out of three" became a claim you can check rather than one you have to take on trust.</li>
      </ul>

      <h2>Update: the linter failed its own test</h2>
      <p>This article argues that a training run can look healthy while learning nothing. Auditing trainproof before a release, I found it doing exactly that — to itself.</p>
      <p>The question was mundane. What happens to a run whose loss is <em>exactly</em> 0.0 on every step? That is a real failure with a boring cause: if every target label is masked to <code>-100</code>, cross-entropy returns zero and the model learns nothing at all. trainproof's answer was <strong>PASS</strong>.</p>
      <p>Every loss-shape check — flat curve, divergence, no-improvement — was guarded by a <code>&gt; 0</code> test, put there to avoid dividing by zero. On an all-zero curve all three guards bailed out, silently. The run reached a passing verdict, and that verdict then <em>named those same three checks as having run</em>.</p>
      <p>That is worse than missing the failure. A tool that reports "I checked this" when it did not is not a weak alarm, it is a false one — and it is the same shape as the <code>bad_labels</code> run above: something that looks like evidence of health and is nothing of the kind. The same audit found the hole in three more places, including a baseline comparison that rated a zero-loss run as <em>favourable</em>, because a loss floor of zero beats every baseline there is.</p>
      <p><strong>v0.12.0</strong> is the fix, and it encodes one sentence: <em>a skipped check is not a passed check.</em> A PASS now names every check that ran and every check that did not, each with its reason, as structured data rather than prose. Judging a log that has no evaluation set now says so out loud:</p>
      <pre><code className="language-text">Ran: dead-run, divergence, flat-loss, grad-spike, lr, zero-grad, zero-loss.
Skipped: loader (no loader_time/step_time pair in the log);
         overfit (no eval_loss in the log - this run has no
         generalisation signal at all);
         step-time (no step_time column in the log).
      </code></pre>
      <p>You can read that and know what the pass is worth. Nothing about how trainproof judges a run changed — all 38 locked verdicts are byte-identical to the previous release. What changed is that it stopped overstating what it had looked at.</p>
    </article>
  );
};
