# VTON Performance Analysis

## 1. Purpose

This document defines how FITLOOM will measure and compare the runtime performance of Virtual Try-On (VTON) models.

The goal is to identify a model and inference setup that can generate useful try-on previews with acceptable latency, GPU memory use, reliability, and operating cost.

**Important status note:** This document is a benchmark plan and reporting template. It does not claim that FITLOOM has completed model benchmarks or measured inference times. Add measured results only after running the experiments on documented hardware and software.

## 2. Scope

The performance evaluation focuses on:

- IDM-VTON
- CatVTON
- OOTDiffusion
- StableVITON

The evaluation covers the standalone research/demo pipeline. It does not require changes to the existing FITLOOM frontend.

## 3. Performance metrics

| Metric | What it measures | Why it matters |
|---|---|---|
| Model load time | Time from process start to model ready | Affects cold starts and server startup |
| Preprocessing time | Time for resizing, parsing, pose/mask preparation and other input steps | Reveals overhead outside the model |
| Inference time | Time spent generating the try-on result | Main measure of generation speed |
| Postprocessing time | Time to convert and save the generated image | Affects total user wait |
| End-to-end latency | Upload received to result ready | Best approximation of user-perceived wait |
| Peak GPU memory | Maximum GPU VRAM used during a run | Determines which GPUs can run the model |
| Peak system RAM | Maximum host memory used | Important for deployment stability |
| Throughput | Completed jobs per minute under a defined load | Useful for multi-user capacity planning |
| Failure rate | Failed or unusable runs divided by total runs | Measures reliability |
| Output resolution | Resolution used for the generated result | Speed and quality depend on resolution |

Report both the median and the 90th percentile (P90) latency where enough runs are available. Averages alone can hide occasional slow runs.

## 4. Test environment

Record the exact environment for every benchmark session.

| Environment field | Value to record |
|---|---|
| Date and time | |
| Model name and version/commit | |
| Checkpoint source and revision | |
| GPU model | |
| GPU VRAM | |
| Driver version | |
| CUDA version | |
| Operating system | |
| Python version | |
| PyTorch version | |
| Diffusers version, if used | |
| Input resolution | |
| Output resolution | |
| Precision (FP32 / FP16 / BF16) | |
| Batch size | |
| Number of warm-up runs | |
| Number of measured runs | |

Do not compare results from different hardware or configurations as if they were directly equivalent. If environments differ, clearly label the difference.

## 5. Benchmark procedure

Use the same test images and equivalent settings for every model wherever the model's input requirements allow.

1. Select a fixed set of person photographs and garment product images.
2. Record image dimensions, file formats, and garment categories.
3. Start a fresh process and measure model loading time.
4. Run warm-up generations. Do not include warm-up runs in the main latency statistics.
5. Run each test pair multiple times using the same settings.
6. Measure preprocessing, inference, postprocessing, and total elapsed time separately.
7. Record peak GPU memory and peak system RAM.
8. Save every output and record failures, warnings, and out-of-memory errors.
9. Repeat the test if a run is interrupted by unrelated system activity.
10. Keep the hardware, model revision, input set, and settings in the report.

For reliable GPU timing, synchronize the GPU immediately before starting and after completing the measured GPU work. Use a monotonic clock for elapsed time. Reset peak GPU memory statistics before each measured run when supported.

## 6. Test dataset

Build a small, repeatable evaluation set. Use consented or appropriately licensed images.

| Test ID | Person image | Garment category | Garment image | Challenge |
|---|---|---|---|---|
| P01 | Front-facing, full/upper body | Upper-body | Product image | Basic baseline |
| P02 | Front-facing, full body | Dress | Product image | Full garment |
| P03 | Arms partly occluded | Upper-body | Product image | Occlusion |
| P04 | Loose garment | Upper-body | Product image | Shape and sleeve preservation |
| P05 | Printed/patterned garment | Upper-body or dress | Product image | Print preservation |
| P06 | Dark garment | Upper-body | Product image | Colour and detail retention |
| P07 | Lower-body garment | Lower-body | Product image | Category support |
| P08 | Non-standard pose | Supported category | Product image | Pose robustness |

Use identical source images across models when possible. If a model requires a different crop, mask, or category label, document that preprocessing difference.

## 7. Results table

Fill this table only with measured values.

| Model | GPU | Input/output resolution | Model load (s) | Preprocess (s) | Inference (s) | Postprocess (s) | End-to-end (s) | Peak VRAM (GB) | Peak RAM (GB) | Success rate |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| IDM-VTON | | | | | | | | | | |
| CatVTON | | | | | | | | | | |
| OOTDiffusion | | | | | | | | | | |
| StableVITON | | | | | | | | | | |

### Per-run log

| Model | Test ID | Run | Preprocess (s) | Inference (s) | Postprocess (s) | Total (s) | Peak VRAM (GB) | Status / notes |
|---|---|---:|---:|---:|---:|---:|---:|---|
| | | 1 | | | | | | |
| | | 2 | | | | | | |
| | | 3 | | | | | | |

## 8. Quality must be considered alongside speed

A fast result is not automatically a good result. Review output quality using the same checklist for every model.

| Quality dimension | What to inspect |
|---|---|
| Garment identity | Does the output still resemble the input garment? |
| Colour | Is the original garment colour retained? |
| Print and pattern | Are logos, stripes, checks, and patterns preserved? |
| Collar and neckline | Are shape and placement maintained? |
| Sleeves | Are sleeve length, shape, and orientation plausible? |
| Texture | Are fabric details retained without excessive blur? |
| Garment boundaries | Are edges clean, with limited artifacts? |
| Person identity | Is the person's face and appearance reasonably preserved? |
| Body and pose | Are anatomy and pose distortions limited? |

Use a consistent rating scale, for example 1 (poor) to 5 (excellent), and keep written notes. If possible, have more than one reviewer assess anonymized outputs.

## 9. Interpreting the results

- **Latency:** Lower end-to-end latency generally gives a better user experience, but compare at the same output resolution and similar quality.
- **VRAM:** A model that exceeds the target GPU's memory cannot be deployed on that hardware without optimization or a different machine.
- **Throughput:** Single-user latency does not predict multi-user throughput. Test concurrent requests separately before estimating capacity.
- **Reliability:** Track out-of-memory errors, crashes, invalid outputs, and preprocessing failures.
- **Quality-speed trade-off:** Compare visual quality ratings with latency and memory use. Do not select a model on speed alone.
- **Cold versus warm runs:** Report model startup separately from generation time. A persistent inference worker can avoid repeated model loading.

## 10. Practical optimization options

Test optimizations one at a time and record their impact on both quality and performance.

- Use FP16 or BF16 where the model and GPU support it.
- Keep the model loaded in a persistent worker instead of reloading it for each request.
- Resize inputs to the model's recommended dimensions while preserving aspect ratio.
- Avoid unnecessary image conversions and repeated preprocessing.
- Use supported attention or memory-efficient inference options.
- Consider CPU offloading only when GPU memory is insufficient; it may increase latency.
- Consider lower resolution only after checking that garment details remain acceptable.
- Queue inference jobs rather than starting unlimited simultaneous GPU tasks.

Do not assume an optimization is beneficial until it has been measured on the target hardware.

## 11. Deployment considerations for FITLOOM

A practical integration should separate the web application from the GPU inference worker.

Suggested flow:

1. The user submits a person image and garment image.
2. The application validates file type, size, and required inputs.
3. Images are stored in private storage using controlled access.
4. The backend creates an inference job and returns a job identifier.
5. A GPU worker loads the selected VTON model and processes the job.
6. The worker stores the generated result and reports job status.
7. The frontend polls or receives a completion notification and displays the result.
8. Temporary files are deleted according to the application's retention policy.

For a real deployment, also evaluate queue wait time, concurrent-job limits, cold starts, GPU hourly cost, storage and bandwidth costs, privacy controls, and failure recovery.

## 12. Model-specific notes to verify

These are investigation points, not measured performance claims.

| Model | Performance questions |
|---|---|
| IDM-VTON | How much time and memory are used by its required preprocessing stages as well as generation? |
| CatVTON | Does its reported memory efficiency hold on the chosen GPU, resolution, and current implementation? |
| OOTDiffusion | How do its supported garment categories and inference paths affect runtime? |
| StableVITON | Do its dependency and preprocessing requirements add setup or runtime overhead? |

Published performance figures may use different GPUs, resolutions, software versions, and measurement methods. Treat them as reference points, not direct predictions for FITLOOM.

## 13. Licensing and operational constraints

Performance is only one selection criterion. Before using a model in a public or commercial FITLOOM service, verify the current licence for:

- Repository code
- Model checkpoints and weights
- Base models
- Training datasets, where relevant
- Human parsing, pose, and DensePose components
- Dependencies and third-party services

A repository being publicly accessible does not automatically grant commercial usage rights. The candidate projects listed in the research comparison have non-commercial/share-alike licence terms in their published materials; verify the exact current terms and obtain appropriate permission or choose a suitably licensed alternative before commercial deployment.

## 14. Decision framework

Use a weighted score only after collecting results. Suggested starting weights:

| Criterion | Suggested weight |
|---|---:|
| Visual quality and garment preservation | 35% |
| End-to-end latency | 20% |
| Peak GPU memory | 15% |
| Reliability / success rate | 15% |
| Deployment complexity | 10% |
| Operating cost | 5% |
| **Total** | **100%** |

Adjust the weights based on the target users and available infrastructure. A model with excellent quality but excessive latency or restrictive licensing may not be suitable for production.

## 15. Current conclusion

No winning model should be declared until the same evaluation set has been tested under documented conditions. The recommended next step is to establish one reproducible baseline run, then benchmark the other candidates using the same hardware and input set.

**Current benchmark status:** Pending measured experiments.

## 16. References

- IDM-VTON repository: https://github.com/yisol/IDM-VTON
- IDM-VTON paper: https://arxiv.org/abs/2403.05139
- CatVTON repository: https://github.com/Zheng-Chong/CatVTON
- CatVTON paper: https://arxiv.org/abs/2407.15886
- OOTDiffusion repository: https://github.com/levihsu/OOTDiffusion
- OOTDiffusion paper: https://arxiv.org/abs/2403.01779
- StableVITON repository: https://github.com/rlawjdghek/StableVITON
- StableVITON paper: https://arxiv.org/abs/2312.01725
