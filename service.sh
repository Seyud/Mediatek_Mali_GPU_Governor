#!/system/bin/sh

# 获取模块目录
MODDIR=${0%/*}

DIR=/data/adb/gpu_governor/log
LOG=$DIR/gpu_gov.log

until [ -d $DIR ]; do
	sleep 1
done

killall gpugovernor
RUST_BACKTRACE=1 nohup $MODDIR/bin/gpugovernor >$LOG 2>&1 &

if [ "$MODDIR" = "$0" ]; then
    MODDIR=$(dirname "$0")
fi

# 确保脚本有执行权限
chmod 0755 "$MODDIR"/script/*.sh 2>/dev/null

# 记录启动信息到日志文件
mkdir -p /data/adb/gpu_governor/log 2>/dev/null
LOG_FILE="/data/adb/gpu_governor/log/initsvc.log"
echo "$(date) - GPU Governor: 从 $MODDIR 启动服务" >> "$LOG_FILE"

# 创建必要的目录
mkdir -p /data/adb/gpu_governor/log 2>/dev/null
mkdir -p /data/adb/gpu_governor/game 2>/dev/null
chmod 0777 /data/adb/gpu_governor 2>/dev/null
chmod 0777 /data/adb/gpu_governor/log 2>/dev/null
chmod 0777 /data/adb/gpu_governor/game 2>/dev/null

# 启动服务
sh "$MODDIR"/script/initsvc.sh

# 检查服务是否成功启动
sleep 3
if pgrep -f "gpugovernor" >/dev/null; then
    echo "$(date) - GPU Governor: 服务启动成功" >> "$LOG_FILE"
else
    echo "$(date) - GPU Governor: 服务启动失败，请检查日志" >> "$LOG_FILE"

    # 检查二进制文件是否存在
    if [ ! -f "$MODDIR/bin/gpugovernor" ]; then
        echo "$(date) - 错误: 二进制文件不存在: $MODDIR/bin/gpugovernor" >> "$LOG_FILE"
    else
        # 检查二进制文件权限
        if [ ! -x "$MODDIR/bin/gpugovernor" ]; then
            echo "$(date) - 错误: 二进制文件没有执行权限，尝试修复" >> "$LOG_FILE"
            chmod 0755 "$MODDIR/bin/gpugovernor"
            echo "$(date) - 已设置执行权限，请重启设备再试" >> "$LOG_FILE"
        fi
    fi


fi
