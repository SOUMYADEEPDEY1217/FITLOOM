import numpy as np
import trimesh
from scipy.spatial import ConvexHull


def _slice_perimeter_cm(mesh, y, max_abs_x=None):
    segs = trimesh.intersections.mesh_plane(mesh, [0.0, 1.0, 0.0], [0.0, float(y), 0.0])
    if len(segs) == 0:
        return None
    pts = segs.reshape(-1, 3)
    if max_abs_x is not None:
        pts = pts[np.abs(pts[:, 0]) <= max_abs_x]
    if len(pts) < 6:
        return None
    pts_2d = pts[:, [0, 2]]
    hull = ConvexHull(pts_2d)
    ring = pts_2d[hull.vertices]
    perim_m = np.sum(np.linalg.norm(np.diff(np.vstack([ring, ring[0]]), axis=0), axis=1))
    return float(perim_m * 100.0)


def _band_stat(mesh, y_low, y_high, mode, max_abs_x=None, steps=9):
    vals = []
    for y in np.linspace(y_low, y_high, steps):
        p = _slice_perimeter_cm(mesh, y, max_abs_x=max_abs_x)
        if p is not None:
            vals.append(p)
    if not vals:
        return None
    return max(vals) if mode == "max" else min(vals)


def compute_measurements(t_verts, t_joints, a_verts, a_joints, faces):
    t_mesh = trimesh.Trimesh(vertices=t_verts, faces=faces, process=False)
    a_mesh = trimesh.Trimesh(vertices=a_verts, faces=faces, process=False)

    height_cm = float((t_verts[:, 1].max() - t_verts[:, 1].min()) * 100.0)
    shoulder_half_x = float(0.5 * abs(t_joints[16, 0] - t_joints[17, 0]))
    torso_clip_x = shoulder_half_x * 1.05

    pelvis_y = float(t_joints[0, 1])
    hip_y = float(0.5 * (t_joints[1, 1] + t_joints[2, 1]))
    knee_y = float(0.5 * (t_joints[4, 1] + t_joints[5, 1]))
    ankle_y = float(0.5 * (t_joints[7, 1] + t_joints[8, 1]))
    spine2_y = float(t_joints[6, 1])
    spine3_y = float(t_joints[9, 1])
    shoulder_y = float(0.5 * (t_joints[16, 1] + t_joints[17, 1]))

    chest_cm = _band_stat(t_mesh, spine2_y, 0.5 * (spine3_y + shoulder_y), "max", torso_clip_x)
    waist_cm = _band_stat(t_mesh, pelvis_y, spine2_y, "min", torso_clip_x)
    hip_cm = _band_stat(t_mesh, hip_y - 0.02, pelvis_y + 0.02, "max", torso_clip_x * 1.25)

    # Outer shoulder breadth sliced on A-pose at shoulder joint height
    sh_segs = trimesh.intersections.mesh_plane(a_mesh, [0.0, 1.0, 0.0], [0.0, float(0.5 * (a_joints[16, 1] + a_joints[17, 1])), 0.0])
    shoulder_cm = float(sh_segs.reshape(-1, 3)[:, 0].ptp() * 100.0) if len(sh_segs) else float(shoulder_half_x * 200.0)

    # Crotch height: lowest horizontal slice from pelvis down that still bridges mid_x
    mid_x = float(0.5 * (t_joints[1, 0] + t_joints[2, 0]))
    crotch_y = hip_y - 0.05
    for y in np.linspace(pelvis_y, knee_y, 60):
        segs = trimesh.intersections.mesh_plane(t_mesh, [0.0, 1.0, 0.0], [0.0, float(y), 0.0])
        if len(segs) and np.any(((segs[:, 0, 0] - mid_x) * (segs[:, 1, 0] - mid_x)) <= 0.0):
            crotch_y = float(y)
        else:
            break
    inseam_cm = float(crotch_y * 100.0)

    l_arm = np.linalg.norm(t_joints[16] - t_joints[18]) + np.linalg.norm(t_joints[18] - t_joints[20])
    r_arm = np.linalg.norm(t_joints[17] - t_joints[19]) + np.linalg.norm(t_joints[19] - t_joints[21])
    arm_cm = float(0.5 * (l_arm + r_arm) * 100.0)

    return {
        "units": "cm",
        "height_cm": round(height_cm, 1),
        "shoulder_width_cm": round(shoulder_cm, 1),
        "chest_cm": round(chest_cm, 1) if chest_cm else None,
        "waist_cm": round(waist_cm, 1) if waist_cm else None,
        "hip_cm": round(hip_cm, 1) if hip_cm else None,
        "inseam_cm": round(inseam_cm, 1),
        "arm_length_cm": round(arm_cm, 1),
    }
