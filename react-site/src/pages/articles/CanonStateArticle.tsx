import React from 'react';

export const CanonStateArticle: React.FC = () => {
  return (
    <article>
      <h1>The Canon Is the Database</h1>
      <p><em>A fictional universe outgrew my context window. So I stopped treating it as a pile of documents and started treating it as a persistent, machine-readable knowledge system that generation has to be validated against.</em></p>
      <hr />

      <p>This is about a small problem that sits underneath a fashionable one. Not building a model of the physical world — the far more modest question of what it takes for a generative model to <strong>keep a single invented world straight</strong> across a corpus that has outgrown any context window.</p>

      <p>The thesis is narrow, and I want to state it before defending it:</p>

      <p><em>A large fictional universe can be treated as a persistent, machine-readable knowledge system rather than a pile of documents. When a model generates new material, it should retrieve the canonical state relevant to that moment, generate under those constraints, and have the result validated against the existing canon before anything is accepted.</em></p>

      <p>Nothing here is a world model in the embodied sense. No physics, no learned dynamics. The analogy is limited and specific: both problems are about grounding generation in a persistent representation of a world rather than in the model's parameters. That is where the resemblance ends, and I will not stretch it further.</p>

      <h2>Why this became necessary</h2>

      <p>I write a long-running dark fantasy saga and produce it as dramatized audio. Five novels in, the corpus crossed a threshold that changed the nature of the problem.</p>

      <p>Early on, a language model could hold enough of the world in a conversation to be useful. Later it could not — and the failure mode was not the obvious one. The problem was rarely "find the paragraph where this was established." It was that a single new scene can depend, simultaneously, on:</p>

      <ul>
        <li>character identity, and how a name is rendered in-world</li>
        <li>relationships, including ones that changed three books ago</li>
        <li>chronology — what has and has not happened yet</li>
        <li>geography and travel time between named places</li>
        <li>invented terminology and language rules</li>
        <li>world rules that constrain what is physically possible</li>
        <li>and, critically, <strong>what a given character is not supposed to know at that point in the story</strong></li>
      </ul>

      <p>That last constraint is the interesting one, because it is not a retrieval problem at all. It is a <em>state</em> problem. The correct answer depends on where in the timeline you are standing.</p>

      <p>Long-context models do not dissolve this. Liu et al. documented that performance degrades substantially when relevant information sits in the middle of a long input, with a characteristic U-shaped curve favouring the beginning and the end — reproduced across models with nominally large windows. Enlarging the window does not guarantee that the material inside it is used. In my own work that matched what I saw: pasting more of the corpus in did not reliably reduce contradictions, and it made every generation slower and more expensive.</p>

      <h2>The distinction this problem already has a name for</h2>

      <p>Narratology got here first, about a century ago. The <strong>fabula</strong> is the underlying chronological sequence of events; the <strong>syuzhet</strong> is the order in which the text presents them. Any narrative with flashbacks, parallel timelines or multiple points of view separates the two deliberately.</p>

      <p>The engineering restatement is simply this: <strong>the fabula is the state, and the syuzhet is the observation sequence.</strong> A reader reconstructs the first from the second automatically. A retrieval system does not, because nothing in a passage's embedding tells you where it sits on a timeline that is never written down.</p>

      <h2>Four operations usually collapsed into one</h2>

      <p>Most discussion of retrieval-augmented generation treats retrieval as a single step. In practice this pipeline needs four distinguishable operations, and conflating them is where systems fail.</p>

      <p><strong>1. Document retrieval.</strong> Finding passages that are lexically or semantically relevant. This is the well-studied part — dense retrieval works, and the original RAG formulation showed that conditioning generation on retrieved passages beats parametric memory alone on knowledge-intensive tasks.</p>

      <p><strong>2. Knowledge retrieval.</strong> Finding relevant <em>entities, relationships, events and facts</em> rather than passages. A character is not a paragraph. Entity-centric representations model exactly this: things and the relations between them, independent of the documents that mention them. Recent work combines the two explicitly — GraphRAG constructs an entity graph over a corpus precisely because passage-level retrieval fails on questions that require aggregating across a whole body of text.</p>

      <p><strong>3. State-aware generation.</strong> Assembling the slice of the world that is true <em>at this point in the story</em>, which requires chronology as a first-class dimension rather than metadata. This is the operation with the least direct literature behind it, and I treat my handling of it as an engineering choice rather than a validated method.</p>

      <p><strong>4. Validation.</strong> Checking the generated candidate against canonical sources and constraints <em>after</em> generation. A separate system, a different failure mode, and the step most often missing entirely.</p>

      <h2>Why retrieval alone is insufficient</h2>

      <p>Retrieval supplies evidence. It does not supply judgement. Four gaps remain after even a good retriever has done its work.</p>

      <p><strong>Relevance is not similarity.</strong> The passage that matters for a scene is often not the passage most similar to it. A scene about a betrayal may hinge on a throwaway line about a family debt from two books earlier. Semantic similarity does not surface that. An entity relation does.</p>

      <p><strong>Provenance has to survive the pipeline.</strong> If a generated claim cannot be traced back to the passage that licensed it, no meaningful audit is possible. Rashkin et al. formalised this as <em>Attributable to Identified Sources</em> — whether a statement is supported by a specific cited source rather than merely plausible. In a fictional canon the same machinery applies with one inversion: the ground truth is not the external world, it is a body of text I control.</p>

      <p><strong>Sources conflict.</strong> A published novel, an unpublished draft, a production script and an author note may disagree. The system needs an explicit precedence order. In my implementation published text outranks drafts, drafts outrank notes, and conflicts that rule cannot resolve are surfaced for a human rather than silently averaged.</p>

      <p><strong>Contradiction detection is its own task.</strong> Hallucination here is not factual error about the world — it is <em>inconsistency with a corpus</em>. That is closer to entailment checking than to fact verification. Decomposing generated output into atomic claims and verifying each against retrieved support, in the manner of FActScore, transfers to this setting almost unchanged.</p>

      <p>And the failure survives even when retrieval is taken off the table. The DeR² benchmark supplies models with a curated set of documents verified to be necessary and sufficient for each item, then measures what happens: with the evidence in hand, models still fail on the reasoning steps. That is the experimental shape this whole argument depends on — the distinction between <em>the system never found the evidence</em> and <em>the system had the evidence and still built the wrong world</em>.</p>

      <h2>The architecture</h2>

      <pre><code>CANON  (published novels, drafts, production material, author rulings)
  |
  +--&gt; structured knowledge  +  indexed corpus
  |      entities - relationships - events - chronology - world rules
  |
  +--&gt; retrieval for the current task
  |      relevant entities, relations, events, and the passages behind them
  |
  +--&gt; construction of generation context
  |      the state of the world at this point in the timeline, plus constraints
  |
  +--&gt; generation
  |
  +--&gt; validation
  |      consistency against canon - constraint satisfaction - provenance check
  |
  +--&gt; accepted  -----&gt; corpus expands, index updates
  +--&gt; rejected  -----&gt; corrected, or returned to the human
</code></pre>

      <p>Two properties of this loop matter more than any component in it.</p>

      <p><strong>The canon is the authority, not the model.</strong> The model proposes, the corpus disposes. When they disagree the corpus wins by construction, and the disagreement is logged rather than resolved by fluency.</p>

      <p><strong>The human is the final authority, not the validator.</strong> Automated consistency checking catches one class of error reliably and misses others entirely. Its output is a triage queue, not a verdict.</p>

      <p>Constrained decoding is a related but distinct lever — methods like NeuroLogic decoding enforce lexical constraints during generation rather than checking afterwards. My constraints are mostly semantic rather than lexical, so they are enforced through context construction and post-hoc validation rather than at the decoder. A pragmatic choice, not a claim that it is the better one.</p>

      <h2>The case study</h2>

      <p>The corpus is a fantasy saga: novels, a lore archive, character records, an invented language, a timeline, world rules, and production material for dramatized audio editions. Hundreds of thousands of words, still growing.</p>

      <p>Three observations from running this, offered as implementation experience rather than as findings.</p>

      <p><strong>The evaluation set is the expensive part.</strong> I maintain golden question-and-answer pairs drawn from the canon — questions with a single defensible answer that a human author verified. Every change to retrieval or prompting is scored against that set before it is trusted. Building it took longer than building the retriever.</p>

      <p><strong>Adaptation is a better validator than any test I wrote.</strong> Turning a novel into a dramatized audio production means going through it at the granularity of individual lines, casting and directing every character, and placing sound. That surfaces continuity errors no automated check found — because it forces a slow, total re-reading with different attention. In practice no book in this saga is published until its audio adaptation is finished, for exactly that reason.</p>

      <p><strong>The failures that matter are quiet.</strong> A model that refuses is harmless. A model that produces a fluent, well-written scene in which a character knows something they should not know is expensive, because it reads as correct.</p>

      <h2>Multimodal linkage, stated carefully</h2>

      <p>The same canonical entities increasingly connect to non-textual artifacts: a character record links to a voice identity, to recorded performances, to an avatar, to a game representation. This is a <strong>linked representation</strong> of a fictional universe — shared identifiers across media — and I would not call it a multimodal world model. Nothing in it learns cross-modal dynamics. It is a schema and a set of joins. Whether that becomes something more interesting is an open question, not a result.</p>

      <h2>Why this generalises</h2>

      <p>The pattern is not about fiction. It applies wherever a generative system must operate over a large, evolving body of information that is internally consistent by <em>stipulation</em> rather than by observation: technical documentation with versioned behaviour, legal corpora where precedence is explicit, research archives with provenance requirements, curriculum material that must not contradict earlier lessons, enterprise knowledge with authority hierarchies, game worlds and simulation environments.</p>

      <p>In every one of those the same four operations appear, and the same trap: treating retrieval as the whole solution and discovering later that nothing was validating the output.</p>

      <p>Fiction is a useful testbed precisely because it is unforgiving in an unusual way. There is no external reality to appeal to. If the corpus says a moon is red, the moon is red, and a beautifully written passage describing a silver moon is simply wrong. That makes contradiction unambiguous in a way factual domains rarely are.</p>

      <h2>What is claimed and what is not</h2>

      <p><strong>Claimed:</strong> that treating a canon as a persistent knowledge system, with retrieval, constraint construction and post-generation validation as separate stages, is a workable architecture, and that it rests on published work in retrieval-augmented generation, long-context limitations, entity-centric representation, attribution and consistency checking.</p>

      <p><strong>Not claimed:</strong> that this constitutes a world model, that it eliminates hallucination, that it is novel as an architecture, or that observations from my implementation are evidence for anything beyond my implementation.</p>

      <p>Worldbuilding is getting cheaper. What gets cheaper first is generating material. What stays hard — and what decides whether any of it is worth reading — is keeping a world <em>consistent</em> once it is larger than one person can hold in their head.</p>

      <h2>References</h2>

      <ul>
        <li>Lewis, P. et al. (2020). <em>Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.</em> NeurIPS. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener noreferrer">arXiv:2005.11401</a></li>
        <li>Karpukhin, V. et al. (2020). <em>Dense Passage Retrieval for Open-Domain Question Answering.</em> EMNLP. <a href="https://arxiv.org/abs/2004.04906" target="_blank" rel="noopener noreferrer">arXiv:2004.04906</a></li>
        <li>Guu, K. et al. (2020). <em>REALM: Retrieval-Augmented Language Model Pre-Training.</em> ICML. <a href="https://arxiv.org/abs/2002.08909" target="_blank" rel="noopener noreferrer">arXiv:2002.08909</a></li>
        <li>Liu, N. F. et al. (2023). <em>Lost in the Middle: How Language Models Use Long Contexts.</em> TACL. <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener noreferrer">arXiv:2307.03172</a></li>
        <li>Hogan, A. et al. (2021). <em>Knowledge Graphs.</em> ACM Computing Surveys. <a href="https://arxiv.org/abs/2003.02320" target="_blank" rel="noopener noreferrer">arXiv:2003.02320</a></li>
        <li>Edge, D. et al. (2024). <em>From Local to Global: A Graph RAG Approach to Query-Focused Summarization.</em> <a href="https://arxiv.org/abs/2404.16130" target="_blank" rel="noopener noreferrer">arXiv:2404.16130</a></li>
        <li>Rashkin, H. et al. (2023). <em>Measuring Attribution in Natural Language Generation Models.</em> Computational Linguistics. <a href="https://arxiv.org/abs/2112.12870" target="_blank" rel="noopener noreferrer">arXiv:2112.12870</a></li>
        <li>Ji, Z. et al. (2023). <em>Survey of Hallucination in Natural Language Generation.</em> ACM Computing Surveys. <a href="https://arxiv.org/abs/2202.03629" target="_blank" rel="noopener noreferrer">arXiv:2202.03629</a></li>
        <li>Min, S. et al. (2023). <em>FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation.</em> EMNLP. <a href="https://arxiv.org/abs/2305.14251" target="_blank" rel="noopener noreferrer">arXiv:2305.14251</a></li>
        <li>Lu, X. et al. (2021). <em>NeuroLogic Decoding: (Un)supervised Neural Text Generation with Predicate Logic Constraints.</em> NAACL. <a href="https://arxiv.org/abs/2010.12884" target="_blank" rel="noopener noreferrer">arXiv:2010.12884</a></li>
        <li>Ying, S. et al. (2026). <em>Retrieval-Infused Reasoning Sandbox: A Benchmark for Decoupling Retrieval and Reasoning Capabilities.</em> <a href="https://arxiv.org/abs/2601.21937" target="_blank" rel="noopener noreferrer">arXiv:2601.21937</a></li>
      </ul>

      <p><em>Related: <a href="/ai-authorship/">on AI-assisted authorship</a>, and <a href="/eos-collision/">the silent objective failure</a> that started the habit of validating rather than trusting.</em></p>
    </article>
  );
};
