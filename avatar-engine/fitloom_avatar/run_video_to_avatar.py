import argparse, glob, os, shutil, subprocess, sys


def main():
    ap = argparse.ArgumentParser(description="End-to-end video -> FITLOOM 3D avatar bundle.")
    ap.add_argument("--video", required=True, help="Input video file (.mp4/.mov)")
    ap.add_argument("--out_dir", required=True, help="Output avatar bundle directory")
    ap.add_argument("--gender", default="neutral", choices=["neutral", "male", "female"])
    ap.add_argument("--height_cm", type=float, default=None)
    ap.add_argument("--a_pose_deg", type=float, default=40.0)
    ap.add_argument("--pare_dir", default="/home/krishu/FITLOOM-PRIVATE-AVATAR/PARE")
    ap.add_argument("--keep_tmp", action="store_true", help="Keep PARE temporary PNG frames")
    args = ap.parse_args()

    vid = os.path.abspath(args.video)
    out_dir = os.path.abspath(args.out_dir)
    pare_work = os.path.join(out_dir, "_pare_work")
    os.makedirs(pare_work, exist_ok=True)

    pare_cmd = [
        sys.executable, "scripts/demo.py",
        "--vid_file", vid,
        "--output_folder", pare_work,
        "--smooth",
        "--no_render",
    ]
    print("Running PARE (--no_render)...")
    subprocess.run(pare_cmd, cwd=args.pare_dir, check=True)

    pkls = glob.glob(os.path.join(pare_work, "**", "pare_output.pkl"), recursive=True)
    if not pkls:
        raise FileNotFoundError(f"pare_output.pkl not found under {pare_work}")
    pkl_path = pkls[0]

    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    build_cmd = [
        sys.executable, "-m", "fitloom_avatar.build_avatar",
        "--pkl", pkl_path,
        "--out_dir", out_dir,
        "--gender", args.gender,
        "--a_pose_deg", str(args.a_pose_deg),
    ]
    if args.height_cm is not None:
        build_cmd += ["--height_cm", str(args.height_cm)]

    print("Building FITLOOM avatar bundle...")
    subprocess.run(build_cmd, env=env, check=True)

    if not args.keep_tmp:
        for d in glob.glob(os.path.join(pare_work, "**", "tmp_images*"), recursive=True):
            shutil.rmtree(d, ignore_errors=True)
        print("Cleaned up PARE temp frame directories.")


if __name__ == "__main__":
    main()
