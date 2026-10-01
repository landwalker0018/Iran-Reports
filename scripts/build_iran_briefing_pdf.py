"""Compatibility launcher for the shared Markdown/HTML/PDF pipeline."""
from pathlib import Path
import shutil
import subprocess
import sys


def main() -> int:
    node = shutil.which("node")
    if node is None:
        print("未找到 Node.js，请安装 Node.js 22 或更新版本。", file=sys.stderr)
        return 1
    script = Path(__file__).resolve().with_name("build_iran_briefing_pdf_v3.mjs")
    return subprocess.run([node, str(script), *sys.argv[1:]], check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
