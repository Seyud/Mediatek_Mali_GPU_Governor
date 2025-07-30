#!/system/bin/sh

MODDIR=${0%/*}

mount -t debugfs none /sys/kernel/debug

# 启动调速器
sh "$MODDIR"/script/initsvc.sh

# 检查调速器是否成功启动
sleep 7
# 加载路径信息
. "$MODDIR/script/pathinfo.sh"
if pgrep -f "gpugovernor" > /dev/null; then
    echo "$(date) - GPU Governor: Service started successfully" >> "$LOG_FILE"
else
    echo "$(date) - GPU Governor: Service failed to start, please check logs" >> "$LOG_FILE"
fi