import React from 'react';

export const ObservationTimeArticle: React.FC = () => {
  return (
    <article>
      <h1>Aether: Real-Time Tracking and Collision Screening in Rust</h1>
      <p><em>A two-thousand-line component that turns a live, unreliable sensor feed into a collision picture in under a millisecond per cycle — built to be embedded inside a larger system. This article explains what it is, what a system like it is used for, why the problem is hard, and one measured investigation from building it: a fault that caused 16.1% of valid observations to be rejected, cut to 1.9% by an architectural change.</em></p>
      <hr />

      <h2>What Aether is</h2>

      <p>Aether is a small, self-contained piece of software — around two thousand lines of Rust — that does one job. It takes a live stream of position reports about moving objects and turns it into a trustworthy picture: where everything is, where it is heading, and which pairs are on course to come dangerously close to one another.</p>

      <p>It runs continuously, updates many times a second, and is built as a <strong>component rather than an application</strong>. Its collision-screening core is exposed over a plain C interface, so an existing C or C++ system can call it directly without knowing that Rust is involved at all.</p>

      <p>The demonstration it ships with tracks aircraft. Every airliner broadcasts its own identity, position and altitude over radio roughly once a second — a public signal called ADS-B, which anyone with a receiver can hear. Aether listens to about 150 aircraft over Greece at a time, maintains an independent estimate of each one, and checks all of them against each other for closest approach, raising a warning for any pair that would breach the separation minimum air traffic control enforces. A full cycle — read the feed, update every track, screen every pair, redraw — completes in under a millisecond.</p>

      <h2>What a component like this is used for</h2>

      <p>Aircraft are the demonstration, not the boundary. What Aether actually implements belongs to a general class of system: <strong>take position reports from a sensor you do not own and cannot fix, and produce a state estimate reliable enough to base a safety decision on, within a fixed time budget.</strong></p>

      <p>Software of that shape lives inside:</p>

      <ul>
        <li><strong>Uncrewed aircraft</strong> — detect-and-avoid. A drone has to see the traffic around it and not fly into any of it, using exactly this kind of tracking and closest-approach logic.</li>
        <li><strong>Air traffic management and airspace deconfliction</strong> — the demonstration case, at operational scale.</li>
        <li><strong>Satellite operations</strong> — conjunction assessment. The same closest-approach mathematics, over orbital rather than aviation timescales.</li>
        <li><strong>Maritime collision avoidance</strong> — AIS in place of ADS-B, hours in place of minutes, structurally identical.</li>
        <li><strong>Ground vehicles and robotics</strong> — sensor fusion, where several imperfect sensors have to be reconciled into one world model.</li>
      </ul>

      <p>The sensor changes; the core does not. Position reports arrive, they are noisy, they are late, they contradict each other, and something has to decide what is true. Aether is deliberately arranged so the ingestion layer is the thin, replaceable part — supporting a different feed means writing an adapter, not rewriting the estimator.</p>

      <p><strong>It watches; it does not act.</strong> There is no targeting, engagement, weapon or fire-control functionality in it of any kind, deliberately and by design.</p>

      <h2>Why this is harder than plotting dots on a map</h2>

      <p>Three properties of real sensor data turn this from a drawing exercise into an engineering problem.</p>

      <p><strong>Individual reports cannot be trusted.</strong> Positions jitter, fields go missing, altitude sometimes arrives as the word "ground" instead of a number, objects vanish and reappear. The system has to hold a confident estimate of the truth built out of measurements that are each, on their own, unreliable.</p>

      <p><strong>Reports do not arrive when they happened.</strong> They queue upstream, they get re-served, they turn up out of order. A report that says "here I am" may be describing several seconds ago. Most of this article is about exactly that, because it is the property that quietly destroys systems which otherwise look perfect.</p>

      <p><strong>It has to keep up, indefinitely.</strong> A fixed-rate loop with no unbounded memory growth, no way for one slow network read to stall the picture, and no way for a malformed or oversized upstream response to take the process down. Those are the properties that decide whether a component is embeddable or merely a demo.</p>

      <h2>Why it exists, and what it is not yet</h2>

      <p>Aether exists to be a complete, measured reference implementation of that component: small enough to read in an afternoon, and honest enough that every number published about it can be reproduced by running the code. There are 55 tests. The performance figures come from timing the real loop, not from an estimate. The results below come from a controlled A/B against a live feed, not from a simulation tuned to make the point.</p>

      <p>It is an early version and is not presented as finished. The ingestion adapter is the obvious extension point — AIS, radar tracks, GNSS telemetry, an onboard sensor bus. The estimator has clear room to grow: a manoeuvre model for targets that turn, and recovery of measurements that arrive too late to use rather than discarding them. Those are named in the repository's future-work section rather than implied here.</p>

      <p>The rest of this article is one investigation from building it. It is worth reading because it is a failure mode that survives a green test suite, a clean code review, and a picture that looks entirely correct — in this system and in a great many others.</p>

      <hr />

      <h2>The measured problem</h2>

      <p>In technical terms: Aether polls a public ADS-B feed, keeps a Kalman-filtered track per aircraft, and screens every pair for closest point of approach against ICAO separation minima.</p>

      <p>It ran clean. Tests passed, the picture looked right, the numbers were plausible. And it was refusing about one measurement in nine — visible only because the rejections went to a counter rather than a log line. That single design choice is the reason there is anything to report.</p>

      <h2>The principle is not new. The number is.</h2>

      <p>Time-tagging measurements by their observation instant rather than their arrival instant is standard target-tracking practice, and handling measurements that turn up out of order has a name — out-of-sequence measurement processing — and a literature going back decades. Bar-Shalom covers it. Any engineer who has done tracking professionally knows the rule.</p>

      <p>What is missing from the literature is the price. How much does a real system actually lose by stamping on arrival, on a live public feed, under controlled A/B, with everything else in the pipeline correct? I could not find that number written down anywhere, so I measured it.</p>

      <h2>The gate has a sub-second tolerance for clock error</h2>

      <p>The tracker runs an innovation gate: when a new position arrives, the filter predicts where the aircraft should be, and if the measurement is too far from that prediction it is rejected as physically impossible rather than believed.</p>

      <p>Once a track converges, the innovation standard deviation settles around 36 m, so a five-sigma gate sits at roughly 180 m. An airliner at 250 m/s covers 180 m in <strong>0.7 seconds</strong>.</p>

      <p>So the gate's entire tolerance for a wrong timestamp is under one second. Any pipeline that mis-times its measurements by more than that will have them rejected — correctly, and invisibly.</p>

      <h2>The feed reports its own staleness. Most pipelines drop it.</h2>

      <p>Every ADS-B record carries a field saying how old that position already was when the response was generated. In the original build it was parsed into the contact struct and never read again — the only other place the field appeared in the entire codebase was as <code>0.0</code> in test fixtures. Every measurement was therefore stamped with the tracker's own cycle clock, as though it had been observed at the instant it landed.</p>

      <p>This is the common case, not an exotic one. A field that is decoded and then unused looks identical to a field that is decoded and used, right up until you go looking for its second reference.</p>

      <p>Here is what that field actually contains, sampled across two consecutive polls of the live feed:</p>

      <pre><code>reported age of position    median   0.31 s
                            p90      3.97 s
                            max     48.53 s

change per aircraft
between consecutive polls   −15.76 s  to  +3.00 s

re-served identical
positions                   17 of 135 contacts  (12.6%)</code></pre>

      <h2>It is the jitter, not the lag</h2>

      <p>The intuitive diagnosis is that the lag itself is the problem. It is not, and the distinction turns out to be the whole thing.</p>

      <p><strong>A constant lag is invisible to a constant-velocity filter.</strong> If every measurement is uniformly two seconds old, the filter simply tracks a target that is uniformly two seconds behind. The innovations stay small. Nothing is rejected. The picture is late, but it is self-consistent.</p>

      <p>This has a sharp practical consequence for anyone trying to write a regression test for it: a fixture built with a constant age will not reproduce the fault, no matter how large the age. The test passes and the bug survives. The fixture has to carry the variation, or it is testing nothing.</p>

      <p>It is the <em>variation</em> that does the damage. Look at that middle row again: between two polls two seconds apart, one aircraft's reported age fell by nearly sixteen seconds. That is a genuinely new observation arriving after a long gap. Stamped on arrival, both the stale one and the fresh one are marked "now", so the filter sees an aircraft that has apparently teleported. A steadily flying aeroplane appears to lurch back and forth, and a correctly functioning gate refuses to believe it.</p>

      <p>The shipped fixture is sized to the measured distribution rather than to whatever made the point loudest. On that timeline a 200 m/s target produces a worst innovation of <strong>0.01 sigma</strong> when the age is honoured and <strong>16.1 sigma</strong> when it is discarded — either side of a five-sigma gate by a wide margin, rather than balanced on it. A test that sits near its own threshold is a test that will flap.</p>

      <h2>Why the obvious fix makes it worse</h2>

      <p>This is the part worth reading, and the reason the change is architectural rather than a one-line patch.</p>

      <p>The obvious repair is: stamp each measurement with <code>arrival − age</code>, feed that to the filter, and guard against a measurement arriving from before the filter's current state, because you cannot predict backwards.</p>

      <pre><code>if observed_time &lt;= track.epoch &#123; reject &#125;</code></pre>

      <p>That guard is fatal, and it is worth being precise about why, because the reasoning generalises. Every cycle, the display loop advanced <em>every</em> track to the current wall-clock time so the picture and the collision screen would agree. So by the time a two-second-old measurement arrived, the track's clock already read later than the measurement, and the guard would have discarded it as stale. A patch aimed at an 11% rejection rate would have rejected considerably more — and it would have looked, from the outside, exactly like the fix working.</p>

      <p>The general form: <strong>a Kalman filter's state is valid for exactly one instant.</strong> Once anything other than a measurement is allowed to advance that instant, every measurement is applied to a state from a different moment than the one it describes. A rendering loop is not usually thought of as mutating the estimator, which is precisely why this survives review.</p>

      <p>The pre-fix code was not wrong about this. It was <em>consistently</em> wrong — the display and the measurements were stamped with the same fictional clock, so they agreed with each other. That is why correcting one half in isolation breaks it, and why the fix had to change the ownership of time rather than the arithmetic.</p>

      <h2>The rule that actually fixes it</h2>

      <p>One sentence: <strong>the filter's validity time advances only when a measurement arrives. Nothing else may move it.</strong></p>

      <p>The picture and the conjunction screen do not predict tracks forward — they take a view, which extrapolates a copy and leaves the filter parked at the moment it was last given evidence for. A test asserts that rendering the screen thirty times does not move a single filter.</p>

      <p>Two properties follow from that rule, and both are load-bearing.</p>

      <p>First, the absolute observation time is never reconstructed at all. The step between two observations is computed entirely from differences — elapsed time between two arrivals the process witnessed, plus the two ages the sensor reported. Nothing subtracts a duration from a monotonic clock, so there is no underflow path. That closes a real crash: <code>Instant - Duration</code> panics in Rust if the result would be before the clock's origin, and on Windows that origin is boot time.</p>

      <p>Second, deduplication is free. A re-served snapshot has both its arrival and its reported age advance by the same amount, so it computes a step of exactly zero and is rejected by the same comparison that catches out-of-order data. One comparison covers both cases, which is a good sign that the invariant is the right one.</p>

      <h2>Designing an A/B the upstream cannot distort</h2>

      <p>Measuring this against a live third-party feed is harder than it looks, and two experiment designs had to be discarded before one held.</p>

      <p>Running both binaries simultaneously against the same feed fails: the corrected build recorded 32 polls and 32 HTTP errors — zero data — while the old one ran fine. That is not a regression, it is the upstream rate-limiting per IP and refusing the second client. Running them sequentially fails differently: the results invert, because the API throttles progressively under load and whichever build runs first gets the fresher quota. Time-to-first-byte on three consecutive manual requests climbed 0.43 s, 0.91 s, 4.22 s.</p>

      <p>Both of those would have produced a clean-looking number and a wrong conclusion. The check that caught them was running the corrected build alone, which worked — proving the failure was the environment, not the code under test.</p>

      <p>The design that survives: alternating order, 45-second windows, 75-second cooldowns, comparing gated plots as a <em>fraction</em> of observations so traffic volume cancels.</p>

      <pre><code>window   build       observations   gated   rate
  1      corrected       2,137          3    0.14%
  2      pre-fix         2,752        308   11.19%
  3      corrected       2,208         81    3.67%
  4      pre-fix         2,755        578   20.98%

pooled   pre-fix       886 / 5,507         16.1%
         corrected      84 / 4,345          1.9%</code></pre>

      <p>Both corrected windows sit below both pre-fix windows with no overlap. The corrected build varies — 0.14% against 3.67% — and I would not claim a precise point estimate from four windows. The separation is the defensible result.</p>

      <h2>Two unrelated faults the instrumentation surfaced</h2>

      <p>The A/B exposed two further problems in the old build that nobody was looking for, and neither was visible before the counters existed.</p>

      <p><strong>It was silently failing most of its polls.</strong> 888 observations at roughly 135 per response is about seven successful polls in sixty seconds, not thirty. Two-thirds of its requests were failing and the system reported nothing, because there were no sensor-health counters at all — a failed poll simply produced no data, which looks exactly like quiet airspace.</p>

      <p><strong>It never aged out a single track.</strong> Zero drops in both of its windows. Of course it didn't: if every measurement is stamped with the arrival time, every track's last-seen time is always now, so nothing is ever stale. A track whose aircraft stopped reporting forty seconds ago sat on the display looking exactly as current as everything else.</p>

      <p>Those counters were added to report on something else entirely — a limit on how large a response body the ingestion path will accept. They immediately found a different fault. That is the lesson I would take from this project ahead of the timestamp one: <strong>observability added for one problem finds problems you were not looking for, and a system with no failure counters cannot tell you the difference between "nothing is happening" and "nothing is working".</strong></p>

      <h2>Up is not altitude, and only one of the two matters</h2>

      <p>The tracker works in a local East/North/Up frame in metres, because degrees are not a metric space — at Athens, 0.01° is 1.1 km of northing but 0.87 km of easting, and a filter run on raw latitude and longitude inherits that distortion.</p>

      <p>But the "Up" axis is height above the tangent plane at the observer, and the Earth curves away from that plane as the square of the range. At 463 km — the edge of the default 250 NM picture — an aircraft genuinely at 36,089 ft sits <strong>19,233 ft below</strong> the plane. Displayed as altitude, that is off by a few hundred feet at short range and looks entirely plausible; at long range it renders cruising airliners as below sea level.</p>

      <p>The fix is an exact inverse transform back to geodetic altitude, applied <em>only to the display</em>. The tracking and screening frame is deliberately left alone, and that decision is the interesting half: the curvature error is common-mode between two aircraft near each other, so a true 305 m vertical separation at 463 km computes as 297 m in the tangent frame — an 8 m error against a 305 m threshold. The individual heights are badly wrong; the separation the safety logic actually tests is not.</p>

      <p>Both facts are pinned by tests, in both directions — one asserting the display is now correct, one asserting the screening frame is still uncorrected on purpose. That distinction is exactly the kind of thing a later cleanup pass removes without knowing why it was there.</p>

      <p>The independent confirmation: after the fix, long-range altitudes land on exact flight levels — 36,000, 45,000, 47,001 ft. Real barometric altitudes sit on flight levels. Wrong ones do not.</p>

      <h2>What this is and isn't</h2>

      <p>It is one system, one sensor, one feed, measured across four 45-second windows on a single afternoon from a single IP against an upstream that throttles. It is not a controlled study and I would not generalise the 16.1% to anyone else's pipeline. A different poll rate, a different feed, a different gate width, or a filter tuned more loosely would all produce a different number — and a looser gate would produce a smaller one while quietly accepting the corrupted measurements instead, which is worse.</p>

      <p>It is also not a claim that the corrected system is right in any absolute sense. Late measurements are still dropped rather than retrodicted. The motion model is constant-velocity, so manoeuvring targets are tracked with elevated innovations. The separation minima are en-route values applied regardless of airspace class, which raises alerts on low-altitude traffic near airports that a real system would suppress. Those are in the repository's limitations section, along with the rest.</p>

      <h2>What to check in your own pipeline</h2>

      <p>If you ingest anything from a source that reports its own staleness — market data, IoT sensors, GPS, log shipping, any polled API with a timestamp in the payload — check whether your pipeline is recording when the record <em>arrived</em> instead of when it was <em>observed</em>.</p>

      <p>The failure mode is nasty specifically because it is quiet. Nothing crashes. No error is logged. Your validation layer does its job perfectly and deletes your good data, and if the rejections are counted anywhere at all you will read the number as evidence that the validation is working.</p>

      <p>And a constant lag will hide it from you completely. It is the jitter that bites, which means the systems most likely to have this bug are the ones whose feeds are <em>usually</em> fast.</p>

      <p><em>The engine is open source under MIT at <a href="https://github.com/Mormolykos/aether">github.com/Mormolykos/aether</a> — 55 tests, clippy clean at <code>-D warnings</code>. It is surveillance and state estimation only: no targeting, engagement or weapon functionality of any kind. The README carries the full measured results and a limitations section considerably longer than this article's.</em></p>
    </article>
  );
};
