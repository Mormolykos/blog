import React from 'react';

export const BrokenInstrumentsArticle: React.FC = () => {
  return (
    <article>
      <h1>Two of My Instruments Were Wrong, in Opposite Directions</h1>
      <p><em>On 28 August 2026 I audited 38 live pages and fixed some ordinary defects. The two things worth writing down both came from my own tooling being broken. One script reported three pages I had just fixed as still broken, because it did not recognise a relative link. One date parser had thrown an exception on every crawl-statistics read since it was written, so the report that answers “is the crawler arriving at all” had never once returned a number. Repairing it showed one search engine crawling this host 15–36 pages a day and holding 34, while the other holds none. I am not going to tell you why.</em></p>
      <hr />

      <p>This is a note about measurement rather than about search engines. The setting is an indexing problem on one of my hosts, but the transferable part is that I spent a day acting on numbers produced by instruments I had never checked, and both of them were wrong — one in each direction. One made a working fix look broken. One made a working crawler invisible.</p>

      <h2>Crawling and indexing are not the same thing</h2>

      <p>Everything below depends on this distinction, and most confused writing on the subject collapses it into one word.</p>

      <p><strong>Crawling</strong> is retrieval. A crawler requests a URL and receives bytes. That is all it means. A page can be crawled every day for a year and appear in no search result ever.</p>

      <p><strong>Indexing</strong> is selection. Having retrieved the page, the engine decides whether to keep it in a form it will serve. That is a judgement, each engine makes it independently, and none of them will tell you the reasoning.</p>

      <p>So there are at least three states worth separating: <em>never fetched</em>, <em>fetched and declined</em>, and <em>fetched and kept</em>. “My pages aren’t indexed” describes the middle two identically, and their causes have nothing in common. Knowing which one you are in is the first useful thing, and a crawl-statistics report is what tells you.</p>

      <h2>The audit, kept in proportion</h2>

      <p>On <strong>28 August 2026</strong> I fetched every URL in the sitemap — 38 pages on the affected host, 20 on this notebook — over plain HTTP with no JavaScript executed, and produced a number per page rather than a verdict. That rule exists because an earlier audit on this estate returned “all clean” for months while the homepage was handing crawlers a fraction of its navigation in a form they could use.</p>

      <p>It found real defects. Five pages had <strong>zero followable links</strong>: a crawler arriving there could go nowhere. The worst had two navigation controls, both <code>&lt;button onclick&gt;</code> — usable with a mouse, invisible to a crawler. Three more bound their only navigation to a JavaScript click handler, which has the same effect.</p>

      <table>
        <thead>
        <tr><th>38 pages, fetched live</th><th>Before 28 Aug</th><th>After 28 Aug</th></tr>
        </thead>
        <tbody>
        <tr><td>Pages with zero followable links</td><td>5</td><td><strong>0</strong></td></tr>
        <tr><td>Navigation a crawler cannot follow</td><td>2</td><td><strong>0</strong></td></tr>
        <tr><td>Pages with an incorrect <code>h1</code> count</td><td>1</td><td><strong>0</strong></td></tr>
        <tr><td>Missing robots directive</td><td>1</td><td><strong>0</strong></td></tr>
        <tr><td>Canonical problems</td><td>0</td><td>0</td></tr>
        <tr><td>Images with no <code>alt</code> attribute (of 199)</td><td>0</td><td>0</td></tr>
        <tr><td>Non-200 responses</td><td>0</td><td>0</td></tr>
        </tbody>
      </table>

      <p>On this notebook site, one change to the head template took the robots directive, <code>og:url</code>, <code>og:site_name</code> and Twitter card metadata from <strong>0 of 20 pages to 20 of 20</strong>.</p>

      <p>This is housekeeping. It is worth doing and it is not a finding, and I am reporting it mainly because it is the baseline for the prediction at the end.</p>

      <h2>Instrument one: a false negative that looked exactly like a failed fix</h2>

      <p>After deploying, I re-ran the audit against the live site. It reported that three of the pages I had just fixed still had zero followable links.</p>

      <p>They did not. I fetched one by hand and the anchor was plainly in the served HTML.</p>

      <p>The bug was mine. The script counted links by matching <code>href</code> values that started with <code>/</code> or <code>http</code>. The anchors I had added were relative — <code>href=&quot;./&quot;</code> — so they matched nothing and counted as zero.</p>

      <p>What makes this worth writing down is the shape of the failure. <strong>A measurement that silently under-reports is indistinguishable from the defect it is supposed to detect.</strong> Every downstream step would have been reasonable and wrong: conclude the deploy failed, go hunting for a caching problem that did not exist, possibly “fix” three pages that were already correct and introduce a real defect doing it. Nothing in the output looked like an error. It looked like bad news.</p>

      <p>The only thing that caught it was retrieving the page and reading the markup. The script now counts every followable <code>href</code>, excluding only fragments and non-navigation schemes, and the corrected run is the one in the table above.</p>

      <h2>Instrument two: a report that had never returned a number</h2>

      <p>The second failure was older and much more expensive.</p>

      <p>Bing’s webmaster API serialises dates in a Microsoft-era format — <code>/Date(1784190745000)/</code>, epoch milliseconds wrapped in a string. My parser handled that correctly. But one endpoint, and as far as I can tell only one, returns a second variant carrying a UTC offset: <code>/Date(1786345200000-0700)/</code>.</p>

      <p>My pattern captured “digits and minus signs”. It swallowed the offset into the number, and the integer conversion raised an exception every time.</p>

      <p>Because that variant appears in exactly one report, the failure was invisible everywhere else. Every other Bing call worked. And the one report it broke was <strong>crawl statistics</strong> — which my own notes describe as the nearest available substitute for origin access logs, and the first thing to check when asking whether a crawler is showing up.</p>

      <p>It had never once returned a value. I had been reasoning about crawler behaviour for weeks with the most direct instrument for it throwing an exception on every call. The fix is one line; the test asserts that both offset signs resolve to the same instant, because the value before the offset is already UTC.</p>

      <h2>What the repaired report showed</h2>

      <table>
        <thead>
        <tr><th>Date</th><th>Pages crawled that day (Bing)</th><th>Pages held in index (Bing)</th></tr>
        </thead>
        <tbody>
        <tr><td>2026-08-24</td><td>15</td><td>33</td></tr>
        <tr><td>2026-08-25</td><td>27</td><td>33</td></tr>
        <tr><td>2026-08-26</td><td>36</td><td>34</td></tr>
        <tr><td>2026-08-27</td><td>23</td><td><strong>34</strong></td></tr>
        </tbody>
      </table>

      <p><strong>Bing crawls this host every day, 15 to 36 pages, and holds 34 of roughly 38 in its index. Google holds none of them.</strong></p>

      <p>I had a weaker version of this already — the same host shows impressions in Bing, and I had a static count of 32 indexed. Turning a single number into a daily series changes how emphatic it is. This is not a host a major crawler visits occasionally. It is one a major crawler works through continuously, and has done throughout the period I spent trying to work out why crawlers were not engaging with it.</p>

      <h2>Sorting the evidence</h2>

      <p>Separating these categories is the only reason the rest is worth anything.</p>

      <p><strong>Verified directly from the live sites (2026-08-28):</strong> every row of the 38-page audit, fetched over HTTP with no JavaScript, and re-verified after deployment. The defect counts before and after. The head-template metadata going from 0 of 20 to 20 of 20.</p>

      <p><strong>Measured from Bing’s API (2026-08-24 to 2026-08-28):</strong> the daily crawl volume and the index count. These are one engine’s figures about its own behaviour. They are good evidence about that engine and no evidence at all about any other.</p>

      <p><strong>Corrected tooling:</strong> two bugs, both mine, both fixed on 2026-08-28, one now covered by a regression test. The numbers reported here are the post-correction ones. The pre-correction numbers were wrong in a way that read as a genuine finding, which is the entire point of the article.</p>

      <p><strong>Observation:</strong> two major engines, given the same host, the same bytes, the same permissive <code>robots.txt</code> and the same sitemap, have reached opposite conclusions. One indexes nearly everything. One indexes nothing.</p>

      <p><strong>Unresolved:</strong> why. I do not know. I did not learn it on 28 August, and I am not going to name a mechanism to round the story off. Index selection is independent between engines, so an asymmetry is permitted and is not by itself evidence of a fault anywhere.</p>

      <p>What the asymmetry does do is retire a family of explanations. A page that a large crawler retrieves daily and chooses to keep is demonstrably reachable, parseable, renderable and acceptable to a serious indexing pipeline. Whatever remains sits inside one engine’s selection, and I have no owner-side instrument that reads it.</p>

      <p>I want to be explicit, because the genre invites the opposite reading: <strong>nothing here fixed the zero.</strong> It was zero before the audit and it was zero after. This is not a recovery story.</p>

      <h2>The prediction, recorded before the outcome</h2>

      <p>The obvious next question is whether the fixes helped. I cannot answer that today — the changes went live on 28 August, and there is no after to compare against.</p>

      <p>So instead of waiting and then claiming a prediction I never wrote down, here it is in advance.</p>

      <p><strong>Baseline, 2026-08-28.</strong> Google: 0 pages indexed on the affected host. Bing: 34 held, 15–36 crawled per day. Audit defects as in the table above, all at zero.</p>

      <p><strong>I will re-measure on 2026-09-15</strong>, with the same script and the same API calls, and publish the result whichever way it goes.</p>

      <p><strong>What I expect: no material change in either engine.</strong> The defects I fixed were real, but none of them plausibly explains a host-wide zero, and Bing was already crawling this host thoroughly while every one of them was still present — which is fairly direct evidence that they were not what stood in the way. I also ran the standard remedies against a held-out control group earlier in this investigation and measured no effect.</p>

      <p>If the numbers move, my model is wrong and that is the more interesting outcome. If they do not, I have a dated negative result instead of a vague impression. Either is better than the version where I check first and decide afterwards what I always thought.</p>

      <h2>What I would take from this</h2>

      <ul>
        <li><strong>Check instruments against reality before trusting their output.</strong> Two of mine were wrong on the same day, in opposite directions. Both would have survived indefinitely if I had only read what they printed.</li>
        <li><strong>A silent nothing is worse than a loud failure.</strong> My date parser raised an exception where the absence of a number looked like the absence of data. Make a missing measurement say <em>missing</em> — never zero, and never an empty report.</li>
        <li><strong>Separate crawled from indexed in your own vocabulary first.</strong> If you cannot say which state a URL is in, advice cannot help you, because the fixes for “never fetched” and “fetched and declined” have almost nothing in common.</li>
        <li><strong>Count links on the page, not links to it.</strong> A page with no outgoing anchors is a dead end however many things point at it, and a click handler is invisible to the thing you are trying to persuade.</li>
        <li><strong>Fetch it and read it.</strong> Every real finding here came from the actual bytes. Every error came from believing a summary.</li>
        <li><strong>Write the prediction down first.</strong> It costs one paragraph and it is the difference between a result and a story.</li>
      </ul>

      <p>The honest summary of the day: I improved a site that was already technically sound, repaired two instruments that had been quietly lying to me, and confirmed an asymmetry I can describe precisely and cannot explain at all.</p>
    </article>
  );
};
