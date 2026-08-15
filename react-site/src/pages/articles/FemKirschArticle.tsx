import React from 'react';

export const FemKirschArticle: React.FC = () => {
  return (
    <article>
      <h1>Ten Tests, Written Before the Code. The One That Failed Taught Me the Most</h1>
      <p><em>I wrote a finite element solver from nothing and pointed it at an answer known since 1898. It landed on 3.00002. Then a test I was sure would pass didn't, two explanations for why both collapsed, and a number the internet repeats confidently failed to reproduce.</em></p>
      <hr />

      <p>The last article in this series asked what it takes to believe your own output when there is no experiment to check against. A black hole will not email you its spectrum.</p>

      <p>This one is the opposite situation, and it turns out to be just as instructive. Here the exact answer <em>is</em> known — has been since 1898 — so "did I get it right?" is trivially checkable. Which means the interesting question changes. It stops being <em>is the number right</em> and becomes <strong>what would have caught me if it weren't</strong>.</p>

      <p>So I did something I had not done before: I wrote the acceptance tests, with their pass thresholds, into an audit file <em>before writing a line of the solver</em>. Ten of them. Then I built the thing and ran them.</p>

      <p>Nine passed. This article is mostly about the tenth.</p>

      <h2>The problem, and the one rule</h2>

      <p>Stretch a plate with a circular hole in it. The stress at the edge of the hole is exactly <strong>three times</strong> the stress far away — independent of the material, independent of the hole size, independent of how hard you pull. Kirsch published it in 1898.</p>

      <p>The rule I set myself: <strong>the code is given the geometry, the elastic constants and the load, and never the number three.</strong></p>

      <p>That is easy to say and easy to cheat, so I made it checkable rather than asserted: grep the source for the target value and the only hits are a coefficient inside the analytic stress formula, a radius range in a sampling routine, and the comparison at the very bottom of the reporting block, after every number has already been computed. The mesher, the assembler, the solver and the stress recovery never see it.</p>

      <p>No FEA library. No scipy — it isn't installed on this machine, which removed the temptation at the source. The Delaunay mesher, the quadrature, the elements, the assembly, the linear solver and the error norms are all hand-written.</p>

      <h2>Three things that had to be built first</h2>

      <h3>The degenerate case was the common case</h3>

      <p>Delaunay triangulation by Bowyer–Watson has a well-known fragility: you insert a point, delete every triangle whose circumcircle contains it, and re-triangulate the cavity. If floating point marks one far-away triangle as "bad", the cavity stops being a simple polygon and the mesh is silently corrupt.</p>

      <p>Textbooks treat that as a rare accident. On this problem it is the <em>default</em>: <strong>every node on the hole boundary lies exactly on one circle</strong>, so exact co-circularity is the normal input, not the pathological one. The fix is to keep only the connected component of the bad set containing the seed triangle, which makes a non-simple cavity impossible however the ties break.</p>

      <p>And then not to trust that either. The empty-circumcircle property is <em>measured</em> on every finished mesh, after four rounds of smoothing and re-triangulation. Worst violation across all five refinement levels: exactly zero.</p>

      <h3>Quadrature you construct instead of remember</h3>

      <p>Two earlier experiments of mine were bitten by constants recalled from memory rather than read from a source. A hard-coded symmetric quadrature rule for triangles is exactly that kind of constant — seven points and weights you copy from somewhere and never verify.</p>

      <p>So the rules are <em>built</em>: tensor-product Gauss–Legendre nodes mapped onto the triangle through the Duffy transform, then verified against the exact monomial integral.</p>

      <pre><code>{`integral over T of xi^p eta^q dA  =  p! q! / (p+q+2)!

worst relative error: 4.6e-15`}</code></pre>

      <h3>A solver checked against a different solver</h3>

      <p>The production path is a hand-rolled Jacobi-preconditioned conjugate gradient. On the coarsest mesh it agrees with a dense direct factorisation to <strong>5e-14</strong>. Two independent methods, same answer. The largest system in the study is 21,220 degrees of freedom.</p>

      <p><img src="/fem-mesh-stress.png" alt="Left: the generated triangular mesh around a quarter of a circular hole, with elements graded so they grow with distance from the hole. Right: the computed axial stress field on the same domain, brightest at the hole crown where the stress concentrates and darkest at the pole where the plate is in compression." style={{ maxWidth: '100%', height: 'auto' }} /></p>

      <p>The mesh is graded so element size grows linearly with distance from the hole — neighbouring elements differ by a fixed ratio, so there are no size jumps, and refining scales a single number. On the right, the stress: bright at the crown where it reaches three, dark at the pole where a plate being <em>pulled apart</em> is in compression.</p>

      <h2>The test that was wrong, not the code</h2>

      <p>Before the interesting failure, a boring one that is worth more than it looks.</p>

      <p>The patch test is the classical FEM sanity check: prescribe an exact polynomial displacement field on the boundary and the interior must reproduce it to round-off. I wrote one with an arbitrary quadratic field, ran it, and got an error of <strong>8%</strong>.</p>

      <p>My first instinct was that the quadratic elements were broken. They weren't. <strong>A patch-test field has to be an actual solution of the equations you are solving</strong>, and an arbitrary quadratic displacement produces a linear stress whose divergence is a non-zero constant — it needs a body force that isn't there. I was asking the solver to reproduce something that is not the answer, and it correctly refused.</p>

      <p>Imposing equilibrium pins the field almost completely:</p>

      <pre><code>{`u = ( alpha x^2 ,  alpha q x y )    with   q = -4/(1+nu)`}</code></pre>

      <p>With that, it passes at 2e-14. The lesson is not about elasticity. It is that a failing test is a claim about <em>two</em> things, and the one you didn't write carefully is usually the test.</p>

      <h2>The gate that failed</h2>

      <p>Now the one I actually wrote this article for.</p>

      <p>A curved boundary approximated by straight element edges is a classical "variational crime" — the domain you compute on is not the domain you meant. The standard remedy is to curve the elements, pushing mid-side nodes out onto the true circle. The standard claim is that skipping it costs you convergence order.</p>

      <p>So I ran the quadratic elements twice, once curved and once with the hole deliberately faceted, to <em>measure</em> the cost instead of citing it. The prediction I registered in advance was deliberately weak — only that the energy-norm rate must drop by at least 0.25 — because the specific figure usually quoted for the loss came from a search summary rather than a paper I had opened, and I don't accept numbers on that basis.</p>

      <table>
        <thead>
          <tr><th>Run</th><th>L2 order</th><th>Energy order</th></tr>
        </thead>
        <tbody>
          <tr><td>Quadratic, curved hole</td><td>3.249</td><td>2.013</td></tr>
          <tr><td>Quadratic, faceted hole</td><td>2.045</td><td>2.031</td></tr>
          <tr><td><strong>Order lost</strong></td><td><strong>1.204</strong></td><td><strong>−0.018</strong></td></tr>
        </tbody>
      </table>

      <p>The crime costs <strong>a full order in L2 and nothing whatsoever in the energy norm</strong>. My gate asked about the energy norm. It failed.</p>

      <p>I had two explanations ready, and <strong>both of them died</strong>.</p>

      <p><strong>That the global norm was hiding it.</strong> A graded mesh has far more elements out in the flat far field than around the hole, so a local error could plausibly be averaged away. Refuted: restricted to the ring around the hole where the crime actually happens, the energy rates are 1.992 curved against 2.014 faceted. No degradation there either.</p>

      <p><strong>That the loss is a Dirichlet phenomenon</strong>, since both curved boundaries here carry Neumann data. Refuted: re-running with the exact displacement prescribed on the curved outer boundary instead of a traction moves the answer by 0.001 of an order.</p>

      <p>What survives is arithmetic, and it fits every number measured. The faceted domain perturbs the displacement at order <code>h^2</code>. That is <em>worse</em> than the <code>h^3</code> the L2 error would otherwise reach, so it dominates and caps L2 at two. It is <em>the same order</em> as the <code>h^2</code> energy error, so it changes only the constant — and the faceted energy error is indeed 5–7% larger at every level, on an identical slope.</p>

      <p>Whether the widely quoted figure is wrong, or is right for a configuration I did not test, <strong>cannot be settled from here, and I am not settling it.</strong> I never opened the paper. That is precisely why the gate demanded a measurement instead of predicting a value — and why the honest output of this experiment is a measured number plus an admission, rather than a confirmation.</p>

      <h2>What the nine passing gates bought</h2>

      <p><img src="/fem-convergence.png" alt="Three panels. Left: log-log convergence of L2 and energy-norm errors against element size, with dotted reference slopes for h, h squared and h cubed. Middle: the stress concentration factor against element size, the quadratic elements rising toward three while the linear elements overshoot. Right: hoop stress around the hole against angle, the computed points lying on the analytic curve from minus one at the pole to plus three at the crown." style={{ maxWidth: '100%', height: 'auto' }} /></p>

      <p>The concentration factor comes out at <strong>3.00002</strong> against an exact 3 — an error of 0.0005% — on a domain where the analytic field is the exact solution. A second, independent route, a finite plate extrapolated to zero width, gives <strong>2.99970</strong>.</p>

      <p>But the number is the least interesting result. Anyone can tune until one value matches. What cannot be faked is the <em>rate</em>: linear elements converge at 2.026 and 1.019 against a theoretical 2 and 1; quadratic elements at 3.249 and 2.013 against a theoretical 3 and 2. Two element families, four independent slopes, all landing on values the theory fixed in advance.</p>

      <p>And one more piece of self-criticism that nobody forced: the quadratic L2 rate cleared its band by 0.001. A two-sided band was the wrong shape for a one-sided theorem, and that gate would have failed on a coarser mesh family. That is a flaw in the gate, not the code, and it is in the record.</p>

      <h2>What this is not</h2>

      <p>It is not new. Kirsch solved this in 1898, the convergence theory is textbook, and the plate-with-a-hole ships as a worked demo inside commercial FEA software. The literature audit that established all of that was written before any code and closed the project as research on its first page.</p>

      <p>What was left is the only claim I make: <strong>implemented from first principles, and validated against analytic limits it was never fitted to.</strong></p>

      <p>It is also plane stress only, one geometry, one load case, static, small strain, two dimensions. The stress recovery is plain area-weighted nodal averaging, and the linear elements show no clean convergence order at the hole — which I have not fully explained. And I never read Kirsch's 1898 paper: the stress field came from a secondary source and the displacement field I derived myself, both checked numerically before being used as a ruler.</p>

      <h2>Reproduce it</h2>

      <p>One file, one command, about fifty seconds: <code>python fem_003.py</code>. It prints all ten gate results and writes its own evidence — the full gate log, convergence tables, hoop-stress data and both figures above. The archive, including the pre-registered audit, is deposited at <a href="https://doi.org/10.5281/zenodo.21892064" target="_blank" rel="noopener">doi.org/10.5281/zenodo.21892064</a>.</p>

      <p>If you take one thing from this: writing the tests down first cost me an afternoon and bought me the only genuinely interesting result in the project. A gate you write after seeing the number is not a gate. It is a description.</p>
    </article>
  );
};
