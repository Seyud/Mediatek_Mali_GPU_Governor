#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
打包程序 - 用于将Mediatek_Mali_GPU_Governor模块文件打包成zip文件
使用D:\7-Zip\7z.exe进行压缩
"""

import argparse
import datetime
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# 7-Zip可执行文件路径
SEVEN_ZIP_PATH = r"D:\7-Zip\7z.exe"

# 获取当前脚本所在目录作为工作目录
WORK_DIR = os.path.dirname(os.path.abspath(__file__))

# 需要打包的文件夹
FOLDERS_TO_PACK = ["bin", "config", "docs", "META-INF", "script", "webroot"]

# 需要打包的文件
FILES_TO_PACK = [
    "action.sh",
    "customize.sh",
    "module.prop",
    "post-fs-data.sh",
    "service.sh",
    "uninstall.sh",
    "volt_list.txt",
]


def fix_path_environment():
    """修复环境变量Path中的双引号问题"""
    current_path = os.environ.get("PATH", "")

    if '"' in current_path:
        print("警告: 检测到环境变量Path中包含双引号字符")
        print("这可能会导致Python扩展无法正确加载，正在自动修复...")

        # 移除不正确的双引号
        fixed_path = re.sub(r'"([^"]*?)"', r"\1", current_path)

        # 设置修复后的环境变量
        os.environ["PATH"] = fixed_path

        print("环境变量Path已临时修复（仅影响当前进程）")
        print("如需永久修复，请运行fix_path.py或以管理员身份修改系统环境变量")
        return True

    return False


def check_7zip_exists():
    """检查7-Zip是否存在于指定路径"""
    if not os.path.exists(SEVEN_ZIP_PATH):
        print(f"错误: 未找到7-Zip程序，请确认路径: {SEVEN_ZIP_PATH}")
        return False
    return True


def create_zip_package(custom_output_filename=None):
    """创建ZIP压缩包"""
    # 检查7-Zip是否存在
    if not check_7zip_exists():
        return False

    # 生成输出文件名
    if custom_output_filename:
        output_filename = custom_output_filename
        if not output_filename.endswith(".zip"):
            output_filename += ".zip"
    else:
        # 默认使用固定名称 Mediatek_Mali_GPU_Governor.zip
        output_filename = "Mediatek_Mali_GPU_Governor.zip"

    output_path = os.path.join(WORK_DIR, output_filename)

    # 检查所有要打包的文件和文件夹是否存在
    all_items = FOLDERS_TO_PACK + FILES_TO_PACK
    missing_items = []

    for item in all_items:
        item_path = os.path.join(WORK_DIR, item)
        if not os.path.exists(item_path):
            missing_items.append(item)

    if missing_items:
        print("警告: 以下文件或文件夹不存在:")
        for item in missing_items:
            print(f"  - {item}")

        user_input = input("是否继续打包? (y/n): ")
        if user_input.lower() != "y":
            print("打包已取消")
            return False

    # 构建7-Zip命令
    cmd = [SEVEN_ZIP_PATH, "a", "-tzip", output_path]

    # 添加所有文件和文件夹到命令中
    for item in all_items:
        item_path = os.path.join(WORK_DIR, item)
        if os.path.exists(item_path):
            cmd.append(item)

    print(f"开始打包模块文件到: {output_filename}")
    print("正在执行命令:", " ".join(cmd))

    try:
        # 执行7-Zip命令
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=WORK_DIR
        )

        # 实时输出7-Zip的进度信息
        while True:
            output = process.stdout.readline()
            if output == "" and process.poll() is not None:
                break
            if output:
                print(output.strip())

        # 获取命令执行结果
        return_code = process.poll()

        if return_code == 0:
            print(f"打包成功! 文件已保存到: {output_path}")
            print(f"文件大小: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")
            return True
        else:
            error_output = process.stderr.read()
            print(f"打包失败! 错误代码: {return_code}")
            print(f"错误信息: {error_output}")
            return False

    except Exception as e:
        print(f"打包过程中发生错误: {str(e)}")
        return False


def clean_temp_files():
    """清理临时文件"""
    temp_dirs = [
        os.path.join(WORK_DIR, "__pycache__"),
        os.path.join(WORK_DIR, ".idea"),
        os.path.join(WORK_DIR, ".vscode"),
        os.path.join(WORK_DIR, "build"),
        os.path.join(WORK_DIR, "dist"),
    ]

    temp_files = ["*.pyc", "*.pyo", "*.bak", "*.swp", "*.tmp", "*.log"]

    print("正在清理临时文件...")

    # 删除临时目录
    for temp_dir in temp_dirs:
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                print(f"已删除目录: {temp_dir}")
            except Exception as e:
                print(f"删除目录失败: {temp_dir}, 错误: {str(e)}")

    # 删除临时文件
    for pattern in temp_files:
        for file_path in Path(WORK_DIR).glob(f"**/{pattern}"):
            try:
                os.remove(file_path)
                print(f"已删除文件: {file_path}")
            except Exception as e:
                print(f"删除文件失败: {file_path}, 错误: {str(e)}")

    print("临时文件清理完成")


def ensure_lf_line_endings():
    """确保所有脚本文件使用LF换行符"""
    # 需要检查的文件类型
    file_types = [".sh", ".py", ".js", ".css", ".html", ".md", ".conf", ".prop"]

    # 统计信息
    total_files = 0
    converted_files = 0

    print("正在检查文件换行符...")

    # 优先处理 META-INF 目录下的所有文件
    meta_inf_dir = Path(WORK_DIR) / "META-INF"
    if meta_inf_dir.exists() and meta_inf_dir.is_dir():
        for file_path in meta_inf_dir.rglob("*"):
            if file_path.is_file():
                try:
                    with open(file_path, "rb") as f:
                        content = f.read()
                    if b"\r\n" in content:
                        content = content.replace(b"\r\n", b"\n")
                        with open(file_path, "wb") as f:
                            f.write(content)
                        print(f"  已转换: {file_path.relative_to(WORK_DIR)} (CRLF -> LF)")
                        converted_files += 1
                    total_files += 1
                except Exception as e:
                    print(f"  处理文件失败: {file_path.relative_to(WORK_DIR)}, 错误: {str(e)}")

    # 继续处理其他文件（排除META-INF目录）
    for file_type in file_types:
        for file_path in Path(WORK_DIR).glob(f"**/*{file_type}"):
            # 排除某些目录和已处理的META-INF
            if any(part.startswith(".") for part in file_path.parts):
                continue
            if meta_inf_dir in file_path.parents:
                continue

            total_files += 1

            # 读取文件内容（二进制模式）
            try:
                with open(file_path, "rb") as f:
                    content = f.read()

                # 检查是否包含CRLF
                if b"\r\n" in content:
                    # 转换CRLF为LF
                    content = content.replace(b"\r\n", b"\n")

                    # 写回文件（二进制模式）
                    with open(file_path, "wb") as f:
                        f.write(content)

                    print(f"  已转换: {file_path.relative_to(WORK_DIR)} (CRLF -> LF)")
                    converted_files += 1
            except Exception as e:
                print(
                    f"  处理文件失败: {file_path.relative_to(WORK_DIR)}, 错误: {str(e)}"
                )

    print(
        f"换行符检查完成! 共检查 {total_files} 个文件，转换了 {converted_files} 个文件。"
    )


def open_output_directory(output_path):
    """打开输出文件所在目录"""
    output_dir = os.path.dirname(os.path.abspath(output_path))

    try:
        # 在Windows上使用os.startfile打开目录
        os.startfile(output_dir)
        print(f"已打开输出目录: {output_dir}")
    except Exception as e:
        print(f"打开输出目录失败: {str(e)}")


def main():
    """主函数"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="天玑GPU调速器模块打包工具")
    parser.add_argument("-o", "--output", help="指定输出文件名")
    parser.add_argument("-c", "--clean", action="store_true", help="打包前清理临时文件")
    parser.add_argument(
        "-d", "--open-dir", action="store_true", help="打包完成后打开输出目录"
    )
    parser.add_argument(
        "--no-fix-eol", action="store_true", help="跳过换行符检查和修复"
    )
    parser.add_argument(
        "--no-fix-path", action="store_true", help="跳过环境变量Path检查和修复"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("天玑GPU调速器模块打包工具")
    print("=" * 60)

    # 检查并修复环境变量Path问题（除非明确指定跳过）
    if not args.no_fix_path:
        fix_path_environment()

    # 检查当前目录是否是模块根目录
    if not os.path.exists(os.path.join(WORK_DIR, "module.prop")):
        print("错误: 当前目录不是模块根目录，未找到module.prop文件")
        return

    # 如果指定了清理临时文件
    if args.clean:
        clean_temp_files()

    # 检查并修复文件换行符（除非明确指定跳过）
    if not args.no_fix_eol:
        ensure_lf_line_endings()

    # 创建ZIP压缩包
    success = create_zip_package(args.output)

    if success:
        print("打包过程已完成!")

        # 如果指定了打开输出目录
        if args.open_dir:
            # 生成输出文件名
            if args.output:
                output_filename = args.output
                if not output_filename.endswith(".zip"):
                    output_filename += ".zip"
            else:
                # 默认使用固定名称 Mediatek_Mali_GPU_Governor.zip
                output_filename = "Mediatek_Mali_GPU_Governor.zip"

            output_path = os.path.join(WORK_DIR, output_filename)
            open_output_directory(output_path)
    else:
        print("打包过程失败!")

    print("=" * 60)


if __name__ == "__main__":
    main()
