import React from 'react';

export const RetrievalCoverageArticle: React.FC = () => {
  return (
    <article>
      <h1>My Agent Answers From 0.6% of Its Corpus and Reports It Like a Full Read</h1>
      <p><em>Retrieval is not the evidence. It is a measurement instrument, and nobody reports its coverage.</em></p>
      <hr />

      <p>
        My portfolio agent held 1,003 indexed chunks when I measured this on 25 August 2026.
        When someone asks it a question it retrieves six of them and answers.
      </p>

      <p>
        The corpus has grown since, which is the ordinary fate of a corpus and the reason the
        date is here rather than a bare number. Nothing in the argument moves with it: the
        denominator being larger only widens the gap the piece is about.
      </p>

      <p>
        <strong>Six of 1,003 is 0.598%.</strong> The answer that comes back carries no trace of
        that. It reads exactly the same as an answer built from reading all 1,003 — same tone,
        same citations, same confidence. Nothing in the response, the logs, or the trace says
        that 997 chunks were never looked at.
      </p>

      <p>
        That is fine when the question is <em>what does he say about X</em>. It is a lie when
        the question is <em>does he mention X anywhere</em>, and there is nothing in a normal
        RAG stack that can tell those two apart.
      </p>

      <h2>The claim retrieval cannot support</h2>

      <p>
        Take a compliance corpus: 2,431 policy documents, and someone asks whether there is a
        remote-work reimbursement policy. Retrieval returns eight chunks. None mentions
        reimbursement. The agent answers:
      </p>

      <blockquote>
        <p>There is no remote-work reimbursement policy in the corpus.</p>
      </blockquote>

      <p>
        That claim requires knowledge of 2,431 documents. It was made from eight. The agent did
        not lie and it did not hallucinate — it correctly reported what it found, and the
        <em> shape</em> of the sentence quietly upgraded a statement about eight documents into
        a statement about the corpus.
      </p>

      <p>
        <strong>Absence of evidence in a retrieved fragment is not evidence of absence in the
        whole.</strong> Everyone knows this. No retrieval stack I have used records enough to
        enforce it, because the number that would enforce it — the denominator — is not carried
        anywhere near the answer.
      </p>

      <h2>Where the number should have been</h2>

      <p>
        This is the same mistake I made in a validator two months ago, one level up. A training
        run on pure noise returned <code>PASS</code>, with a list of the checks that had cleared
        it. The checks had not run: every one had hit a divide-by-zero guard and skipped
        silently, and the tool had no way to say <em>I could not judge this</em>, so the absence
        of a judgement rendered as a favourable one.
      </p>

      <p>
        Retrieval has the identical hole. An answer built from 0.598% of a corpus and an answer
        built from all of it are the same object. The coverage is not <em>wrong</em> in the
        report — it is <em>absent</em> from the report, and an absent value gets read as a good
        one.
      </p>

      <h2>Three failures wearing one label</h2>

      <p>
        The second thing the missing denominator costs you is diagnosis. When a RAG answer is
        wrong, the post-mortem usually terminates at <em>the model hallucinated</em>. That
        sentence is hiding at least three separate engineering problems:
      </p>

      <table>
        <thead>
          <tr><th>What actually happened</th><th>What to fix</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>The relevant chunk was never retrieved</td>
            <td>The retriever, the embedding, or the query — <em>not</em> the model</td>
          </tr>
          <tr>
            <td>It was retrieved, then dropped during context assembly</td>
            <td>Context construction — the model never saw it</td>
          </tr>
          <tr>
            <td>It reached the model, which reasoned past it</td>
            <td>The prompt or the model — the only case that is a reasoning failure</td>
          </tr>
        </tbody>
      </table>

      <p>
        These need three different people on three different days. They produce one identical
        symptom. And the distinction is trivially recordable — <code>retrieved</code>,{' '}
        <code>in_context</code>, and whether the answer was right — but almost nobody logs the
        middle number, so the first two cases are permanently indistinguishable after the fact.
      </p>

      <h2>What I built</h2>

      <p>
        An MCP server for{' '}
        <a href="https://github.com/Mormolykos/notchecked">notchecked</a>, the coverage-accounting
        schema I wrote after hitting the silent-skip failure four times in four domains. The
        library types the gaps a <em>program</em> leaves. The server does it for an agent, which
        is where the failure moved.
      </p>

      <p>
        The tool that matters is <code>coverage_retrieval</code>. It takes the corpus size, the
        number of units retrieved, and the number that survived context assembly, and it records
        what the agent actually had when it answered:
      </p>

      <pre><code>{`coverage_retrieval(
  target      = "portfolio corpus",
  query       = "Rust experience",
  corpus_size = 1003,
  retrieved   = 6,
  in_context  = 6,
)

→ scope:      6 of 1003 corpus units (0.598%)
  exhaustive: false

  ABSENCE_WARNING: You inspected 6 of 1003 corpus units (0.598%).
  This supports statements about what you FOUND. It CANNOT support
  "there is no X in the corpus" — that requires exhaustive coverage,
  and 997 units were never looked at.`}</code></pre>

      <p>
        <code>retrieved = 0</code> is not a thin answer, it is a retrieval failure, and it
        records as one. Everything retrieved and then dropped is a context failure, and it
        records as that instead. Neither is a gap in the agent's reasoning, and calling them one
        sends someone to debug a prompt for a day.
      </p>

      <h2>"But our faithfulness score is 1.0"</h2>

      <p>
        This is the first objection, and it deserves a straight answer: <strong>faithfulness
        cannot catch this, by construction.</strong>
      </p>

      <p>
        Faithfulness asks whether the answer is supported by the retrieved context — did the
        model invent anything beyond what it was given. The compliance answer above invents
        nothing. It reports, accurately, that eight retrieved chunks contain no reimbursement
        policy. <strong>It scores a perfect faithfulness and may be false about 2,423
        documents.</strong>
      </p>

      <p>
        Faithfulness scores <em>answer against context</em>. Coverage scores <em>context against
        corpus</em>. They are different axes, and a system can be perfect on the first while
        completely silent on the second.
      </p>

      <table>
        <thead>
          <tr><th>Metric</th><th>What it needs</th><th>Available at answer time?</th></tr>
        </thead>
        <tbody>
          <tr><td>Faithfulness</td><td>answer + context</td><td>Yes</td></tr>
          <tr><td>Context precision</td><td>answer + context</td><td>Yes</td></tr>
          <tr><td>Context <em>recall</em></td><td>ground-truth annotations</td><td><strong>No</strong> — offline evaluation only</td></tr>
          <tr><td><strong>Corpus coverage</strong></td><td>corpus size + retrieved count</td><td><strong>Yes — and it is not reported</strong></td></tr>
        </tbody>
      </table>

      <p>
        Context recall is the metric that would catch it, and it needs labelled ground truth, so
        it lives in your evaluation harness and not in production. Corpus coverage needs two
        integers you already have.
      </p>

      <h2>The control is the shape of the sentence, not a percentage</h2>

      <p>
        This is the part that took longest to see, and it is why there is no threshold anywhere
        in the implementation.
      </p>

      <p>
        <strong>0.598% is not a bad number. It is a bad number for one class of sentence.</strong>
        It is entirely adequate for <em>"he mentions Rust"</em> — you need the one chunk you are
        quoting and nothing else. It cannot support <em>"he never mentions Rust."</em> Same
        retrieval, same six chunks, opposite verdicts, because the claim changed.
      </p>

      <p>
        A single coverage threshold cannot serve both. Set it low and it licenses the second
        sentence; set it high and it forbids the first. So the required coverage is decided by
        what kind of claim is being made:
      </p>

      <table>
        <thead>
          <tr><th>Claim</th><th>Coverage required</th></tr>
        </thead>
        <tbody>
          <tr><td><em>"The policy says X"</em></td><td>Any — you need only the units you cite</td></tr>
          <tr><td><em>"There is no policy about X"</em></td><td><strong>Exhaustive</strong></td></tr>
          <tr><td><em>"All policies require X"</em></td><td><strong>Exhaustive</strong></td></tr>
          <tr><td><em>"The most recent policy is…"</em></td><td><strong>Exhaustive</strong> — the unread remainder may hold the true maximum</td></tr>
          <tr><td><em>"There are three mentions"</em></td><td><strong>Exhaustive</strong> — a count over a sample is an estimate</td></tr>
        </tbody>
      </table>

      <p>
        Every row that needs exhaustive coverage has the same reason: it asserts something about
        the units that were <em>not</em> read.
      </p>

      <h2>What this does not do, and will not claim to</h2>

      <p>
        If your retriever reports <code>corpus_size=100000, retrieved=20, in_context=12,
        cited=3</code>, this records those numbers and what they can support. <strong>It does not
        know whether the retriever chose the right twenty.</strong> It is not a retriever, a
        vector database, a reranker or a context assembler, and it is not competing with the one
        you have.
      </p>

      <p>
        It sits above that infrastructure and records what the system observed. If your stack can
        provide stronger provenance, it consumes that. If it cannot, the limitation stays visible
        instead of quietly becoming full coverage. That is the entire offer, and it is
        deliberately smaller than "we validate your RAG."
      </p>

      <h2>No threshold, at any size</h2>

      <p>
        999,999 units of 1,000,000 is 99.9999% coverage and still cannot establish absence. The
        one document you did not read is the one the question was about, or it is not, and a
        percentage cannot tell you which.
      </p>

      <p>
        A threshold here would be a lie with a decimal point on it, so there isn't one:{' '}
        <code>exhaustive</code> is true when the count reaches the corpus and false at every
        other value. That is the whole rule.
      </p>

      <h2>The bug this found in its own implementation</h2>

      <p>
        I wrote a suite that replays six investigations of my own that produced wrong claims —
        a page judged from 3,000 of its 10,828 words, a search that had stripped the HTML so
        anything named only in an <code>href</code> was invisible, three different counts from
        three broken filesystem walks.
      </p>

      <p>
        On its first run it failed, and it failed on my code rather than on the cases.{' '}
        <code>exhaustive</code> was a bare assertion: an agent could pass{' '}
        <code>exhaustive: true</code> alongside <code>scope: "3,000 of 10,828 words"</code>, and
        the absence warning was dropped. <strong>The tool committed the exact failure it exists
        to prevent, one layer above the schema it protects.</strong> Where the scope carries
        "N of M", the contradiction is machine-visible and is now refused.
      </p>

      <p>
        That is the third time this idea has caught its own implementation. I have stopped
        finding it funny and started treating it as the strongest evidence that the shape is
        real.
      </p>

      <h2>What this does not do</h2>

      <p>
        It cannot force honesty. An agent can decline to call the tools, describe its method
        inaccurately, or report a corpus size it invented. Three limits are recorded as{' '}
        <em>passing tests</em> rather than left out of the README:
      </p>

      <ul>
        <li>An exhaustive search of the <strong>wrong instrument</strong> is still exhaustive. Nothing here knows that a substring search is not a robots-tag check.</li>
        <li>The target list is <strong>self-declared</strong>. No protocol can know what the caller failed to think of.</li>
        <li>The retrieval counts are <strong>self-reported</strong>. Only internal consistency is enforced — <code>in_context</code> may not exceed <code>retrieved</code>.</li>
      </ul>

      <p>
        What it removes is the <em>silence</em>. The gap stops being invisible to whoever reads
        the answer. That is a smaller claim than "this makes agents honest," and it is the one
        the evidence supports.
      </p>

      <p>
        I also want to be precise about scope, since that is the entire subject: I have measured
        this in <strong>one</strong> live system, my own. I have not established what other RAG
        deployments report, and I am not going to claim it from a sample of one.
      </p>

      <hr />

      <p>
        <code>pip install notchecked</code> ·{' '}
        <a href="https://github.com/Mormolykos/notchecked">github.com/Mormolykos/notchecked</a> —
        MIT, zero runtime dependencies, 112 tests, MCP over stdio written from the JSON-RPC wire
        format.
      </p>

      <p>
        The eight coverage states were reviewed publicly by{' '}
        <strong>Boris Teplitsky</strong>, an IBM Certified Expert IT Architect who hit the same
        shape in infrastructure compliance and gave three corrections that changed the schema.
        They are frozen. Two later proposals to add states were rejected on his ground: a context
        truncation is a checker that could not observe, not a ninth kind of gap.
      </p>

      <p>
        <em>
          If you run RAG in production and you <strong>do</strong> record retrieval coverage
          alongside answers, I would genuinely like to know — that would make this a solved
          problem I had not found the solution to, which is a better outcome than being right.
        </em>
      </p>
    </article>
  );
};
