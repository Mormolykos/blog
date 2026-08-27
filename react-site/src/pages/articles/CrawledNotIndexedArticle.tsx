import React from 'react';

export const CrawledNotIndexedArticle: React.FC = () => {
  return (
    <article>
      <h1>Requesting Indexing Did Nothing, and I Have the Control Group</h1>
      <p><em>One of my hosts had 0 of 38 URLs in Google while four sibling hosts on the same domain, the same IPs and the same certificate indexed normally. The standard advice is to submit the URLs. I submitted them against a held-out control: treatment 32%, control 33%. Then I spent six weeks eliminating fifteen causes, two of which were my own hypotheses, before finding the thing that reframed all of it.</em></p>
      <hr />

      <p>Almost everything written about <strong>“Crawled – currently not indexed”</strong> is advice. Add content. Improve internal links. Request indexing. Build backlinks. Be patient.</p>

      <p>Very little of it is measurement, and none of it that I could find has a control group. So when it happened to me across an entire hostname, I decided the useful contribution was not another opinion. It was to run the advice as an experiment and report what came back — including the parts where I was wrong.</p>

      <h2>The observation</h2>

      <p>I run five hosts under one domain. They share two IPs, one origin, one wildcard certificate, and an identical permissive <code>robots.txt</code>. Four of them index normally. One indexes nothing at all.</p>

      <p>At the point I started measuring: <strong>0 of 38 tracked URLs indexed on the failing host</strong>, against 26 of 32 across the four siblings. Not a slow host. A host with complete separation from its own neighbours.</p>

      <p>Search Console keeps no history you can query, so the first real problem was that I had nothing to measure. I built a daily capture against the URL Inspection API and let it run: <strong>over 1,200 per-URL coverage records across 30 days</strong>. That dataset is the reason everything below is a number rather than an impression.</p>

      <h2>The experiment</h2>

      <p>The most common advice is the most testable, so I tested it first. I registered the hypothesis before running it — the prediction was that pushing would <em>not</em> materially move coverage — seeded the assignment, and held out a stratified 20% control that received no intervention at all.</p>

      <p>The treatment arm got the full playbook: sitemap resubmission, per-URL indexing requests, IndexNow.</p>

      <table>
        <thead>
        <tr><th>Arm</th><th>URLs</th><th>Indexed</th><th>Indexed %</th></tr>
        </thead>
        <tbody>
        <tr><td>Control — no action of any kind</td><td>9</td><td>3</td><td><strong>33%</strong></td></tr>
        <tr><td>Treatment — sitemap + per-URL + IndexNow</td><td>37</td><td>12</td><td><strong>32%</strong></td></tr>
        </tbody>
      </table>

      <p>Treatment performed one point <em>worse</em> than doing nothing, which is noise at this sample size. The honest statement is: <strong>the intervention had no detectable effect.</strong></p>

      <p>This is the part I want to be plain about. It is a small experiment on one estate and it does not generalise to your site. What it does establish is that on this host, the first thing everyone recommends was measured against a control and produced nothing — and that a control group is cheap enough that there is no excuse for the industry not to have one.</p>

      <h2>Fifteen causes, eliminated with measurements</h2>

      <p>With pushing ruled out, I worked the technical surface. Each of these was checked directly with output on record, not reasoned about:</p>

      <p><code>robots.txt</code> · <code>X-Robots-Tag</code> headers · declared vs Google-selected canonicals across 25 days · HTTP status on every URL · DNS A and AAAA parity · TLS · CDN and IP parity · user-agent cloaking · JavaScript dependence · thin content · orphan pages · internal links · external links · sitemap validity · crawl budget · <code>lastmod</code> hygiene.</p>

      <p>All negative. Two of them were hypotheses I had formed myself and then had to withdraw:</p>

      <p><strong>Crawl-budget starvation.</strong> Refuted immediately — the failing host receives <em>more</em> crawl requests than any other host in the property, with crawl status reported as “No problems”.</p>

      <p><strong>Weak internal linking.</strong> This one ran backwards. The never-crawled group averaged 4.0 inbound crawlable links; the crawled group averaged 5.0, and the distributions overlapped almost entirely. One page with <strong>eleven</strong> inbound links from indexed pages had never been fetched. Another with <strong>one</strong> had been crawled. Whatever selects these pages, it is not counting my internal links.</p>

      <h2>The control that mattered most</h2>

      <p>The single most useful check cost nothing and I nearly did not think of it: <strong>I compared two search engines reading the same file.</strong></p>

      <table>
        <thead>
        <tr><th>Engine</th><th>Sitemap processed</th><th>URLs extracted</th><th>Result</th></tr>
        </thead>
        <tbody>
        <tr><td>Google</td><td>2026-08-17</td><td>29</td><td><strong>0 indexed</strong></td></tr>
        <tr><td>Bing</td><td>2026-08-16</td><td>29</td><td><strong>32 indexed</strong></td></tr>
        </tbody>
      </table>

      <p>Identical input, one day apart, identical parse, opposite outcome. That controls the sitemap out of the problem entirely — it cannot be malformed, stale, unreachable or misread, because a second major crawler read the same bytes on the same days and acted on them. It also demonstrates the pages are retrievable, parseable and indexable by a large crawler.</p>

      <p>It says nothing about Google’s reasoning. Selection is independent between engines. But it converts a whole class of “maybe your sitemap is broken” advice into a settled question, for the price of opening a second webmaster console.</p>

      <h2>The thing that reframed everything</h2>

      <p>Six weeks in, I was still asking the wrong question.</p>

      <p>I had been asking <em>why will Google not accept this host</em>. Then I filtered the Performance report to that hostname — something no automated collector I had built was reading, because I had instrumented coverage and never impressions — and found this:</p>

      <table>
        <thead>
        <tr><th>Metric, 3 months</th><th>Value</th></tr>
        </thead>
        <tbody>
        <tr><td>Impressions</td><td>68</td></tr>
        <tr><td>Clicks</td><td>0</td></tr>
        <tr><td>Average position</td><td><strong>1.5</strong></td></tr>
        <tr><td>URLs with impressions</td><td>5</td></tr>
        </tbody>
      </table>

      <p><strong>An impression requires being served in a result set, which requires being in the index.</strong> Those pages were in Google. They were served. The monthly curve rises through May and June, peaks in July, and reaches zero in August.</p>

      <p>Three of the five are URLs that Search Console now reports as <em>“URL is unknown to Google”</em>. Google served them, and now reports never having seen them.</p>

      <p>So it was never a failure to be accepted. It was <strong>a loss of something already held</strong> — and every hypothesis I had built, including my leading one, had been formulated to explain an absence rather than a withdrawal. That is a different question with a different shape, and I had spent six weeks not asking it.</p>

      <p>The instrumentation lesson is worse than the SEO one: <strong>my daily capture began after the event it was built to explain.</strong> I measured the aftermath at high resolution and had no visibility into the transition at all.</p>

      <h2>Three suspects, checked and cleared</h2>

      <p>With a date to work against, the git history became evidence.</p>

      <p><strong>A URL migration.</strong> Seven weeks before the collapse I had moved every public page from <code>page.html</code> to <code>page/index.html</code>. A site-wide URL change immediately before an index loss is a strong-looking lead. It died on inspection: the redirect map shipped in the same commits as the moves, and every pre-migration URL still returns a clean single-hop 301 to a live 200. The migration was executed correctly.</p>

      <p><strong>A broken sitemap.</strong> I found a commit where the sitemap served on that host had been populated with URLs belonging to a <em>different</em> host. Excellent candidate — until I checked the timestamps. It was introduced and reverted the same day, hours apart.</p>

      <p><strong>The CDN blocking Googlebot.</strong> The best remaining hypothesis, because it would explain the one hole in my cloaking test: I had fetched my pages with a spoofed Googlebot user-agent from my own IP, which can never reach a rule that keys on verified bot identity. I pulled 24 hours of firewall events — 290 blocked requests — and read every one.</p>

      <p>All 290 were genuine attack traffic: a React RCE probe, WordPress exploit attempts, hunting for <code>wp-config.php</code> backups. <strong>Zero Googlebot events.</strong> The failing host was the second-<em>least</em> blocked of the seven. Four of its five blocks were a single attacker spoofing Apple’s crawler from a cloud IP while requesting a WordPress config file.</p>

      <p>That hypothesis is not supported, with the limit stated: 24 hours on a free plan, two months after the event, and a firewall log only records what it mitigated — a normally-served crawler correctly leaves no trace.</p>

      <h2>Where the evidence actually stops</h2>

      <p>I can tell you the locus and the timing and not the mechanism.</p>

      <p><strong>Locus:</strong> host-level. Every page-level and infrastructure-level explanation is eliminated, across pages with nothing structurally in common — a product page, legal pages, a game, a catalogue, research write-ups — all declining uniformly.</p>

      <p><strong>Timing:</strong> served through July, zero by August.</p>

      <p><strong>Mechanism:</strong> unknown, and I am going to leave it unknown rather than pick the most satisfying survivor. Google exposes no host-reputation signal, and there is no owner-side diagnostic I have not now run. Every explanation I could reach for at this point would be a story fitted to a shape.</p>

      <p>The one thing I will say, because it is measured rather than inferred: the failing host has never had an <em>earned</em> followed inbound link. A third-party link index shows 423 referring domains pointing at the estate and rates their combined authority at effectively zero — the genuine ones are all <code>nofollow</code> platform links, and the rest are link-selling spam that arrived uninvited. Meanwhile every organic query the estate receives is a misspelling of its own brand name. Zero informational queries.</p>

      <p>That is not a diagnosis. It is the honest description of a site that no independent source has ever vouched for, and it is a more plausible neighbourhood for the answer than anything in my <code>robots.txt</code>.</p>

      <h2>What I would tell someone with the same symptom</h2>

      <ul>
        <li><strong>Check impressions before you check coverage.</strong> Coverage tells you the state now. Impressions tell you whether you ever had it. I had those two backwards for six weeks.</li>
        <li><strong>Instrument before the incident, not after.</strong> Search Console retains no coverage history. If you are not capturing it daily, the transition you will eventually need to explain is already unrecoverable.</li>
        <li><strong>Hold out a control.</strong> It costs a handful of URLs and it is the only thing that distinguishes “my fix worked” from “time passed”.</li>
        <li><strong>Use a second search engine as a control instrument.</strong> One console is a measurement; two consoles reading identical input is an experiment.</li>
        <li><strong>Read the console UI and the API.</strong> The API gave me history the UI cannot produce. The UI gave me categories the API does not expose. I ran on one of them for six weeks and it cost me the central finding.</li>
        <li><strong>Let negative results be negative.</strong> Fifteen eliminations and a withdrawn hypothesis of my own are a better description of this problem than any confident cause I could have written instead.</li>
      </ul>

      <p>I would rather publish “locus established, mechanism unknown” with the working shown than another article telling you to improve your internal linking.</p>
    </article>
  );
};
