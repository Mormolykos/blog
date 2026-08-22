import React from 'react';

export const CompiledChronologyArticle: React.FC = () => {
  return (
    <article>
      <h1>The Size Where a Model Stops Saying "I Don't Know"</h1>
      <p><em>Five local models, one fact their source text does not contain. Scaling recovered none of it. Compiling the fact worked — above a threshold, with a regression in the middle where the model stopped abstaining and started agreeing.</em></p>
      <hr />

      <p>In <a href="/canon-state/">The Canon Is the Database</a> I argued that a fictional universe should be treated as a persistent, machine-readable state rather than a pile of documents, and that generation should be validated against it. That was a thesis. This is the measurement, including the four places where my own measuring apparatus was wrong.</p>

      <h2>The question</h2>

      <p>A saga narrated out of order contains events whose relative timing no sentence ever states. Book 1 places a voice in a cave chamber. Book 5 places a prisoner in a cell beneath a keep. They share no character, no place, no causal link, and <strong>no passage in the corpus mentions both</strong>. A reader who has been told the chronology knows which came first. A reader with only the text does not, and neither does a retriever — semantic similarity has nothing to grip.</p>

      <p>So: does compiling those relations into explicit state change what a model can do with the same corpus, and if so, how much model do you need before it helps?</p>

      <h2>Setup</h2>

      <p>A 260,204-word corpus, frozen as a hashed snapshot, every passage carrying character offsets that re-slice out of the source byte for byte. Questions generated automatically from pairs of events narrated in different documents, in the form <em>"When X happened, had Y already happened?"</em></p>

      <p>Three conditions, pre-registered before anything ran. <strong>Passages only</strong> — the passages the state's own evidence spans point at, handed over directly, so retrieval failure is separated from reasoning failure. <strong>Retrieved</strong> — top-k from a retriever. <strong>Compiled state</strong> — the same evidence plus a short block giving each event's position on a story-order scale.</p>

      <p>Five model sizes from one family: Qwen3 at 0.6B, 1.7B, 4B, 8B and 14B, all local, all through the same harness with the same system prompt.</p>

      <h2>Scaling recovers nothing</h2>

      <p>Given the source passages, correct <em>negative</em> answers — the subset where guessing cannot help, because saying "yes" to everything scores zero on them:</p>

      <pre><code>0.6B  0/12    1.7B  0/12    4B  0/12    8B  0/12    14B  0/12</code></pre>

      <p>Twenty-three times the parameters buys nothing. That is not a surprise once stated plainly — the relation is not in the input, so there is nothing to get better at — but it is worth measuring rather than assuming, and the models mostly said so themselves. Handed the passages, they returned <em>NOT ESTABLISHED</em> and named what was missing, 32 and 31 times out of 34 at the two larger sizes. <strong>The baseline's own refusals are the cleanest available evidence that the fact is genuinely absent rather than merely hard to extract.</strong></p>

      <h2>With the compiled chronology</h2>

      <pre><code>0.6B   0/12   |
1.7B   3/12   ###
4B     0/12   |            &lt;- regression
8B    12/12   ############
14B   10/12   ##########</code></pre>

      <p>The curve is real and it is <strong>not monotonic</strong>. I predicted, in writing, that it would rise and saturate. It does neither cleanly.</p>

      <h2>The 4B is the one to worry about</h2>

      <p>At 4B both conditions return identical numbers: 12 of 34 overall, 12 of 12 on questions whose answer is "yes", <strong>0 of 12 on questions whose answer is "no", and zero refusals</strong>. It answers "yes" to all thirty-four regardless of what you hand it. Supplying the compiled chronology changes nothing at all.</p>

      <p>Its neighbours refuse 32 and 31 times out of 34 without the state. The 4B refuses nothing.</p>

      <p><strong>There is a size band in which a model loses the ability to abstain before it gains the ability to use structure.</strong> A 1.7B tells you it does not know. A 4B tells you "yes". If you are running a small local model over compiled context, that is the failure you will not see in an accuracy number, because on a key with a majority class it looks like competence.</p>

      <p>Whether this belongs to the 4B checkpoint or to the size band is not established by one family and one task. I record it as an observation and do not explain it.</p>

      <h2>Then I corrupted the state, and learned less than I hoped</h2>

      <p>An obvious worry about all of the above: maybe the models were not using the supplied positions at all. Maybe they were guessing from book numbers, or from having read the published novels during training, or from a bare preference for answering "yes".</p>

      <p>So I permuted the story positions so the implied ordering was reversed, and changed nothing else. Both larger models followed the false ordering — <strong>18 of 24 and 17 of 24</strong>. Their answers tracked the numbers I gave them, wherever those numbers pointed.</p>

      <p>That is a <em>mechanism check</em>, and it does its job: it rules out narration order, memorisation and a yes-prior as the source of the correct answers. The models are computing from the supplied integers.</p>

      <p><strong>It is not evidence that models blindly trust external state, and I initially wrote it up as though it were.</strong> The reason it cannot be is the premise of the whole experiment: no passage states the relation. So a permuted chronology contradicts nothing the model could read. The corrupted state was undetectable by construction — the models had no signal to catch it with, and the permuted block is internally consistent besides. There was no conflict to miss.</p>

      <p>The honest bound is narrower than the one I wanted:</p>

      <blockquote>
        <p>The compiled chronology supplies a fact the corpus does not contain, and the model transcribes it. Nothing here demonstrates temporal reasoning, and nothing here demonstrates whether a model would notice if the state were wrong in a way it could actually check.</p>
      </blockquote>

      <p>That second question is the one worth answering, and it needs a different question set — event pairs whose ordering the passages <em>do</em> establish, so that a corrupted state genuinely contradicts readable evidence. Every memory and state framework I have read assumes the compiled state is correct. I have not found one that reports what happens when it is not, and after today I am not in a position to be smug about that.</p>

      <h2>Four ways my own measurement was wrong</h2>

      <p>This is the part that decides whether any of the above is worth reading, so it goes in the body rather than a footnote.</p>

      <p><strong>1. The answer key had no negative class.</strong> The question generator deduplicated candidate event pairs on an <em>unordered</em> key while reading events in story order, so every pair was first reached with the earlier event as the subject — always the "yes" branch. The <code>"No. It had not happened yet."</code> branch was present in the source and structurally unreachable. The original key was 14 yes, 5 simultaneous, <strong>0 no</strong>. A model answering "yes" unconditionally scored 73.7% on it. I would have published that.</p>

      <p><strong>2. The scorer credited refusals as correct.</strong> It searched the whole answer for <code>had already</code> — which appears inside <em>"it is not possible to determine whether this event had already occurred"</em>. Ten refusals scored as correct answers. All ten were in baseline conditions; none in a state condition.</p>

      <p><strong>3. The scorer required a comma.</strong> Its negative pattern matched the literal <code>"no,"</code>. An answer opening <em>"No. The voice speaks at position 3600, before the whisper crosses the table"</em> matched nothing and was marked wrong. Eight of those, all in the state condition.</p>

      <p><strong>4. Refusals were logged as wrong orderings.</strong> The failure taxonomy recorded every <em>NOT ESTABLISHED</em> as <code>wrong_order_across_books</code>. The model never gave an order.</p>

      <p>All four are the same missing thing: <strong>no representation for "declined"</strong>. A refusal has to become either a right answer or a wrong one, and it is misfiled in both directions. I have written about this before in the context of <a href="/trainproof/">a linter that cannot tell "your run failed" from "I could not read your log"</a>. It turns out I had built the same bug into the evaluator I was using to judge my own hypothesis.</p>

      <p>Every one of the four corrections moved the numbers <em>against</em> the hypothesis I wanted to hold. It held anyway. That is the only reason I am willing to write any of this down.</p>

      <h2>What I got wrong on purpose, and on record</h2>

      <p>Each phase was pre-registered with a prediction before it ran, so the misses are checkable rather than remembered.</p>

      <table>
        <thead>
          <tr><th>Predicted</th><th>Outcome</th></tr>
        </thead>
        <tbody>
          <tr><td>Prose carrying the same two positions performs about as well as the structured block</td><td><strong>Half wrong.</strong> True at 14B. At 8B, prose gives 1 of 12 on negatives against 12 of 12 for the structured block — same integers, same information</td></tr>
          <tr><td>Sorting the facts is what the structured block adds</td><td><strong>Wrong.</strong> Ordering the prose sentences changed one item out of 34. Something else in the presentation carries the effect, and I have not isolated which of four remaining differences it is</td></tr>
          <tr><td>The state curve rises with size and saturates</td><td><strong>Half wrong.</strong> It saturates at 8B, but the 4B regresses to zero</td></tr>
          <tr><td>Passages-only stays at the floor at every size</td><td><strong>Confirmed</strong>, 0 of 12 across all five</td></tr>
          <tr><td>Simultaneity fails everywhere</td><td><strong>Confirmed.</strong> 0 of 10 in every cell of every phase — the most robust negative result here</td></tr>
        </tbody>
      </table>

      <h2>Limits</h2>

      <p>One corpus, one author, one snapshot. n = 34 after deduplication, which caps every accuracy claim and is the binding constraint on all of it. One model family, one quantisation tier — a threshold found in Qwen3 is a fact about Qwen3 until shown elsewhere. The story positions were assigned by a human from author testimony, so this is a claim about what an explicit chronology <em>enables</em>, never about extracting one automatically.</p>

      <p>And the scramble result means this is not a temporal reasoning benchmark. It measures the capacity required to transcribe a supplied relation correctly, which is a smaller and more honest thing.</p>

      <p>If you run a state or memory layer in front of a small model, the question I would most like answered by someone other than me: <strong>what does your system do when the compiled state is wrong?</strong> Mine believed it.</p>
    </article>
  );
};
