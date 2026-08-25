import React from 'react';

export const WorkArticle: React.FC = () => {
  return (
    <article>
      <h1>Panagiotis (Panos) Gkilis — Machine Learning Engineer</h1>
      <p><em>Production ML systems, MLOps, speech and language AI. Everything below is deployed, measured, and open to inspection. Thessaloniki, Greece — open to remote.</em></p>
      <p>
        <a href="mailto:bedvibe@bedvibe.studio">bedvibe@bedvibe.studio</a> ·{' '}
        <a href="https://github.com/Mormolykos">GitHub</a> ·{' '}
        <a href="https://huggingface.co/pan82">Hugging Face</a> ·{' '}
        <a href="https://orcid.org/0009-0007-3805-170X">ORCID 0009-0007-3805-170X</a> ·{' '}
        <a href="https://www.linkedin.com/in/panagiotis-gkilis-57995117b">LinkedIn</a>
      </p>
      <hr />

      <p>Six years of end-to-end production machine learning: models trained from scratch, deployed behind live APIs, and operated for paying customers. Sole engineer of BedVibe Studios — a multilingual speech-AI platform built on a 730M-parameter text-to-speech model trained on consumer GPUs, running on FastAPI, PostgreSQL, Docker and Linux with Stripe-billed usage. Seven published research records with Zenodo DOIs. Four open-source Python libraries.</p>

      <h2>How I work</h2>

      <p>I develop with AI coding agents and treat their output as untrusted until it clears a gate: automated evaluation suites, ASR-validated model QA, static checks. Three of my published libraries <em>are</em> those gates — <a href="/ttsproof/">ttsproof</a> for text-to-speech failure modes, <a href="/trainproof/">trainproof</a> for training runs, and spkproof for speaker-verification measurement. That method is why a LoRA collapse and a live retrieval regression were caught before release rather than after.</p>

      <p>The pattern that runs through all of it: <strong>a fault that returns an error is one you fix this afternoon; a fault that returns a plausible success is one you ship.</strong> Most of what follows is about finding the second kind.</p>

      <h2>Speech and model training</h2>

      <p><strong>BedVibe-TTS</strong> — trained a 730M-parameter multilingual neural-codec TTS model from scratch: a 24-layer autoregressive transformer plus a non-autoregressive stage over codec tokens, 13 languages, 6 emotional states, roughly 3,000–4,000 GPU-hours on consumer hardware. Serves live behind FastAPI with async queues, 200–400 ms GPU inference per utterance, and token-based billing. <a href="https://tts.bedvibe.studio">tts.bedvibe.studio</a></p>

      <p><strong>Data pipeline</strong> — a 108,000-sample multilingual corpus with a custom 16k SentencePiece tokenizer, an ECAPA-TDNN speaker-embedding pipeline across 4,287 samples with zero failures, and a memory-mapped binary format that removed a 3–5× dataloading bottleneck.</p>

      <p><strong>Evaluation that gates releases</strong> — an ASR-driven QA harness measuring WER/CER with silence, loop and replay detection on every checkpoint. It caught a total LoRA fine-tune collapse — 60 of 60 hard failures against 14 of 60 at baseline — before that model reached anyone.</p>

      <h2>Retrieval, agents and inference</h2>

      <p><strong>A grounded RAG agent</strong> answering questions about my work from an indexed corpus, behind a 32-case adversarial evaluation gate covering prompt injection, credential invention and refusal. Retrieval runs on one of three interchangeable vector backends. I benchmarked all three and shipped the simplest: brute-force NumPy at 0.86 ms, FAISS at 0.035 ms, Qdrant over gRPC at 1.3 ms and over REST at 12.4 ms — transport cost nine times what the database did. Qdrant held 433 MB to serve a corpus under one megabyte. The crossover where FAISS wins by 302× is measured and written down.</p>

      <p><strong>Full-path tracing</strong> — sixteen OpenTelemetry spans with Langfuse joined on the same trace id, so one string opens a request in either tool. The first thing it told me was a lie: 34.6% of retrieval time attributed to a span that does nothing, because the Windows clock ticks slower than the work being measured. Once the clock was fixed, it found the real defect — a fresh model client constructed on every answer, 8.27 ms at p50, more than twice the cost of all retrieval combined. Request p50 went 12.41 → 2.91 ms.</p>

      <p><strong><a href="https://github.com/Mormolykos/basalt">basalt</a></strong> — an OpenAI-compatible model gateway with per-key quota, token metering, bounded admission, deadline-aware retries and failover. Removing the backpressure returned HTTP 200 to all 32 concurrent callers while 31 arrived after the caller had given up: a 100% success rate and one usable answer. <a href="/success-rate/">The full write-up is here.</a></p>

      <p><strong><a href="https://github.com/Mormolykos/slate">slate</a></strong> — an MCP client and retrieval server with typed responses instead of JSON strings, so a drifting tool schema fails loudly instead of returning a confident wrong answer. The protocol boundary costs 1.85 ms on top of 2.04 ms of retrieval.</p>

      <p><strong>Framework evaluation</strong> — the same production task built four ways across eight fault scenarios. Plain CrewAI returned <em>success</em> while publishing content that violated my own rules in two of eight scenarios; LangGraph stopped and said why. I chose the framework I did not adopt and can show the measurement.</p>

      <h2>Published research</h2>

      <ul>
        <li><strong>Intra-Speaker Vocal Variation and Speaker-Embedding Displacement</strong> — <a href="https://doi.org/10.5281/zenodo.21921958">10.5281/zenodo.21921958</a>. Four speakers, matched sentences, three encoders; 30 of 30 cells negative. Pre-registered, with the adversarial prior-art audit and a withdrawn result published in full. <a href="/speaker-drift/">Write-up</a>.</li>
        <li><strong>The Loss Curve Is Not a Sufficient Statistic</strong> — <a href="https://doi.org/10.5281/zenodo.21864659">10.5281/zenodo.21864659</a>. A sentinel–class collision makes masked cross-entropy silently delete an entire class while the loss curve descends normally. Reproduced in 40 lines on CPU.</li>
        <li><strong>BedVibe-TTS engineering report</strong> — <a href="https://doi.org/10.5281/zenodo.19781414">10.5281/zenodo.19781414</a>.</li>
        <li><strong>An Automated Failure-Mode QA Framework for Neural TTS</strong> — <a href="https://doi.org/10.5281/zenodo.20757553">10.5281/zenodo.20757553</a>. 390 samples, zero structural defects, blinded human validation of the ASR-uncertain cases.</li>
        <li><strong>Diagnosing Hierarchical Retrieval Failure in Long-Document RAG</strong> — <a href="https://doi.org/10.5281/zenodo.20692451">10.5281/zenodo.20692451</a>.</li>
        <li><strong>LongBook Verifier</strong> — <a href="https://doi.org/10.5281/zenodo.20513116">10.5281/zenodo.20513116</a>. A 240,767-word retrieval benchmark with evidence-grounded scoring.</li>
        <li><strong>A 2D Linear-Elasticity FE Solver Validated Against Kirsch</strong> — <a href="https://doi.org/10.5281/zenodo.21892064">10.5281/zenodo.21892064</a>. Hand-written mesher and solver, no FEA library. Recovers 3.00002 against an exact 3 the code never receives. <a href="/fem-kirsch/">Write-up</a>.</li>
      </ul>

      <h2>Open source</h2>

      <p><a href="https://github.com/Mormolykos/trainproof">trainproof</a> — a deterministic linter for training runs. 84 rule IDs, five log formats, standard library only. Its tfevents reader is written from the wire format and validated byte-exact against TensorBoard's own parser. <a href="/trainproof/">Write-up</a>.</p>

      <p><a href="https://github.com/Mormolykos/ttsproof">ttsproof</a> — failure-mode QA for text-to-speech, built from the published framework. <a href="/ttsproof/">Write-up</a>.</p>

      <p><a href="https://github.com/Mormolykos/notchecked">notchecked</a> — coverage accounting for validators: what was checked, what could not be checked, and what was never in scope, as eight terminal states rather than pass/fail. Co-designed with a compliance engineer working in a domain I have never worked in. <a href="/notchecked/">Write-up</a>.</p>

      <p><a href="https://github.com/Mormolykos/aether">aether</a> — real-time ADS-B telemetry with per-axis Kalman tracking and closed-form conjunction screening, in Rust with a C ABI. A controlled A/B took rejection of valid observations from 16.1% to 1.9%. <a href="/observation-time/">Write-up</a>.</p>

      <h2>Infrastructure</h2>

      <p>A ten-service backend on a self-managed Linux server: nginx with TLS termination, every service isolated as a systemd unit, PostgreSQL 16, default-deny firewall, Cloudflare in front. Stripe billing with idempotent webhooks. A Rust/axum service in front of Amazon Polly using IAM via the AWS SDK's provider chain. A defensive telemetry lab around it all — an isolated honeypot, event capture, and single-address threat lookup. Across five weeks it recorded that 12% of edge traffic is credential hunting, the most requested file on my servers is <code>.env</code> at 189 attempts, and every one of those attempts failed: 4,488 not-found, 1,508 redirected, 189 blocked, and zero 200s.</p>

      <h2>What I am looking for</h2>

      <p>Remote work on production AI systems — retrieval, evaluation, inference serving, or the operational layer around models. I am most useful where something is already running and somebody needs to know whether it is telling the truth.</p>

      <p><a href="https://tts.bedvibe.studio/portfolio/">Thirty-six systems with architecture write-ups and screenshots</a> · <a href="https://tts.bedvibe.studio/portfolio/Panagiotis_Gkilis_CV_short.pdf">CV (PDF)</a> · <a href="mailto:bedvibe@bedvibe.studio">bedvibe@bedvibe.studio</a></p>
    </article>
  );
};
