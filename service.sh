#!/system/bin/sh

# 获取模块目录
MODDIR=${0%/*}

DIR=/data/adb/gpu_governor/log
LOG=$DIR/gpu_gov.log

until [ -d $DIR ]; do
	sleep 1
done

if [ "$MODDIR" = "$0" ]; then
    MODDIR=$(dirname "$0")
fi

# 确保脚本有执行权限
chmod 0755 "$MODDIR"/script/*.sh 2>/dev/null

# 记录启动信息到日志文件
mkdir -p /data/adb/gpu_governor/log 2>/dev/null
LOG_FILE="/data/adb/gpu_governor/log/initsvc.log"
echo "$(date) - GPU Governor: Starting service from $MODDIR" >> "$LOG_FILE"

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
    echo "$(date) - GPU Governor: Service started successfully" >> "$LOG_FILE"
else
    echo "$(date) - GPU Governor: Service failed to start, please check logs" >> "$LOG_FILE"

    # 检查二进制文件是否存在
    if [ ! -f "$MODDIR/bin/gpugovernor" ]; then
        echo "$(date) - Error: Binary file does not exist: $MODDIR/bin/gpugovernor" >> "$LOG_FILE"
    else
        # 检查二进制文件权限
        if [ ! -x "$MODDIR/bin/gpugovernor" ]; then
            echo "$(date) - Error: Binary file does not have execution permission, attempting to fix" >> "$LOG_FILE"
            chmod 0755 "$MODDIR/bin/gpugovernor"
            echo "$(date) - Execution permission set, please restart the device and try again" >> "$LOG_FILE"
        fi
    fi


fi
