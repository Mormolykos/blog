import React from 'react';

export const HandWrittenKernelArticle: React.FC = () => {
  return (
    <article>
      <h1>I Wrote the Kernel. Then I Measured It, and at My Model's Shape It Was 1.67× Slower Than Doing Nothing.</h1>
      <p><em>A hand-written Triton LayerNorm against PyTorch eager and torch.compile, on one RTX 5080, at six batch sizes. Above roughly 4,096 rows the kernel wins on time and wins harder on memory — 1.36× faster at 65,536 rows using half the peak memory. Below it the kernel loses, and my model trains at 128 rows. The measurement cost less than the kernel would have, and it is the part worth keeping.</em></p>
      <hr />

      <p>I train a 24-layer decoder at <code>d_model</code> 1024 with a batch size of 1 and gradient accumulation of 8. Somewhere in that step there are a lot of LayerNorms, and the standard reflex is that a fused hand-written kernel beats whatever the framework does. So I wrote one in Triton and set out to find how much it bought.</p>

      <p>The honest answer turned out to be: less than nothing, at the only shape I actually run.</p>

      <h2>What counts as a baseline</h2>

      <p>Comparing a hand-written Triton kernel against PyTorch <em>eager</em> is not a fair fight and not an interesting one. <code>torch.compile</code> lowers to Triton through Inductor — it is generating the same class of kernel I just wrote by hand. So the only version of the question worth asking is <strong>can I beat torch.compile</strong>, and all three arms are reported throughout.</p>

      <p>Everything below is one machine on one day: <strong>RTX 5080 (sm_120), driver 610.47, CUDA 12.8, torch 2.11.0+cu128, triton 3.8.0</strong>, fp32, N = 1024, 60 repetitions per cell, median with inter-quartile range, L2 flushed between repetitions.</p>

      <p>Percentages of peak are a fraction of <em>this machine measured today</em>, not of a spec sheet:</p>

      <table>
        <thead>
          <tr><th>ceiling</th><th>measured</th></tr>
        </thead>
        <tbody>
          <tr><td>device-to-device copy</td><td><strong>814.2 GB/s</strong></td></tr>
          <tr><td>square matmul fp32</td><td>39.2 TFLOP/s</td></tr>
          <tr><td>square matmul bf16</td><td>118.6 TFLOP/s</td></tr>
        </tbody>
      </table>

      <h2>Forward: the kernel does not matter</h2>

      <table>
        <thead>
          <tr><th>rows</th><th>eager</th><th>compile</th><th>triton</th><th>best % of measured BW</th></tr>
        </thead>
        <tbody>
          <tr><td>128</td><td>0.0068 ms</td><td>0.0055</td><td><strong>0.0049</strong></td><td>26.5%</td></tr>
          <tr><td>512</td><td>0.0086</td><td><strong>0.0068</strong></td><td><strong>0.0068</strong></td><td>75.9%</td></tr>
          <tr><td>1024</td><td>0.0129</td><td><strong>0.0109</strong></td><td><strong>0.0109</strong></td><td>94.7%</td></tr>
          <tr><td>4096</td><td>0.0451</td><td><strong>0.0430</strong></td><td>0.0443</td><td>95.8%</td></tr>
          <tr><td>16384</td><td>0.1685</td><td><strong>0.1646</strong></td><td>0.1683</td><td>100.2%</td></tr>
          <tr><td>65536</td><td>0.6604</td><td><strong>0.6563</strong></td><td>0.6601</td><td>100.5%</td></tr>
        </tbody>
      </table>

      <p>At 65,536 rows the three arms are <strong>0.6563, 0.6601 and 0.6604 ms</strong> — a spread under one percent. They agree because none of them is the limiting factor. DRAM is. Above about 1,024 rows this kernel is saturated and there is nothing left to win by writing it better.</p>

      <p>Two cells read <em>above</em> 100% of the measured ceiling. That is not a kernel beating physics. It means my copy-based ceiling slightly under-estimates what a streaming read-plus-write can achieve, so at the top of the table the instrument is the limiting error term. I have recorded them as measured rather than clipping them to 100%, because clipping would hide exactly the thing that tells you the ceiling is approximate.</p>

      <h2>Backward: the kernel matters, and at small shapes it hurts</h2>

      <p>Forward plus backward, same conditions. Peak memory is the allocation attributable to the step.</p>

      <table>
        <thead>
          <tr><th>rows</th><th>eager</th><th>compile</th><th>triton</th><th>triton vs eager</th><th>eager peak</th><th>triton peak</th></tr>
        </thead>
        <tbody>
          <tr><td>128</td><td><strong>0.0150 ms</strong></td><td>0.0129</td><td>0.0251</td><td><strong>1.67× SLOWER</strong></td><td>1.0 MB</td><td>2.5 MB</td></tr>
          <tr><td>512</td><td><strong>0.0191</strong></td><td>0.0251</td><td>0.0353</td><td>1.85× slower</td><td>4.0 MB</td><td>4.0 MB</td></tr>
          <tr><td>1024</td><td><strong>0.0293</strong></td><td>0.0427</td><td>0.0525</td><td>1.79× slower</td><td>8.0 MB</td><td>6.0 MB</td></tr>
          <tr><td>4096</td><td>0.1318</td><td>0.1337</td><td><strong>0.1176</strong></td><td>1.12× faster</td><td>32.0 MB</td><td>18.0 MB</td></tr>
          <tr><td>16384</td><td>0.5659</td><td><strong>0.4322</strong></td><td>0.4388</td><td>1.29× faster</td><td>128.1 MB</td><td>66.1 MB</td></tr>
          <tr><td>65536</td><td>2.2319</td><td>1.7127</td><td><strong>1.6389</strong></td><td><strong>1.36× faster</strong></td><td>512.5 MB</td><td><strong>258.5 MB</strong></td></tr>
        </tbody>
      </table>

      <p><strong>The crossover is at roughly 4,096 rows.</strong> Below it the hand-written kernel is strictly worse: it launches two kernels instead of one and allocates lock and partial-gradient buffers, and at 128 rows that overhead <em>is</em> the entire runtime. Above it, it wins on time and wins harder on memory — at 65,536 rows it is 1.36× faster while using <strong>half the peak memory</strong> of eager, 258.5 MB against 512.5 MB.</p>

      <p>Memory is the axis usually left out of kernel benchmarks, and here it is the larger of the two effects.</p>

      <h2>Which column my model actually lives in</h2>

      <p>This is where the benchmark stops being a table and starts being a decision. My training config is <code>d_model</code> 1024, 24 layers, <strong>batch size 1</strong>, gradient accumulation 8. That puts every LayerNorm in the training step in the <strong>far-left column of both tables</strong> — the region where my hand-written kernel is 1.67× slower than doing nothing at all, and where every arm sits at 13–27% of the machine's bandwidth.</p>

      <p>Nothing at 128 rows is bandwidth-bound. The cost is kernel launch. So the correct optimisation at that shape is not a better kernel, it is <strong>fewer launches</strong> — CUDA graphs.</p>

      <p>That is consistent with, and explains, a result I had already measured separately on the inference side of the same model family: <strong>9.0×</strong>, 144.45 against 16.06 tokens/sec, from Inductor plus CUDA-graph compilation. Same machine, same shape regime, and the speedup came from removing launches rather than from any kernel being better.</p>

      <p><strong>So: do not hand-write this kernel for this model.</strong> I am keeping the measurement and throwing away the kernel, and the measurement is worth more than the kernel would have been.</p>

      <h2>Defects the instrument found in itself</h2>

      <p>Two, and both are in the record because a benchmark whose failures are invisible is not a benchmark.</p>

      <p><strong>The L2 flush scratch was billed to the first kernel measured.</strong> The 256 MB buffer used to cold-start the cache between repetitions was allocated lazily inside the first timed repetition, so whichever arm happened to run first was charged 256 MB of peak memory belonging to the harness. It is visible in the first forward run as <code>eager/fwd 128×1024 → 256.5 MB</code> against 0.5 MB for the two arms that followed. Fixed by allocating the scratch during ceiling measurement, before any kernel is timed.</p>

      <p><strong>One cell is unstable and I cannot explain it.</strong> <code>compile/fwd+bwd</code> at 1024×1024 returned a median of 0.0427 ms with an <strong>IQR of 0.0806 ms</strong> — a spread larger than the value — and a peak-memory reading of 0.0 MB. Every other cell in that column has an IQR under 0.01 ms. It is in the table as measured, and it <strong>should not be quoted as a number</strong> until somebody understands it.</p>

      <h2>What this is not</h2>

      <p><strong>The Triton kernels are not novel.</strong> Their structure follows the standard Triton fused-layer-norm tutorial, including the lock-based group accumulation for <code>dw</code> and <code>db</code>. That is stated in the source file too. What I am offering here is the measurement, not the kernel.</p>

      <p><strong>This experiment was not pre-registered.</strong> The prediction — "Triton will not win at batch 1" — was written into the runner's docstring before the first run, and the forward result matched it. But a docstring is editable and a frozen protocol is not, so that is weak evidence of intent and nothing stronger. I have pre-registered other work precisely because this distinction matters; I did not do it here, and I am not going to claim the credit for it retroactively.</p>

      <p><strong>One machine, one dtype (fp32), one width (N = 1024), one session.</strong> No claim is made about other cards, other dtypes, or other widths. <code>torch.compile</code> timings include no compilation cost, and warmup precedes every measurement.</p>

      <p>The generalisable part is not the numbers. It is the shape of the question: before writing a kernel, find out which column of the table your model actually sits in. Mine sat in the one where the answer was no.</p>
    </article>
  );
};
