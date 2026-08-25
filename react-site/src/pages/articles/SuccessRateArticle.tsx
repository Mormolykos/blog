import React from 'react';

export const SuccessRateArticle: React.FC = () => {
  return (
    <article>
      <h1>A Hundred Per Cent Success Rate and One Usable Answer</h1>
      <p><em>I took the backpressure out of my own model gateway to see what would break. Thirty-two callers, thirty-two HTTP 200s, and thirty-one of them arrived after the caller had already given up. Nothing in the logs said anything was wrong.</em></p>
      <hr />

      <p>I built a gateway that sits in front of several inference backends — authentication, per-key spend quota, token metering, retries, failover, streaming. The ordinary shape. Then, before trusting any of it, I broke it twice on purpose and measured what the broken version reported about itself.</p>

      <p>Both breakages produced clean logs. That is the part worth writing down.</p>

      <h2>The first fault: a gateway that cannot say no</h2>

      <p>I removed admission control — no bound on how many requests may be in flight at once — and sent thirty-two callers at the gateway simultaneously. Each caller was willing to wait <strong>700 milliseconds</strong> and would walk away after that.</p>

      <p>Every single request returned <strong>HTTP 200</strong>. Thirty-two successes out of thirty-two. A dashboard reading that gateway would show a flawless service.</p>

      <p><strong>Thirty-one of those answers arrived after the caller had stopped waiting.</strong> One was usable.</p>

      <p>The queue had not disappeared when I removed the bound. It had moved. Off the gateway, where I could see it and refuse it, and into the backend, where it was invisible and where everybody's clock was already running. The gateway kept faithfully reporting the outcome of work that no longer had an audience.</p>

      <p>With a bound and a fast <code>429</code> instead: eight answered, twenty-four refused within milliseconds, and <strong>six usable answers instead of one</strong>.</p>

      <table>
        <thead>
          <tr><th></th><th>Unbounded</th><th>Bounded</th></tr>
        </thead>
        <tbody>
          <tr><td>HTTP 200 returned</td><td>32</td><td>8</td></tr>
          <tr><td>Success rate</td><td>100%</td><td>25%</td></tr>
          <tr><td><strong>Answers that arrived in time</strong></td><td><strong>1</strong></td><td><strong>6</strong></td></tr>
        </tbody>
      </table>

      <p>Six times the useful output, while the headline metric fell by seventy-five points. If you are optimising the success rate, you will optimise your way back into the first column.</p>

      <h2>Where the bound came from</h2>

      <p>I did not pick eight because it felt right. I measured the backend until it stopped getting faster:</p>

      <table>
        <thead>
          <tr><th>Concurrent requests</th><th>Throughput</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>189 tokens/sec</td></tr>
          <tr><td>8</td><td>433 tokens/sec</td></tr>
          <tr><td>32</td><td>474 tokens/sec — 9% more, for 3.3× the latency</td></tr>
        </tbody>
      </table>

      <p>The knee is at eight. Past it you are not buying throughput, you are buying queue. So the admission limit is eight, and it is a measurement rather than a preference — which also means it has an expiry date: change the model or the hardware and the number has to be taken again.</p>

      <h2>The second fault: failover that works in the log and fails for the caller</h2>

      <p>Everybody writes failover for a backend that dies. Dying is easy — the connection refuses, you try the next one. So I made a backend go <em>slow</em> instead: three seconds to respond, against a caller willing to wait one and a half.</p>

      <p>The gateway logged <strong>eight successes</strong>. Every one of them landed at three seconds, after the caller was gone. <strong>The healthy backend was never called once.</strong></p>

      <p>The cause was that my retry budget was a count of attempts plus a per-backend timeout. Neither of those knows whether anybody is still waiting. A retry policy expressed in attempts is a policy about the server's patience, and the server is not the one who is waiting.</p>

      <p>So the deadline now belongs to the request, and travels with it. While another backend is still available, the current one may spend at most sixty per cent of whatever time remains. You have to <em>reserve</em> time for the thing you are failing over to, or the failover is decoration that runs after the deadline it was supposed to protect.</p>

      <table>
        <thead>
          <tr><th></th><th>Attempt-counted</th><th>Deadline-owned</th></tr>
        </thead>
        <tbody>
          <tr><td>Logged successes</td><td>8</td><td>8</td></tr>
          <tr><td><strong>Arrived in time</strong></td><td><strong>0</strong></td><td><strong>8</strong></td></tr>
          <tr><td>p50 latency</td><td>3001 ms</td><td>1046 ms</td></tr>
        </tbody>
      </table>

      <p>Note the first row. The log is identical in both columns. Every observability surface I had said the failover was working, for as long as I only asked it whether requests succeeded.</p>

      <h2>Three things I did not plan</h2>

      <p>The two faults above were deliberate. These three found me.</p>

      <p><strong>The first working call billed thirty-two tokens and returned an empty string.</strong> The local model is a reasoning model, and the server returns its reasoning in a different field from its answer. Read only the answer field and you show the user nothing while charging them for a full generation. Nothing errors, and the token accounting is correct — that is what makes it nasty. Reasoning is surfaced separately now, and a header is set when tokens were spent and the caller can see no answer.</p>

      <p><strong>A concurrency bug that hid inside a green test suite.</strong> I created the lock that bounds concurrency in the constructor. Python binds those to whichever event loop touches them first, so a second loop makes it throw — on admission, before any model is called, while the health endpoint still says <code>ok</code>. It surfaced as a <em>warning</em> on a worker thread and the suite reported <strong>79 passed</strong>. Then my fix had the same bug in a new costume: I keyed it by the loop's memory address, and Python reuses the address of a closed loop. Both are fixed, and the suite now turns a swallowed background exception into a failure — because a test suite that can pass while something throws is measuring the wrong thing.</p>

      <p><strong>I guessed the wrong hotspot and the trace corrected me.</strong> I was certain the overhead was the quota check — three database reads on every single request, right there in the hot path. It was <strong>0.146 ms</strong>, about four per cent. Three quarters of the overhead was writing one metering row, because the database was flushing to disk before answering. One setting: <strong>2.999 ms down to 0.230 ms</strong>, and the gateway's total overhead from 3.47 ms to 0.60 ms.</p>

      <h2>The number I refused to publish</h2>

      <p>Measured end to end, through the whole stack, the gateway added <strong>+1.26 ms against a noise floor of ±5.38 ms</strong>.</p>

      <p>That is not a measurement. It is a number smaller than the uncertainty around it, and quoting it would be quoting noise with a decimal point on it. The benchmark now says so out loud instead of printing the figure.</p>

      <p>It is also the entire argument for instrumenting inside the system. You cannot find a one-millisecond effect by subtracting two noisy end-to-end numbers. You find it with a span around the thing you suspect — which is how the metering flush turned up, and how I learned my confident guess about the quota check was wrong.</p>

      <h2>The one I was asked to build and didn't</h2>

      <p>The brief said to put vLLM on this machine. I looked at the machine first.</p>

      <p>vLLM has no Windows build, so reaching it means a WSL2 install of roughly ten gigabytes of CUDA — on a box where system RAM, not VRAM, is the bottleneck. And the GPU is not idle: it is shared with a text-to-speech service that sits behind a live API taking real traffic, holding 7.4 of its 16 GB. vLLM's default configuration reserves ninety per cent of the card. The good outcome is that it refuses to start. The bad outcome is that I take down something that earns money, to demonstrate a tool.</p>

      <p>So I said so, in an architecture decision record, along with what the decision costs: <strong>continuous batching is what vLLM is actually for, and I did not measure it.</strong> Measuring something else and calling it vLLM would be a lie with benchmarks attached.</p>

      <p>What I built instead is the layer above the engine, and that is the part that transfers. Routing, quota, metering, admission, deadlines and failover know nothing about which engine is underneath. The proof is structural rather than rhetorical: the two backends in it speak completely different protocols and each one is a single file.</p>

      <h2>What I actually take from this</h2>

      <p><strong>Success rate is the metric that hides an outage.</strong> Both faults produced a clean log. One produced a perfect log. The number I care about now is how many answers arrived while somebody was still there to read them, and every dashboard I build gets that number next to the success rate, not instead of it.</p>

      <p>The second thing is smaller and I keep relearning it: a fault that returns an error is a fault you will fix this afternoon. A fault that returns a plausible success is one you ship. Both of the faults here were of the second kind, and I only found them because I planted them and then went looking for the specific evidence that they had happened — not because anything alerted.</p>

      <p>Ninety-four tests, seven seconds, no model, no GPU, no API key and no network. Zero API calls were spent on any of it, and the live service on that GPU was verified healthy after every run.</p>

      <p>Source: <a href="https://github.com/Mormolykos/basalt">github.com/Mormolykos/basalt</a>.</p>

      <p>If you have a load-shedding or failover story where the log looked fine, I would like to hear it — particularly the ones where the metric that lied was one you had deliberately chosen.</p>
    </article>
  );
};
