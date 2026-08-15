import React from 'react';

export const GreybodyArticle: React.FC = () => {
  return (
    <article>
      <h1>Geometric Optics Lies: Reproducing a 1976 Black-Hole Calculation from Scratch</h1>
      <p><em>The standard shortcut overstates photon emission by a factor of 4.16. Six validation gates, two analytic limits the code was never tuned to, and one number I had to retract.</em></p>
      <hr />

      <p>My last few articles were the same problem in different clothes: a metric that looks healthy while the thing underneath is broken. Word Error Rate passing mangled speech. A loss curve falling 62% on pure noise. An objective with a hole in it, and two training curves you cannot tell apart.</p>

      <p>This one is that problem in its hardest form — when there is no experiment to check against at all.</p>

      <p>If you write physics code, nobody hands you a validation set. The black hole is not going to email you. So I picked a calculation with a known answer and tried to reach it without looking: the photon emission spectrum of a Schwarzschild black hole, first computed by Don Page in 1976. The question was not really whether I could get his number. It was what it actually takes to <em>believe</em> your own output.</p>

      <h2>The shortcut, and where it breaks</h2>

      <p>Hawking radiation is not a blackbody spectrum. The curvature around the hole acts as a potential barrier that reflects most of what is emitted; the fraction escaping is the <strong>greybody factor</strong>, and getting it right means solving a wave equation mode by mode.</p>

      <p>Almost everyone starts with the shortcut — the <em>geometric-optics limit</em>, which treats the hole as swallowing anything aimed inside the photon capture cross-section. It is clean, analytic, and valid only when the emitted wavelength is small compared with the hole.</p>

      <p>That condition has an exact form. With <code>u = E/(k_B·T_H)</code>:</p>

      <pre><code>E · r_s / (hbar·c)  =  2GME/(hbar·c^3)  =  u / 4pi</code></pre>

      <p>The thermal spectrum peaks at <code>u = 1.594</code>. Substitute, and you get <strong>0.127</strong>.</p>

      <p>The typical emitted photon has a wavelength about <strong>eight times the Schwarzschild radius</strong>. The approximation is not marginally strained here — it fails across the entire range where the hole actually radiates, and the exponential cutoff kills the spectrum long before you reach the regime where it would become valid. Every textbook says the limit requires short wavelengths. Nobody makes you check.</p>

      <h2>Two details that decided the answer</h2>

      <p>A massless spin-1 field on a Schwarzschild background separates into a one-dimensional scattering problem against a barrier peaking at the photon sphere:</p>

      <pre><code>{`(d^2/dr*^2 + w^2 - V_l) Psi = 0,   r* = r + 2 ln(r/2 - 1)

V_(S,l) = f(r) · [ l(l+1)/r^2 + (1 - S^2)·2M/r^3 ],   f = 1 - 2M/r`}</code></pre>

      <p>For <code>S = 1</code> the spin term vanishes identically. The greybody factor is the transmission probability through that barrier, summed over modes and over the photon's two polarization states — and a detail worth flagging: for Maxwell on Schwarzschild both field parities obey this <em>same</em> radial equation, and those parities <em>are</em> the two polarizations. That is what pins the degeneracy factor at exactly 2, with no double counting.</p>

      <p>Two implementation choices determined whether the answer came out right at all.</p>

      <p><strong>Don't shoot from the horizon — expand around it.</strong> The horizon is a singular point, so integrating outward from beside it is numerically hostile. Substituting <code>Psi = exp(-i·w·r*)·u(r)</code> makes the equation merely <em>regular</em>-singular, and in <code>x = r - 2</code> it becomes polynomial with a clean recursion. The nearest other singularity sits at <code>x = -2</code>, so the series converges comfortably and you step over the stiff region instead of fighting it.</p>

      <p><strong>The long-range tail, which nearly ruined it.</strong> The potential falls off as <code>l(l+1)/r^2</code> — long-range. Matching the numerical solution to plain plane waves at large radius leaves an error of order <code>L/(w·r)</code>, which at low frequency is ruinous.</p>

      <p>This was the dominant error in my first working version, and how I found it is the point: <strong>not by looking at the answer.</strong> The spectrum looked entirely reasonable. It was caught by a flux-conservation monitor that had no business agreeing unless everything else was right. Expanding the asymptotic solution to second order fixed it and dropped the truncation to <code>O((L/2wr)^3)</code>, which lets you match at modest radius instead of integrating to absurd distances.</p>

      <h2>The correction, across the spectrum</h2>

      <p><img src="/greybody-spectrum.png" alt="Two-panel figure. Upper panel: photon emission spectrum versus energy on log-log axes, comparing the geometric-optics curve, which sits far above at low energy, against the Regge-Wheeler result; the two merge above roughly seven TeV. Lower panel: the ratio of the two greybody factors rising from about ten to the minus six up to one, with small oscillations where they converge." style={{ maxWidth: '100%', height: 'auto' }} /></p>

      <p>Geometric optics (dashed) overstates low-energy photon emission by up to six orders of magnitude. The curves agree only above ~7 TeV, where the wavelength finally becomes small compared with the hole.</p>

      <p>The ripple in the lower panel, as the ratio approaches one, is not numerical noise — it is the absorption cross-section ringing around its geometric value, caused by surface waves trapped near the photon sphere. I did not put that in. It arrived on its own, which is the kind of thing that makes you trust a solver.</p>

      <h2>Six gates, two of which the code could not have anticipated</h2>

      <p>Agreement with one published number proves very little. Anyone can tune until a single value matches. The checks that mean something are the ones with an independently known answer the implementation had no way to see coming.</p>

      <table>
        <thead>
          <tr><th>Gate</th><th>What it tests</th><th>Residual</th></tr>
        </thead>
        <tbody>
          <tr><td>A</td><td>Convergence under start radius, step size, match radius, series length</td><td>3.1e-08</td></tr>
          <tr><td>B</td><td>Low-frequency scaling law; measured slopes 4.005, 6.005, 8.005</td><td>5.5e-05</td></tr>
          <tr><td>C</td><td>High-frequency limit returns to the analytic geometric-optics form</td><td>2.2%</td></tr>
          <tr><td>D</td><td>Flux conservation, never imposed anywhere in the solver</td><td>2.5e-09</td></tr>
          <tr><td>E</td><td>Feeding the old approximation through the same pipeline reproduces the earlier frozen result</td><td>4.1e-07</td></tr>
          <tr><td>F</td><td>Hawking temperature matches the frozen value</td><td>1.9e-07</td></tr>
        </tbody>
      </table>

      <p><strong>Gate B is the one I would show a skeptic.</strong> At low frequency the greybody factor scales as a specific power law whose leading coefficient has a known closed form. My measurement extrapolates to <strong>0.44441988</strong> against the analytic <strong>4/9 = 0.44444444</strong> — agreement to 5.5e-05. Nothing in the code knows about 4/9. It cannot be fitted, because it is not an input.</p>

      <p>The fit also has to be done at genuinely small frequency to see it. At <code>w ~ 0.005</code> the measured slope still reads 4.04, and only settles to 4.005 an order of magnitude further down. Stopping early would have produced a number that looked wrong and wasn't.</p>

      <h2>Gate D nearly failed, and I didn't loosen it</h2>

      <p>Flux conservation — what goes in comes out — is never imposed anywhere in the solver, so it is a free error monitor. It also failed my first threshold, and the instinct is to widen the threshold until it passes.</p>

      <p>Instead I measured why. The residual falls as <code>h^5</code> with step size, while the quantity I actually care about moves only in its ninth significant figure. And when the transmission probability is ~1e-16, the identity requires sixteen digits of cancellation — more than double precision has.</p>

      <p>So the test is not failing. It is <em>inapplicable</em> in that regime, for a reason you can write down. The honest fix was to apply it only where it is meaningful and document exactly why — not to tune the number until the dashboard went green. That distinction is the whole job.</p>

      <h2>The result, and the retraction</h2>

      <p>Photon luminosity written as <code>P = alpha · hbar·c^6/(G^2·M^2)</code>:</p>

      <table>
        <thead>
          <tr><th>Source</th><th>alpha</th></tr>
        </thead>
        <tbody>
          <tr><td>Geometric optics</td><td>1.399e-04</td></tr>
          <tr><td><strong>This work</strong> (Regge–Wheeler, s = 1)</td><td><strong>3.364e-05</strong></td></tr>
          <tr><td>Page 1976 (from his 17% photon share)</td><td>3.400e-05</td></tr>
        </tbody>
      </table>

      <p>Independent implementation, <strong>1.06% from the published value</strong>. The shortcut overstates the luminosity by <strong>4.16×</strong>.</p>

      <p>Now the part I would rather leave out.</p>

      <p>An earlier draft compared against a <em>more precise-looking</em> figure for Page's total power — four significant figures instead of one. It came from a secondary summary, not from Page. When I finally pulled the published abstract, that number was not in it. I had propagated a value I never verified, and the tighter agreement it implied was an illusion.</p>

      <p>It is retracted, and the comparison now uses Page's own published figures. Which forces a second correction: <strong>1.06% is not a 1% validation.</strong> Page's abstract quotes the total to one significant figure. The honest claim is consistency at the precision the source supports — no tighter. Inverted, this calculation implies a photon share of 16.82% against his stated 17%.</p>

      <h2>What it still rests on</h2>

      <ul>
        <li><strong>Page's abstract is verified; his paper is not.</strong> The comparison values were read from the published abstract. The body is paywalled and I have not read it.</li>
        <li><strong>Photons only, Schwarzschild only, primary spectrum only, fixed mass.</strong> No neutrinos, no gravitons, no spin, no charge, no secondary emission, no evaporation.</li>
        <li><strong>This is reproduction, not discovery.</strong> Page did it fifty years ago and the physics has been standard ever since. The point was to own the number instead of citing it.</li>
      </ul>

      <h2>The transferable part</h2>

      <p>The physics here is fifty years old. The method is not, and it is the same one behind the linters:</p>

      <ul>
        <li><strong>Test against limits you cannot fit.</strong> An analytic value the code has never seen is worth more than a hundred plausible-looking outputs.</li>
        <li><strong>Keep a monitor you never optimise.</strong> Flux conservation found a real bug that the answer itself concealed.</li>
        <li><strong>When a check fails, diagnose before you retune.</strong> Measure the scaling. Find out whether it is failing or inapplicable. Those are different, and only one is fixed by changing a threshold.</li>
        <li><strong>Read the primary source.</strong> A number you have not checked is not evidence, no matter how many digits it carries.</li>
      </ul>

      <p>One file, one command, no external physics code and no scipy — quadrature, root-finding and the series recursion are all hand-rolled. It runs in about three minutes and prints every number above.</p>

      <p><em>Related: <a href="/trainproof/">loss curves lie</a> and <a href="/eos-collision/">one integer that deleted my stop token</a> — the same lesson where a validation set does exist. Primary reference: D. N. Page, Phys. Rev. D <strong>13</strong>, 198 (1976).</em></p>
    </article>
  );
};
