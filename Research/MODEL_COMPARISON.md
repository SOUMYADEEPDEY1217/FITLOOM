# FITLOOM — VTON Model Comparison

> **Status:** Desk research / selection guide. No local benchmark has been run yet.  
> **Decision goal:** Select a model for a reproducible standalone FITLOOM VTON demo, without changing the existing frontend.

## 1. Executive summary

This document compares four image-based virtual try-on (VTON) research implementations:

- **IDM-VTON** — strong first candidate to test for authentic garment-conditioned try-on.
- **CatVTON** — particularly interesting when GPU memory and simpler inference are important.
- **OOTDiffusion** — useful comparison candidate with half-body and full-body model variants.
- **StableVITON** — relevant semantic-correspondence baseline, but its older dependency stack may increase setup effort.

**Initial recommendation:** Start by reproducing IDM-VTON as the quality baseline, then test CatVTON as the efficiency comparison. Add OOTDiffusion and StableVITON if time and hardware allow. This is a test order, not a claim that IDM-VTON has already won.

**Commercial-use warning:** The official repositories/model cards reviewed for these candidates identify CC BY-NC-SA 4.0 licensing. This is a non-commercial licence. Do not assume these checkpoints can be used in a commercial FITLOOM product. Re-check the exact code, checkpoint, base-model and dataset terms before any deployment.

## 2. What is being compared?

A VTON model receives:

1. A **person image** — the person whose appearance should be retained.
2. A **garment image** — the clothing item to transfer onto the person.

It generates a new image showing the person apparently wearing the garment.

This is a visual rendering task, not a physical fit calculation. It cannot establish garment measurements, comfort, fabric stretch or actual size fit. FITLOOM should keep the 3D Fit Engine and 2D VTON responsibilities separate.

## 3. Side-by-side comparison

| Criterion | IDM-VTON | CatVTON | OOTDiffusion | StableVITON |
|---|---|---|---|---|
| Main approach | Diffusion-based virtual try-on with garment/person conditioning | Simplified concatenation-based diffusion VTON | Outfitting-fusion latent diffusion | Semantic correspondence with latent diffusion |
| Research release | ECCV 2024 paper / official implementation | ICLR 2025 paper / official implementation | AAAI 2025 paper / official implementation | CVPR 2024 paper / official implementation |
| Key strength to investigate | Authenticity and garment conditioning | Lightweight design and inference efficiency | Separate half-body and full-body model paths | Explicit semantic correspondence and garment/person alignment |
| Hardware evidence in official materials | CUDA/GPU workflow; exact minimum VRAM should be measured locally | Authors report inference below 8 GB VRAM at 1024×768; validate on the exact setup | Official project acknowledges A100 GPU support; do not treat this as a minimum requirement | CUDA-oriented setup and batch inference examples; no universal minimum VRAM stated |
| Preprocessing | Requires supporting human parsing / DensePose / pose-related assets in the provided workflow | Demo workflow uses human parsing and DensePose for mask generation | Uses human parsing and OpenPose-related assets; garment category is specified for full-body path | Uses DensePose and agnostic masks; arbitrary-image preprocessing may need additional segmentation |
| Practical setup concern | Multiple checkpoints and preprocessing components | May offer a comparatively simpler inference pipeline, but still has dependencies | Linux-focused setup in official README; category/model selection matters | Older pinned package versions and preprocessing requirements may complicate environment setup |
| Garment-detail test priority | Print, texture, collar, sleeves | Print, texture, boundaries and identity retention | Sleeve/garment boundaries and category handling | Alignment, garment boundaries and preservation of unmasked regions |
| Current FITLOOM status | Not connected to live FITLOOM inference | Not connected | Not connected | Not connected |

The strengths above describe what to investigate based on each project's stated design. They are not measured quality rankings.

## 4. Candidate-by-candidate notes

### 4.1 IDM-VTON

**Paper / project:** *Improving Diffusion Models for Authentic Virtual Try-on in the Wild*.

- Official implementation: https://github.com/yisol/IDM-VTON
- Paper: https://arxiv.org/abs/2403.05139
- The repository documents a local Gradio demo and a workflow using supporting assets such as DensePose, human parsing and OpenPose-related checkpoints.
- The project acknowledges components from OOTDiffusion, DCI-VTON, IP-Adapter and human-parsing tools.
- Official repository states that code and checkpoints are under **CC BY-NC-SA 4.0**.

**Why test it:** It is a reasonable quality-first baseline for FITLOOM's garment-conditioned visual preview.

**What to measure:** Whether fine prints, logos, texture, collar shape and sleeve details survive; how well the person's identity is retained; setup time; peak VRAM; end-to-end latency.

**Risks / checks:** The workflow depends on more than one model asset. Confirm every dependency and checkpoint's licence, not just the top-level repository licence.

### 4.2 CatVTON

**Paper / project:** *CatVTON: Concatenation Is All You Need for Virtual Try-On with Diffusion Models*.

- Official implementation: https://github.com/Zheng-Chong/CatVTON
- Paper: https://arxiv.org/abs/2407.15886
- The authors describe a network with 899.06M total parameters and 49.57M trainable parameters.
- The authors report simplified inference using **less than 8 GB VRAM at 1024×768**. Treat this as an author-reported result, not a guarantee for every GPU, precision, software version or UI.
- The official demo workflow uses SCHP human parsing and DensePose to generate masks.
- Official repository states that code, checkpoints and demo are under **CC BY-NC-SA 4.0**.

**Why test it:** It is a strong efficiency candidate and could be easier to run on a smaller GPU budget.

**What to measure:** Verify the reported VRAM on the team's hardware; compare visual quality against IDM-VTON using identical inputs; inspect pattern preservation and person identity.

**Risks / checks:** The non-commercial licence is a blocker for commercial use unless separate permission or a different appropriately licensed model is obtained.

### 4.3 OOTDiffusion

**Paper / project:** *OOTDiffusion: Outfitting Fusion based Latent Diffusion for Controllable Virtual Try-on*.

- Official implementation: https://github.com/levihsu/OOTDiffusion
- Paper: https://arxiv.org/abs/2403.01779
- The repository provides half-body and DressCode/full-body model paths.
- The full-body inference path requires a garment category: upper body, lower body or dress.
- The official README says the authors tested the code and models on Ubuntu 22.04 and documents a Python 3.10 environment.
- The official Hugging Face model card identifies **CC BY-NC-SA 4.0**.

**Why test it:** It provides a useful comparison for garment category handling and half-body versus full-body use cases.

**What to measure:** Whether category-specific inference works reliably; garment boundary quality; sleeve and neckline consistency; output quality on the same test set; setup and runtime cost.

**Risks / checks:** Its documented environment may require careful dependency pinning. The model card's licence and all linked asset terms must be checked before use.

### 4.4 StableVITON

**Paper / project:** *StableVITON: Learning Semantic Correspondence with Latent Diffusion Model for Virtual Try-On*.

- Official implementation: https://github.com/rlawjdghek/StableVITON
- Paper: https://arxiv.org/abs/2312.01725
- The repository provides inference code and VITON-HD checkpoint instructions.
- Its documented pipeline uses DensePose and agnostic masks. The README notes that arbitrary images may require segmentation tooling and recommends matching the DensePose model used in the benchmark setup.
- The documented environment uses older pinned versions of PyTorch, Diffusers and related libraries.
- Official repository states **CC BY-NC-SA 4.0**.

**Why test it:** It is a useful research baseline for semantic alignment between the person and garment.

**What to measure:** Garment alignment, preservation of unmasked person regions, edge artefacts and performance on non-benchmark photographs.

**Risks / checks:** Older dependencies may make setup and maintenance harder. Its benchmark preprocessing assumptions may not transfer directly to arbitrary user-uploaded images.

## 5. Hardware and speed comparison — what is known vs unknown

| Model | Public hardware information found | What FITLOOM must measure |
|---|---|---|
| IDM-VTON | Official instructions use a CUDA/GPU workflow and provide a Gradio demo; no single minimum VRAM figure should be assumed | Peak VRAM, load time, warm inference time, resolution limits and failures |
| CatVTON | Authors report under 8 GB VRAM for 1024×768 inference | Reproduce on the actual GPU and record precision, peak allocation and latency |
| OOTDiffusion | Official project acknowledges A100 GPU support for its demo; this does not define the minimum GPU | Peak VRAM for half-body and full-body modes, latency and memory-saving options |
| StableVITON | Official inference examples use CUDA and expose batch-size configuration; no universal minimum VRAM figure stated | Peak VRAM at batch size 1, latency and compatibility with the team's current CUDA stack |

### Benchmark protocol

For a fair comparison:

1. Use one fixed test set of person/garment pairs.
2. Use the same image resolution where all models support it.
3. Record the exact GPU model, VRAM, driver, CUDA, PyTorch and Python versions.
4. Record model loading time separately from inference time.
5. Warm up the model before timing; report first-run and warmed-up latency separately if useful.
6. Record peak GPU memory, output dimensions and failed runs.
7. Do not compare a batch-size-4 result against a batch-size-1 result as if they were equivalent.
8. Save the input pair, output, settings and run ID for every measurement.

No latency or memory figures should be filled in until they are measured on the team's hardware.

## 6. Garment preservation and visual quality test

Use the same controlled image pairs across the candidate models. Score each output from **1 (poor) to 5 (excellent)**.

| Attribute | Evaluation question |
|---|---|
| Main colour | Does the output retain the source garment's colour? |
| Print / pattern | Are stripes, checks, graphics, logos and their placement retained? |
| Texture | Does the material still look like the source fabric? |
| Collar / neckline | Is the original collar and neckline shape preserved? |
| Sleeves | Are sleeve length, cuffs and shape correct? |
| Silhouette | Does the garment retain its cut and overall proportions? |
| Boundaries | Are edges clean around neck, arms, hair and torso? |
| Person identity | Are face, hair, pose and non-garment details preserved? |
| Artefacts | Are there warped patterns, extra limbs, blur or unnatural textures? |

Suggested test categories:

- Plain light and dark tops.
- Striped, checked and graphic-print tops.
- Short-sleeve and long-sleeve garments.
- Different collars and necklines.
- Loose and fitted silhouettes.
- Different poses and arm positions.
- Partial occlusion from hands, hair or accessories.

Have at least two reviewers score a subset if possible. Keep examples of failures; a single average score can hide important garment-specific problems.

## 7. Licensing comparison

| Model | Licence stated by official source reviewed | Practical implication |
|---|---|---|
| IDM-VTON | CC BY-NC-SA 4.0 for code and checkpoints | Non-commercial restriction; not suitable for commercial product use without separate permission |
| CatVTON | CC BY-NC-SA 4.0 for materials, code, checkpoints and demo | Non-commercial restriction; not suitable for commercial product use without separate permission |
| OOTDiffusion | CC BY-NC-SA 4.0 on official model card | Non-commercial restriction; verify repository and every dependency/asset |
| StableVITON | CC BY-NC-SA 4.0 in official repository | Non-commercial restriction; verify base models, weights and dependencies |

**Important licensing notes:**

- CC BY-NC-SA 4.0 is not a commercial-use licence.
- Verify the exact licence file and checkpoint terms at the time of use; terms can change or differ between code and weights.
- Check base model licences (for example, the underlying Stable Diffusion model), datasets, human parsing models, pose models and third-party dependencies.
- Dataset access or research use does not automatically grant redistribution or commercial training rights.
- If FITLOOM is intended to become a commercial service, seek a model with suitable commercial terms or obtain written permission from the relevant rights holders. Legal review may be needed.

## 8. Weighted evaluation framework

After running the tests, score each model from 1 to 5 for each category. Multiply the score by the weight and divide by 5 to calculate weighted points.

| Category | Weight |
|---|---:|
| Garment detail preservation | 30% |
| Person identity and visual realism | 20% |
| Reliability across test images | 15% |
| VRAM / hardware efficiency | 10% |
| Inference speed | 10% |
| Setup and maintenance effort | 10% |
| Licence suitability for intended use | 5% |
| **Total** | **100%** |

**Licence gate:** The weighted score must not override a licence restriction. A model that is not permitted for the intended use must be treated as ineligible for that use, regardless of its visual score. The 5% licence weight is only useful for comparing eligible candidates; it is not permission to ignore non-commercial terms.

### Results table — fill after experiments

| Model | Garment fidelity /5 | Identity /5 | Reliability /5 | Efficiency /5 | Speed /5 | Setup /5 | Licence eligible? | Weighted score |
|---|---:|---:|---:|---:|---:|---:|---|---:|
| IDM-VTON | — | — | — | — | — | — | No for commercial use under stated NC terms; verify | Pending |
| CatVTON | — | — | — | — | — | — | No for commercial use under stated NC terms; verify | Pending |
| OOTDiffusion | — | — | — | — | — | — | No for commercial use under stated NC terms; verify | Pending |
| StableVITON | — | — | — | — | — | — | No for commercial use under stated NC terms; verify | Pending |

## 9. Recommended FITLOOM experiment order

1. **Check hardware first.** Record GPU model, available VRAM, OS and CUDA/PyTorch environment.
2. **Run IDM-VTON baseline.** Follow the official setup and successfully generate one result from a person/garment pair.
3. **Run CatVTON next.** Compare quality and memory against the same input pairs.
4. **Add OOTDiffusion.** Test half-body and full-body/category paths if relevant to the demo scope.
5. **Add StableVITON if feasible.** Allow extra time for older dependencies and preprocessing.
6. **Build the standalone interface.** Use Gradio or Streamlit only after at least one model inference path works.
7. **Write the recommendation.** Base it on recorded results, hardware and intended licensing—not paper claims alone.

## 10. Decision for the current research phase

**First model to reproduce:** IDM-VTON, as the initial quality baseline.

**Second model to reproduce:** CatVTON, as the efficiency comparison.

**Additional candidates:** OOTDiffusion and StableVITON, subject to available time and GPU resources.

**Commercial deployment decision:** None of the four should be treated as cleared for commercial FITLOOM use based on the CC BY-NC-SA 4.0 terms identified in the official sources reviewed. Investigate separate permissions or alternative commercially licensed models before product deployment.

This is a provisional experiment plan. The final winner can only be selected after controlled tests and a licence review.

## 11. Sources

- [IDM-VTON official GitHub repository](https://github.com/yisol/IDM-VTON)
- [IDM-VTON paper](https://arxiv.org/abs/2403.05139)
- [CatVTON official GitHub repository](https://github.com/Zheng-Chong/CatVTON)
- [CatVTON paper](https://arxiv.org/abs/2407.15886)
- [OOTDiffusion official GitHub repository](https://github.com/levihsu/OOTDiffusion)
- [OOTDiffusion model card](https://huggingface.co/levihsu/OOTDiffusion)
- [OOTDiffusion paper](https://arxiv.org/abs/2403.01779)
- [StableVITON official GitHub repository](https://github.com/rlawjdghek/StableVITON)
- [StableVITON paper](https://arxiv.org/abs/2312.01725)
- [Creative Commons BY-NC-SA 4.0 legal code](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode)

> **Research integrity note:** The architecture descriptions and licence notes above are based on the linked project materials. No FITLOOM-side benchmark, successful local inference, measured GPU requirement or measured latency is claimed here. Re-check official terms and run the proposed experiments before making implementation or deployment decisions.
