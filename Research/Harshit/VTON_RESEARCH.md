# FITLOOM — Virtual Try-On (VTON) Research

> **Status:** Research plan; experiments and benchmarks are pending.  
> **Scope:** Evaluate image-based virtual try-on models and build a standalone demo without modifying the existing FITLOOM frontend.

## 1. Purpose

FITLOOM addresses two separate questions in online fashion shopping:

- **Physical fit:** Will the garment fit the customer's body? This is handled by the 3D Fit Engine.
- **Visual appearance:** How might the garment look when worn? This is handled by the 2D Virtual Try-On (VTON) module.

A VTON model takes a person image and a garment/product image and generates a synthesized preview of the person wearing that garment.

**Important:** A generated try-on image is a visual simulation. It does not prove that the garment will physically fit and must not replace measurement-based fit analysis.

## 2. Research objectives

1. Study established image-based virtual try-on approaches.
2. Compare IDM-VTON with alternatives such as CatVTON, OOTDiffusion and StableVITON.
3. Validate the person-image + garment-image input pipeline.
4. Evaluate preservation of garment colour, print, texture, collar, sleeves and silhouette.
5. Record hardware requirements, VRAM use, inference latency and model/weight licensing.
6. Build an independent demo to validate the selected approach before any future FITLOOM integration.

## 3. Candidate models

These are candidates for investigation, not a claim that one model has already been selected. Results depend on the checkpoint, input resolution, preprocessing, GPU and configuration.

| Model | Research focus | Questions to verify |
|---|---|---|
| **IDM-VTON** | Image-based try-on with garment and person conditioning | Does it preserve fine garment details? What preprocessing is required? What are the code and checkpoint terms? |
| **CatVTON** | A comparatively compact virtual try-on pipeline | What quality/memory trade-offs appear on our test set? How does it handle varied poses and garment categories? |
| **OOTDiffusion** | Diffusion-based outfit/garment transfer | How consistent are sleeves, collar, print and garment boundaries? What is the practical inference cost? |
| **StableVITON** | Latent-diffusion-based virtual try-on research | How does it compare on garment fidelity, person identity and setup complexity? |

### Fair comparison principles

- Use the same person/garment test pairs wherever each model supports the same task.
- Keep resolution and evaluation conditions as comparable as possible.
- Record model version, checkpoint, configuration, hardware and preprocessing for every run.
- Separate visual quality from speed and deployment practicality.
- Do not assume a repository's default checkpoint, license or reported benchmark applies to every redistributed weight file.

## 4. Input and output pipeline

Expected high-level flow:

1. **Person image:** Upload a clear, well-lit image showing the person and relevant body region.
2. **Garment image:** Upload a clear product image of the target clothing item.
3. **Validation:** Check file type, dimensions, readability and required input pairing.
4. **Preprocessing:** Apply the selected model's required resizing, normalization, human parsing, pose estimation or mask generation. These steps are model-specific.
5. **Inference:** Pass the prepared inputs to the selected VTON checkpoint.
6. **Post-processing:** Convert the generated result into a displayable image and handle model errors.
7. **Output:** Preview and optionally download the generated try-on image.

Keep the original uploaded inputs for comparison. Do not silently substitute unrelated sample images when inference fails.

## 5. Garment-preservation evaluation

A convincing result should retain the identity and important visual details of the supplied garment, not merely generate a similar-looking item.

| Attribute | What to inspect |
|---|---|
| Colour | Is the main colour and colour distribution consistent with the source garment? |
| Print / pattern | Are logos, stripes, checks, graphics and pattern placement retained? |
| Texture | Is visible fabric texture preserved rather than replaced with an invented material? |
| Collar / neckline | Is the collar type and neckline shape maintained? |
| Sleeves | Are sleeve length, shape and cuffs consistent? |
| Silhouette | Does the garment retain its overall cut and visible proportions? |
| Boundaries | Are garment edges clean around arms, neck, hair and torso? |
| Person identity | Are face, hair, pose and other non-garment details retained? |
| Occlusion | Are hands, arms, hair and accessories handled plausibly? |

### Suggested test matrix

Test multiple garment categories rather than relying on one easy example:

- Plain light and dark tops.
- Printed, striped and checked tops.
- Short-sleeve and long-sleeve garments.
- Different collar and neckline types.
- Loose and fitted silhouettes.
- Different body poses and arm positions.
- Partial occlusion, such as hair or hands covering part of the garment.

Use consented images or appropriately licensed public research samples. Do not use private personal photos without permission.

### Scoring rubric

For each result, assign a human review score from **1 (poor) to 5 (excellent)** for colour fidelity, pattern/print fidelity, texture fidelity, collar and sleeve fidelity, garment-shape fidelity, person-identity preservation and visual artefacts.

Record notes and failure examples alongside scores. Report results by attribute and garment category; do not hide difficult examples behind one overall score. If possible, have two reviewers independently score a subset.

## 6. Performance and hardware benchmark

Record the following for every model/checkpoint:

| Metric | What to record |
|---|---|
| GPU | Exact GPU model |
| VRAM | Total VRAM and peak allocated VRAM, if measurable |
| System | OS, Python, CUDA and key framework versions |
| Input size | Person and garment image dimensions |
| Inference time | Time per result; state whether preprocessing/model loading is included |
| Warm-up | First-run or warmed-up timing |
| Memory behaviour | CPU offload, reduced precision or other memory-saving options |
| Reliability | Successful runs / attempted runs and common errors |

Do not publish an inference-time claim without its hardware, image size, settings and timing method. Measure model loading separately from per-image inference where practical. Diffusion-based VTON may be impractically slow on CPU-only hardware.

## 7. Licensing and responsible use

Before selecting a model, inspect and record the terms for each of the following:

1. Source-code repository license.
2. Model checkpoint / weight license and download terms.
3. Training dataset license and usage restrictions, where documented.
4. Third-party dependencies with separate terms.
5. Commercial-use permission, attribution, redistribution rules and hosted-inference restrictions.

A public GitHub repository does **not** automatically mean its weights or datasets are free for commercial use. Do not deploy a model in a commercial FITLOOM workflow until the relevant terms have been reviewed.

Also document image retention, access control and deletion behaviour for uploaded person images. Use only images for which the team has permission to run experiments.

## 8. Standalone demo plan

Build the research demo separately from the existing FITLOOM application.

```text
FITLOOM/
├── ...                    # Existing application; leave unchanged
└── vton-research/
    ├── app.py             # Gradio or Streamlit interface
    ├── requirements.txt
    ├── README.md
    ├── models/            # Setup notes; avoid committing large weights
    ├── utils/
    │   ├── preprocessing.py
    │   └── inference.py
    ├── samples/
    └── outputs/           # Local outputs; do not commit private images
```

### Minimum demo features

- Person image upload.
- Garment image upload.
- Preview of both input images.
- Generate button and visible progress/loading state.
- Generated result preview.
- Download option for the result.
- Clear validation and inference error messages.
- Model name, checkpoint/version and run settings shown with the result.

### Suggested implementation sequence

1. Confirm the available GPU and software environment.
2. Choose one candidate (IDM-VTON is a reasonable first baseline to investigate).
3. Follow its official setup instructions and verify code/weight terms.
4. Run one official example before building the UI.
5. Run the same controlled input pairs and save outputs.
6. Wrap the working inference path in a small Gradio or Streamlit app.
7. Add other candidates only after the baseline pipeline is reproducible.
8. Summarize results and recommend a model based on quality, performance, licensing and maintainability.

## 9. FITLOOM integration boundary

This research demo is independent. Do not modify the existing Next.js frontend as part of this task.

The project's current documentation describes the Try-On experience as a simulated/mock preview and indicates that live IDM-VTON inference is not yet connected. The standalone demo is intended to validate real inference separately. Any later integration should be a separately planned change with clear API, storage, privacy and error-handling decisions.

Proposed future integration flow:

```text
FITLOOM UI
   |
   | person image + garment image
   v
Backend upload / validation
   |
   v
VTON inference service
   |
   v
Generated image storage
   |
   v
FITLOOM result preview
```

This is a proposed architecture, not a claim that the live integration exists.

## 10. Research log

Update this table after each experiment. Leave unknown values blank rather than estimating them.

| Date | Model / checkpoint | Test set | GPU | Resolution | Avg. inference time | VRAM | Key observations |
|---|---|---|---|---|---|---|---|
| — | Not tested yet | — | — | — | — | — | Baseline experiments pending |

### Per-run record template

- **Run ID:**
- **Date:**
- **Model and checkpoint:**
- **Code / weight source:**
- **License reviewed:**
- **GPU and VRAM:**
- **Software versions:**
- **Person image ID:**
- **Garment image ID / category:**
- **Input resolution:**
- **Preprocessing settings:**
- **Inference settings:**
- **Model loading time:**
- **Inference time:**
- **Peak VRAM:**
- **Output file:**
- **Preservation scores:**
- **Failure notes:**

## 11. Definition of done

- [ ] At least one candidate produces a reproducible result from a person image and a garment image.
- [ ] A controlled test set covers multiple garment types and visual details.
- [ ] Garment preservation and person-identity results are documented with examples.
- [ ] GPU, VRAM and inference-time measurements include test conditions.
- [ ] Code, weights and dataset licensing have been checked and recorded.
- [ ] A standalone demo supports upload, generation, preview and error handling.
- [ ] The existing FITLOOM frontend remains unchanged.
- [ ] Findings and a reasoned model recommendation are documented.

## 12. Starting references

- [IDM-VTON — GitHub](https://github.com/yisol/IDM-VTON)
- [CatVTON — GitHub](https://github.com/Zheng-Chong/CatVTON)
- [OOTDiffusion — GitHub](https://github.com/levihsu/OOTDiffusion)
- [StableVITON — GitHub](https://github.com/rlawjdghek/StableVITON)

> **Research integrity note:** Candidate descriptions are starting points for investigation. No comparative benchmark, license clearance, GPU measurement or successful inference run is claimed in this document. Replace pending statements with measured results only after running and recording the experiments.
