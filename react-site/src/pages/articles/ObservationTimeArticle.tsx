import React from 'react';

export const ObservationTimeArticle: React.FC = () => {
  return (
    <article>
      <h1>My Tracker Threw Away One Good Measurement in Six. It Was Recording When the Data Arrived.</h1>
      <p><em>A live aircraft tracker that looked healthy was rejecting 16% of its own valid observations. The feed had been telling me how stale each measurement was the entire time, in a field I decoded and then ignored. Here is the controlled A/B, the fix I nearly shipped that would have made it worse, and the two unrelated failures the fix dragged into the light.</em></p>
      <hr />

      <p>I built a small aerospace telemetry engine in Rust — it polls a public ADS-B feed, keeps a Kalman-filtered track per aircraft, and screens every pair for closest approach against ICAO separation minima. Roughly 150 aircraft over Greece at any moment, a fixed-rate loop, sub-millisecond cycles.</p>

      <p>It ran clean. Tests passed, the picture looked right, the numbers were plausible. And it was quietly refusing about one measurement in nine, which I only noticed because I had put a counter on the rejections rather than a log line.</p>

      <h2>Let me kill the novelty claim first</h2>

      <p>Nothing in this article is a discovery. Time-tagging measurements by their observation instant rather than their arrival instant is standard target-tracking practice, and handling measurements that turn up out of order has a name — out-of-sequence measurement processing — and a literature going back decades. Bar-Shalom covers it. If you have done tracking professionally you already know the rule I broke.</p>

      <p>What I have is not the idea. It is a measurement: what breaking that rule actually costs, on a live public feed, under controlled A/B, in a system where everything else was correct. I could not find that number written down anywhere, so here it is.</p>

      <h2>The gate was working. That was the problem.</h2>

      <p>The tracker runs an innovation gate: when a new position arrives, the filter predicts where the aircraft should be, and if the measurement is too far from that prediction it is rejected as physically impossible rather than believed.</p>

      <p>Once a track converges, the innovation standard deviation settles around 36 m, so a five-sigma gate sits at roughly 180 m. An airliner at 250 m/s covers 180 m in <strong>0.7 seconds</strong>.</p>

      <p>Which means the gate's tolerance for being lied to about time is under a second. And I was lying to it constantly.</p>

      <h2>The feed tells you. I decoded it and dropped it on the floor.</h2>

      <p>Every ADS-B record carries a field saying how old that position already was when the response was generated. I parsed it into my contact struct and then never read it again — the only other place the field appeared in the entire codebase was as <code>0.0</code> in test fixtures. Every measurement was stamped with the tracker's own cycle clock, as though it had been observed at the instant it landed.</p>

      <p>Here is what that field actually contains, sampled across two consecutive polls of the live feed:</p>

      <pre><code>reported age of position    median   0.31 s
                            p90      3.97 s
                            max     48.53 s

change per aircraft
between consecutive polls   −15.76 s  to  +3.00 s

re-served identical
positions                   17 of 135 contacts  (12.6%)</code></pre>

      <h2>The part I got wrong twice</h2>

      <p>My first instinct was that the lag itself was the problem. It isn't, and this took me an embarrassing detour to see.</p>

      <p><strong>A constant lag is invisible to a constant-velocity filter.</strong> If every measurement is uniformly two seconds old, the filter simply tracks a target that is uniformly two seconds behind. The innovations stay small. Nothing is rejected. The picture is late, but it is self-consistent.</p>

      <p>I wrote a regression test asserting that ignoring the reported age causes gating, and it failed — because I had built the fixture with a constant age. The test was right and I was wrong.</p>

      <p>It is the <em>variation</em> that does the damage. Look at that middle row again: between two polls two seconds apart, one aircraft's reported age fell by nearly sixteen seconds. That is a genuinely new observation arriving after a long gap. Under the old code both the stale one and the fresh one were stamped "now", so the filter saw an aircraft that had apparently teleported. A steadily flying aeroplane appears to lurch back and forth, and a correctly functioning gate refuses to believe it.</p>

      <p>I sized the eventual test fixture to the measured distribution rather than to whatever made the point loudest. On that timeline a 200 m/s target produces a worst innovation of <strong>0.01 sigma</strong> when the age is honoured and <strong>16.1 sigma</strong> when it is discarded — either side of a five-sigma gate by a wide margin, rather than balanced on it.</p>

      <h2>The fix I nearly shipped</h2>

      <p>This is the part worth reading.</p>

      <p>The obvious repair is: stamp each measurement with <code>arrival − age</code>, feed that to the filter, and guard against a measurement arriving from before the filter's current state, because you cannot predict backwards.</p>

      <pre><code>if observed_time &lt;= track.epoch &#123; reject &#125;</code></pre>

      <p>That guard is fatal, and it took an independent review pass to see why. Every cycle, the display loop advanced <em>every</em> track to the current wall-clock time so the picture and the collision screen would be consistent. So by the time a two-second-old measurement arrived, the track's clock already read later than the measurement, and the guard would have discarded it as stale.</p>

      <p>I would have shipped a fix for an 11% rejection rate that rejected considerably more. The deeper version of the same fault: a Kalman filter's state is valid for exactly one instant, and once the display is advancing that instant independently, every measurement gets applied to a state from a different moment than the one it describes.</p>

      <p>The pre-fix code was not wrong about this. It was <em>consistently</em> wrong — the display and the measurements were stamped with the same fictional clock, so they agreed with each other. Correcting one half without the other is what would have broken it.</p>

      <h2>The rule that actually fixes it</h2>

      <p>One sentence: <strong>the filter's validity time advances only when a measurement arrives. Nothing else may move it.</strong></p>

      <p>The picture and the conjunction screen do not predict tracks forward — they take a view, which extrapolates a copy and leaves the filter parked at the moment it was last given evidence for. A test asserts that rendering the screen thirty times does not move a single filter.</p>

      <p>Two details that fell out of this and turned out to matter more than I expected.</p>

      <p>First, I never reconstruct an absolute observation time at all. The step between two observations is computed entirely from differences — elapsed time between two arrivals the process witnessed, plus the two ages the sensor reported. Nothing subtracts a duration from a monotonic clock, so there is no underflow path. That closes a real crash: <code>Instant - Duration</code> panics in Rust if the result would be before the clock's origin, and on Windows that origin is boot time.</p>

      <p>Second, deduplication came free. A re-served snapshot has both its arrival and its reported age advance by the same amount, so it computes a step of exactly zero and is rejected by the same comparison that catches out-of-order data. I did not design that; I noticed it afterwards.</p>

      <h2>The A/B, including the part where I got the experiment wrong</h2>

      <p>My first attempt was to run both binaries simultaneously against the same feed. The corrected build recorded 32 polls and 32 HTTP errors — zero data — while the old one ran fine.</p>

      <p>That is not a regression. The upstream rate-limits per IP and was refusing the second client. Then I ran them sequentially, and the results inverted again, because the API throttles progressively under load and the old build always ran first and got the fresher quota. Time-to-first-byte on three consecutive manual requests climbed 0.43 s, 0.91 s, 4.22 s.</p>

      <p>The design that survives: alternating order, 45-second windows, 75-second cooldowns, comparing gated plots as a <em>fraction</em> of observations so traffic volume cancels.</p>

      <pre><code>window   build       observations   gated   rate
  1      corrected       2,137          3    0.14%
  2      pre-fix         2,752        308   11.19%
  3      corrected       2,208         81    3.67%
  4      pre-fix         2,755        578   20.98%

pooled   pre-fix       886 / 5,507         16.1%
         corrected      84 / 4,345          1.9%</code></pre>

      <p>Both corrected windows sit below both pre-fix windows with no overlap. The corrected build varies — 0.14% against 3.67% — and I would not claim a precise figure from four windows. The separation is what I would defend.</p>

      <h2>Two failures that had nothing to do with timestamps</h2>

      <p>The A/B exposed two things in the old build that I had not been looking for, and neither was visible before I added counters.</p>

      <p><strong>It was silently failing most of its polls.</strong> 888 observations at roughly 135 per response is about seven successful polls in sixty seconds, not thirty. Two-thirds of its requests were failing and the system reported nothing, because there were no sensor-health counters at all — a failed poll simply produced no data, which looks exactly like quiet airspace.</p>

      <p><strong>It never aged out a single track.</strong> Zero drops in both of its windows. Of course it didn't: if every measurement is stamped with the arrival time, every track's last-seen time is always now, so nothing is ever stale. A track whose aircraft stopped reporting forty seconds ago sat on the display looking exactly as current as everything else.</p>

      <p>I added those counters to report on an unrelated change — a limit on how large a response body the ingestion path will accept. They immediately found a different bug. That is the general lesson I would take from this project over the timestamp one: <strong>observability added for one problem finds problems you were not looking for, and a system with no failure counters cannot tell you the difference between "nothing is happening" and "nothing is working".</strong></p>

      <h2>A second bug, for free: up is not altitude</h2>

      <p>The tracker works in a local East/North/Up frame in metres, because degrees are not a metric space — at Athens, 0.01° is 1.1 km of northing but 0.87 km of easting, and a filter run on raw latitude and longitude inherits that distortion.</p>

      <p>But the "Up" axis is height above the tangent plane at the observer, and the Earth curves away from that plane as the square of the range. At 463 km — the edge of my default 250 NM picture — an aircraft genuinely at 36,089 ft sits <strong>19,233 ft below</strong> the plane. I was printing that number as altitude. At short range it is off by a few hundred feet and looks entirely plausible; at long range it renders cruising airliners as below sea level.</p>

      <p>The fix is an exact inverse transform back to geodetic altitude, and it applies <em>only to the display</em>. I deliberately left the tracking and screening frame alone, because the curvature error is common-mode between two aircraft near each other: a true 305 m vertical separation at 463 km computes as 297 m in the tangent frame — an 8 m error against a 305 m threshold. The individual heights are badly wrong; the separation that the safety logic actually tests is not. Both facts are pinned by tests, because that distinction is exactly the kind of thing that gets "cleaned up" by someone who does not know why it is there.</p>

      <p>The confirmation I liked: after the fix, long-range altitudes land on exact flight levels — 36,000, 45,000, 47,001 ft. Real barometric altitudes sit on flight levels. Wrong ones don't.</p>

      <h2>What this is and isn't</h2>

      <p>It is one system, one sensor, one feed, measured across four 45-second windows on a single afternoon from a single IP against an upstream that throttles. It is not a controlled study and I would not generalise the 16.1% to anyone else's pipeline. A different poll rate, a different feed, a different gate width, or a filter tuned more loosely would all produce a different number — and a looser gate would produce a smaller one while quietly accepting the corrupted measurements instead, which is worse.</p>

      <p>It is also not a claim that the corrected system is right in any absolute sense. Late measurements are still dropped rather than retrodicted. The motion model is constant-velocity, so manoeuvring targets are tracked with elevated innovations. The separation minima are en-route values applied regardless of airspace class, which raises alerts on low-altitude traffic near airports that a real system would suppress. Those are in the repository's limitations section, along with the rest.</p>

      <h2>The one thing I'd actually tell you</h2>

      <p>If you ingest anything from a source that reports its own staleness — market data, IoT sensors, GPS, log shipping, any polled API with a timestamp in the payload — check whether your pipeline is recording when the record <em>arrived</em> instead of when it was <em>observed</em>.</p>

      <p>The failure mode is nasty specifically because it is quiet. Nothing crashes. No error is logged. Your validation layer does its job perfectly and deletes your good data, and if the rejections are counted anywhere at all you will read the number as evidence that the validation is working.</p>

      <p>And a constant lag will hide it from you completely. It is the jitter that bites, which means the systems most likely to have this bug are the ones whose feeds are <em>usually</em> fast.</p>

      <p><em>The engine is open source under MIT at <a href="https://github.com/Mormolykos/aether">github.com/Mormolykos/aether</a> — 55 tests, clippy clean at <code>-D warnings</code>. It is surveillance and state estimation only: no targeting, engagement or weapon functionality of any kind. The README carries the full measured results and a limitations section considerably longer than this article's.</em></p>
    </article>
  );
};
