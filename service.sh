#!/system/bin/sh
MODDIR=${0%/*}

mount -t debugfs none /sys/kernel/debug

sh "$MODDIR"/script/initsvc.sh
