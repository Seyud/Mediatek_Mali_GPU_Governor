#!/system/bin/sh

MODDIR=${0%/*}

mount -t debugfs none /sys/kernel/debug

# 初始化调速器
sh "$MODDIR"/script/initsvc.sh