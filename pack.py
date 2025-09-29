#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
打包程序 - 将Mediatek_Mali_GPU_Governor模块打包成zip文件
使用7-Zip进行压缩打包
"""

import argparse
import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional

# 配置常量
SEVEN_ZIP_PATH = Path(r"D:\7-Zip\7z.exe")
WORK_DIR = Path(__file__).parent
OUTPUT_DIR = WORK_DIR / "output"

# 打包内容配置
PACK_ITEMS = [
    "bin", "config", "docs", "META-INF", "script", "webroot",
    "action.sh", "customize.sh", "module.prop", "service.sh", 
    "uninstall.sh", "volt_list.txt"
]

LINE_ENDING_FILES = [".sh", ".py", ".js", ".css", ".html", ".md", ".conf", ".prop"]


class Packager:
    """模块打包器"""
    
    def __init__(self):
        self.output_path = None
        
    def _check_requirements(self) -> bool:
        """检查打包要求"""
        if not SEVEN_ZIP_PATH.exists():
            print(f"错误: 未找到7-Zip程序: {SEVEN_ZIP_PATH}")
            return False
            
        if not (WORK_DIR / "module.prop").exists():
            print("错误: 当前目录不是模块根目录，未找到module.prop文件")
            return False
            
        return True
    
    def _create_output_dir(self) -> bool:
        """创建输出目录"""
        try:
            OUTPUT_DIR.mkdir(exist_ok=True)
            print(f"输出目录: {OUTPUT_DIR}")
            return True
        except OSError as e:
            print(f"创建输出目录失败: {e}")
            return False
    
    def _validate_pack_items(self) -> list[Path]:
        """验证打包项目，返回存在的项目列表"""
        existing_items = []
        missing_items = []
        
        for item in PACK_ITEMS:
            path = WORK_DIR / item
            if path.exists():
                existing_items.append(path)
            else:
                missing_items.append(item)
        
        if missing_items:
            print("警告: 以下项目不存在:")
            for item in missing_items:
                print(f"  - {item}")
                
            if input("是否继续打包? (y/n): ").lower() != 'y':
                return []
        
        return existing_items
    
    def _run_7zip(self, items: list[Path], output_filename: str) -> bool:
        """执行7-Zip压缩"""
        output_file = OUTPUT_DIR / output_filename
        
        cmd = [
            str(SEVEN_ZIP_PATH), "a", "-tzip", str(output_file),
            *[item.name for item in items]
        ]
        
        print(f"开始打包: {output_filename}")
        
        try:
            result = subprocess.run(
                cmd, cwd=WORK_DIR, capture_output=True, text=True
            )
            
            if result.returncode == 0:
                size_mb = output_file.stat().st_size / (1024 * 1024)
                print(f"打包成功: {output_file} ({size_mb:.2f} MB)")
                return True
            else:
                print(f"打包失败: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"打包过程错误: {e}")
            return False
    
    def create_package(self, custom_name: Optional[str] = None) -> bool:
        """创建压缩包"""
        if not self._check_requirements() or not self._create_output_dir():
            return False
            
        items = self._validate_pack_items()
        if not items:
            return False
            
        filename = (custom_name or "Mediatek_Mali_GPU_Governor") + ".zip"
        return self._run_7zip(items, filename)


class FileManager:
    """文件管理器"""
    
    @staticmethod
    def fix_line_endings():
        """修复文件换行符为LF"""
        print("检查并修复文件换行符...")
        
        converted = 0
        meta_dir = WORK_DIR / "META-INF"
        webui_dir = WORK_DIR / "webui"
        website_dir = WORK_DIR / "website"
        
        # 处理META-INF目录
        if meta_dir.exists():
            for file_path in meta_dir.rglob("*"):
                if file_path.is_file() and FileManager._convert_line_endings(file_path):
                    converted += 1
        
        # 处理其他文件
        for ext in LINE_ENDING_FILES:
            for file_path in WORK_DIR.rglob(f"*{ext}"):
                if (meta_dir not in file_path.parents and 
                    webui_dir not in file_path.parents and 
                    website_dir not in file_path.parents and 
                    FileManager._convert_line_endings(file_path)):
                    converted += 1
        
        print(f"换行符修复完成，转换了 {converted} 个文件")
    
    @staticmethod
    def _convert_line_endings(file_path: Path) -> bool:
        """转换单个文件的换行符"""
        try:
            content = file_path.read_bytes()
            if b'\r\n' in content:
                file_path.write_bytes(content.replace(b'\r\n', b'\n'))
                print(f"  转换: {file_path.relative_to(WORK_DIR)}")
                return True
        except OSError:
            pass
        return False


def open_output_dir():
    """打开输出目录"""
    try:
        os.startfile(OUTPUT_DIR)
        print(f"已打开输出目录: {OUTPUT_DIR}")
    except OSError as e:
        print(f"打开目录失败: {e}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="天玑GPU调速器模块打包工具")
    parser.add_argument("-o", "--output", help="指定输出文件名")
    parser.add_argument("-d", "--open-dir", action="store_true", help="打开输出目录")
    parser.add_argument("--no-fix-eol", action="store_true", help="跳过换行符修复")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("天玑GPU调速器模块打包工具")
    print("=" * 50)
    
    if not args.no_fix_eol:
        FileManager.fix_line_endings()
    
    packager = Packager()
    if packager.create_package(args.output):
        print("打包完成!")
        if args.open_dir:
            open_output_dir()
    else:
        print("打包失败!")
    
    print("=" * 50)


if __name__ == "__main__":
    main()
