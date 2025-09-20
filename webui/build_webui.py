#!/usr/bin/env python3
"""
WebUI 构建辅助脚本
===================
功能:
 1. 自动检测 Node / 包管理器 (pnpm > yarn > npm)
 2. 可选自动安装依赖 (--install)
 3. 执行构建 (默认)
 4. 支持清理 node_modules / dist (--clean)
 5. 可指定包管理器 (--pm npm|yarn|pnpm)
 6. Windows / Linux / Mac 通用（使用 subprocess）
 7. 输出更友好的日志 + 失败时提示可能解决方案

用法示例:
  python build_webui.py                 # 直接构建 (若 node_modules 存在则跳过安装)
  python build_webui.py --install       # 先安装依赖再构建
  python build_webui.py --clean --install
  python build_webui.py --pm pnpm --install
  python build_webui.py --skip-build --install   # 只安装
"""
from __future__ import annotations
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

ROOT = Path(__file__).parent.resolve()
PACKAGE_JSON = ROOT / 'package.json'
DIST_DIR = ROOT / 'dist'
NODE_MODULES = ROOT / 'node_modules'

COLOR = sys.stdout.isatty()

def c(text: str, color: str) -> str:
    if not COLOR:
        return text
    colors = {
        'green': '\033[32m',
        'red': '\033[31m',
        'yellow': '\033[33m',
        'blue': '\033[34m',
        'cyan': '\033[36m',
        'magenta': '\033[35m',
        'reset': '\033[0m'
    }
    return f"{colors.get(color,'')}" + text + colors['reset']

def run(cmd: List[str], cwd: Path, env: Optional[dict]=None, check: bool=True, verbose: bool=False):
    print(c('[RUN] ', 'cyan') + ' '.join(cmd))
    try:
        result = subprocess.run(cmd, cwd=str(cwd), env=env, check=check)
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(c(f'[ERROR] 命令失败: {e.returncode}', 'red'))
        if check:
            raise
        return e.returncode
    except FileNotFoundError:
        print(c(f'[ERROR] 无法找到可执行文件: {cmd[0]}', 'red'))
        if verbose:
            print(c('PATH = ' + os.environ.get('PATH',''), 'yellow'))
        raise

def which(exe: str) -> Optional[str]:
    """跨平台查找可执行文件; 在 Windows 下也尝试 *.cmd / *.exe"""
    path = shutil.which(exe)
    if path:
        return path
    if os.name == 'nt':
        for ext in ('.cmd', '.exe', '.bat'):
            path = shutil.which(exe + ext)
            if path:
                return path
    return None

def detect_package_manager(preferred: Optional[str]) -> str:
    if preferred:
        return preferred
    # 检查 lockfile 优先
    if (ROOT / 'pnpm-lock.yaml').exists() and which('pnpm'): return 'pnpm'
    if (ROOT / 'yarn.lock').exists() and which('yarn'): return 'yarn'
    if (ROOT / 'package-lock.json').exists() and which('npm'): return 'npm'
    # 没有 lockfile 时按可用性顺序
    for exe in ['pnpm', 'yarn', 'npm']:
        if which(exe):
            return exe
    raise RuntimeError('未检测到可用的包管理器 (需要至少安装 npm / yarn / pnpm 之一)')

def resolve_pm_cmd(base: str) -> str:
    """返回包管理器在当前平台上可直接执行的命令名称"""
    if os.name != 'nt':
        return base
    # Windows: 优先 .cmd
    for candidate in [base + '.cmd', base + '.exe', base]:
        if which(candidate):
            return candidate
    return base  # 让后续报错

def install_dependencies(pm: str, verbose: bool=False) -> None:
    print(c(f'==> 安装依赖 ({pm})', 'green'))
    exe = resolve_pm_cmd(pm)
    if pm == 'pnpm':
        run([exe, 'install', '--frozen-lockfile'], ROOT, verbose=verbose)
    elif pm == 'yarn':
        run([exe, 'install', '--frozen-lockfile'], ROOT, verbose=verbose)
    else:  # npm
        run([exe, 'install', '--no-audit', '--no-fund'], ROOT, verbose=verbose)


def build(pm: str, verbose: bool=False) -> None:
    print(c('==> 开始构建', 'green'))
    exe = resolve_pm_cmd(pm)
    if pm in ('pnpm','npm'):
        run([exe, 'run', 'build'], ROOT, verbose=verbose)
    elif pm == 'yarn':
        run([exe, 'build'], ROOT, verbose=verbose)


def clean(all_cache: bool=False):
    print(c('==> 清理构建产物', 'yellow'))
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
        print('已删除 dist/')
    if all_cache and NODE_MODULES.exists():
        shutil.rmtree(NODE_MODULES)
        print('已删除 node_modules/')


def parse_args():
    p = argparse.ArgumentParser(description='WebUI 构建脚本')
    p.add_argument('--pm', choices=['npm','yarn','pnpm'], help='指定包管理器，默认自动检测')
    p.add_argument('--install', action='store_true', help='安装依赖后再构建')
    p.add_argument('--clean', action='store_true', help='删除 dist/ 目录')
    p.add_argument('--deep-clean', action='store_true', help='删除 dist/ 和 node_modules/')
    p.add_argument('--skip-build', action='store_true', help='仅执行依赖安装或清理，不构建')
    p.add_argument('--no-color', action='store_true', help='关闭彩色输出')
    p.add_argument('--verbose', action='store_true', help='输出调试信息 (显示 PATH 等)')
    return p.parse_args()


def ensure_node():
    # 在 Windows Bash 环境中 node 可能是 node.exe
    if not which('node') and not which('node.exe'):
        raise RuntimeError('未找到 node，请先安装 Node.js (建议 18+).')
    # 可扩展: 校验版本 >= 18


def main():
    args = parse_args()
    global COLOR
    if args.no_color:
        COLOR = False

    try:
        ensure_node()
        pm = detect_package_manager(args.pm)
        print(c(f'使用包管理器: {pm}', 'magenta'))

        if args.deep_clean:
            clean(all_cache=True)
        elif args.clean:
            clean(all_cache=False)

        need_install = args.install or (not NODE_MODULES.exists())
        if need_install:
            install_dependencies(pm, verbose=args.verbose)
        else:
            print(c('跳过依赖安装 (已存在 node_modules/，若需强制请加 --install)', 'blue'))

        if not args.skip_build:
            build(pm, verbose=args.verbose)
        else:
            print(c('已跳过构建 (--skip-build)', 'yellow'))
        return 0
    except Exception as e:
        print(c(f'[FATAL] {e}', 'red'))
        return 1

if __name__ == '__main__':
    sys.exit(main())
