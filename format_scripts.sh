#!/bin/bash

# Shell 脚本格式化工具
# 使用 shfmt 格式化所有 .sh 文件

SHFMT_PATH="/d/shfmt/shfmt_v3.11.0_windows_amd64.exe"

# 检查 shfmt 是否存在
if [ ! -f "$SHFMT_PATH" ]; then
    echo "错误: 找不到 shfmt 工具: $SHFMT_PATH"
    exit 1
fi

echo "开始格式化 shell 脚本..."

# 格式化主目录下的脚本
for script in *.sh; do
    if [ -f "$script" ] && [ "$script" != "format_scripts.sh" ]; then
        echo "格式化: $script"
        "$SHFMT_PATH" -i 4 -ci -sr -w "$script"
    fi
done

# 格式化 script 目录下的脚本
if [ -d "script" ]; then
    for script in script/*.sh; do
        if [ -f "$script" ]; then
            echo "格式化: $script"
            "$SHFMT_PATH" -i 4 -ci -sr -w "$script"
        fi
    done
fi

echo "格式化完成！"

# 显示格式化选项说明
echo ""
echo "使用的格式化选项："
echo "  -i 4   : 使用 4 个空格缩进"
echo "  -ci    : switch case 语句缩进"
echo "  -sr    : 重定向操作符后跟随空格"
echo "  -w     : 直接写入文件"
