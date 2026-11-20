import math
import numpy as np
import torch
import smplx
import trimesh


def pad_betas(betas, num_betas=300):
    arr = np.zeros((1, num_betas), dtype=np.float32)
    b = np.asarray(betas, dtype=np.float32).reshape(-1)
    arr[0, : min(len(b), num_betas)] = b[:num_betas]
    return arr


def ground_mesh(verts, joints):
    shift = np.array([joints[0, 0], verts[:, 1].min(), joints[0, 2]], dtype=np.float32)
    return verts - shift, joints - shift


def build_smpl_poses(betas, model_path, gender="neutral", num_betas=300, a_pose_deg=40.0):
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    model = smplx.create(
        model_path, model_type="smpl", gender=gender, num_betas=num_betas, ext="pkl"
    ).to(dev)
    bt = torch.from_numpy(pad_betas(betas, num_betas)).to(dev)

    with torch.no_grad():
        t_out = model(betas=bt, return_verts=True)
        body_pose = torch.zeros((1, 69), device=dev, dtype=torch.float32)
        rad = math.radians(a_pose_deg)
        body_pose[0, 15 * 3 + 2] = -rad  # Left shoulder down
        body_pose[0, 16 * 3 + 2] = rad   # Right shoulder down
        a_out = model(betas=bt, body_pose=body_pose, return_verts=True)

    t_verts, t_joints = ground_mesh(
        t_out.vertices[0].cpu().numpy(), t_out.joints[0].cpu().numpy()
    )
    a_verts, a_joints = ground_mesh(
        a_out.vertices[0].cpu().numpy(), a_out.joints[0].cpu().numpy()
    )
    return {
        "faces": model.faces.astype(np.int32),
        "tpose": {"verts": t_verts, "joints": t_joints},
        "apose": {"verts": a_verts, "joints": a_joints},
    }


def export_glb(path, verts, faces, rgba=(216, 212, 208, 255)):
    mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
    _ = mesh.vertex_normals
    mesh.visual.vertex_colors = np.tile(np.array(rgba, dtype=np.uint8), (len(verts), 1))
    mesh.export(path)
