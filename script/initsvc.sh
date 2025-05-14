#!/system/bin/sh

# 使用更可靠的方式获取脚本目录
MODDIR=${0%/*}
if [ "$MODDIR" = "$0" ]; then
    MODDIR=$(pwd)
fi

# 确定脚本所在目录
SCRIPT_DIR="$MODDIR"
# 如果当前脚本在script目录下，则模块目录是其父目录
if [ "$(basename "$SCRIPT_DIR")" = "script" ]; then
    MODULE_DIR="$(dirname "$SCRIPT_DIR")"
else
    # 否则假设模块目录就是当前目录，script是其子目录
    MODULE_DIR="$SCRIPT_DIR"
    SCRIPT_DIR="$MODULE_DIR/script"
fi

# 创建初始化日志目录
mkdir -p /data/adb/gpu_governor/log 2>/dev/null
INIT_LOG="/data/adb/gpu_governor/log/initsvc.log"

# 轮转初始化日志并备份旧的初始化日志
if [ -f "$INIT_LOG" ]; then
    # 创建带时间戳的备份文件名
    BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    INIT_LOG_BACKUP="${INIT_LOG}.${BACKUP_TIMESTAMP}.bak"

    # 备份旧的初始化日志
    cp "$INIT_LOG" "$INIT_LOG_BACKUP" 2>/dev/null

    # 清空原始日志文件
    true > "$INIT_LOG"

    # 设置正确的权限
    chmod 0666 "$INIT_LOG"

    # 记录轮转信息
    echo "$(date) - Initialization log rotated, previous log backed up to ${INIT_LOG_BACKUP}" > "$INIT_LOG"
fi

# 记录目录信息到初始化日志
echo "$(date) - 🚀 Initialization started" >> "$INIT_LOG"
echo "📁 SCRIPT_DIR=$SCRIPT_DIR" >> "$INIT_LOG"
echo "📁 MODULE_DIR=$MODULE_DIR" >> "$INIT_LOG"

# 确保路径信息正确加载
if [ -f "$SCRIPT_DIR/pathinfo.sh" ]; then
    . "$SCRIPT_DIR/pathinfo.sh"
    echo "✅ Successfully loaded pathinfo.sh" >> "$INIT_LOG"
else
    # 尝试其他可能的位置
    if [ -f "$MODULE_DIR/script/pathinfo.sh" ]; then
        . "$MODULE_DIR/script/pathinfo.sh"
        echo "✅ Successfully loaded pathinfo.sh from module/script" >> "$INIT_LOG"
    else
        # 由于pathinfo.sh未加载，log函数不可用，直接写入初始化日志
        echo "❌ Error: pathinfo.sh not found in $SCRIPT_DIR or $MODULE_DIR/script" >> "$INIT_LOG"
        exit 1
    fi
fi

# 现在可以使用log函数了
log "Initialization service started running"
log "SCRIPT_DIR=$SCRIPT_DIR"
log "MODULE_DIR=$MODULE_DIR"

# 加载其他库
if [ -f "$SCRIPT_DIR/libcommon.sh" ]; then
    . "$SCRIPT_DIR/libcommon.sh"
    log "Loaded libcommon.sh"
else
    log "Error: libcommon.sh not found, path: $SCRIPT_DIR"
    exit 1
fi

# 加载cgroup库
if [ -f "$SCRIPT_DIR/libcgroup.sh" ]; then
    . "$SCRIPT_DIR/libcgroup.sh"
    log "Loaded libcgroup.sh"
else
    log "Error: libcgroup.sh not found, path: $SCRIPT_DIR"
    exit 1
fi

# 设置日志文件最大大小（单位MB）
MAX_LOG_SIZE_MB=5

# 等待系统启动完成
wait_until_login

# 确保日志目录和游戏目录存在并设置适当权限
mkdir -p "$LOG_PATH" 2>/dev/null
mkdir -p "$GAMES_PATH" 2>/dev/null

# 设置日志目录和游戏目录权限为777，确保任何进程都可以写入
chmod 0777 "$LOG_PATH" 2>/dev/null
chmod 0777 "$GAMES_PATH" 2>/dev/null

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 0666 "$LOG_LEVEL_FILE"
    log "Created log level file with default level: info"
fi

# 检查并轮转所有日志文件
# 先处理主日志文件
if [ -f "$GPUGOV_LOGPATH" ]; then
    # 强制轮转主日志文件，确保启动时日志文件不会太大
    cp "$GPUGOV_LOGPATH" "${GPUGOV_LOGPATH}.bak" 2>/dev/null
    true > "$GPUGOV_LOGPATH"
    chmod 0666 "$GPUGOV_LOGPATH"
    echo "$(date) - Forced log rotation at system startup, original log backed up to ${GPUGOV_LOGPATH}.bak" >> "$GPUGOV_LOGPATH"
    sync
fi

# 使用统一的日志轮转函数处理初始化日志
rotate_log "$LOG_FILE" "$MAX_LOG_SIZE_MB"

# 记录基本信息到日志
{
    echo "$(date)"
    echo "PATH=$PATH"
    echo "sh=$(which sh)"
    echo "Bootstraping MTK_GPU_GOVERNOR"

    # 记录当前日志等级
    if [ -f "$LOG_LEVEL_FILE" ]; then
        current_log_level=$(cat "$LOG_LEVEL_FILE")
        echo "Current log level: $current_log_level"

        # 确保在debug模式下也创建初始化日志
        if [ "$current_log_level" = "debug" ]; then
            echo "Debug mode enabled, ensuring initialization log is created"
        fi
    else
        echo "Log level file not found, using default: info"
    fi

    # 确保日志文件权限正确
    chmod 0666 "$LOG_FILE" 2>/dev/null
} >> "$INIT_LOG"
sync


# 读取当前DVFS状态并记录到初始化日志
{
  echo "$(date) - Checking DVFS status"
  dvfs_status=$(cat $DVFS | cut -f2 -d ' ')

  # 检查DVFS状态
  if [[ "$dvfs_status" != "0" ]]; then
    # 显示警告信息
    echo "Warning: DVFS is currently enabled (status=$dvfs_status), disabling now..."

    # 关闭DVFS
    echo 0 > $DVFS

    # 确认DVFS已关闭
    new_status=$(cat $DVFS | cut -f2 -d ' ')
    if [[ "$new_status" == "0" ]]; then
      echo "DVFS successfully disabled"
    else
      echo "Error: Failed to disable DVFS, current status is still $new_status"
    fi
  else
    echo "DVFS is already disabled"
  fi
} >> "$INIT_LOG" 2>&1

# 内联gpugov_testconf函数的内容，避免函数调用问题
{
    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    echo "🚀 Starting gpu governor"

    # 检查用户配置文件
    if [ -f "$USER_PATH/gpu_freq_table.conf" ]; then
        echo "📄 Found user config at $USER_PATH/gpu_freq_table.conf"
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    else
        # 获取设备平台信息
        target="$(getprop ro.board.platform)"
        cfgname="$(get_config_name $target)"

        # 特殊处理mt6983，可能是mt6891或mt6893
        if [ "$target" = "mt6983" ]; then
            # 如果CPU7最大频率小于2700000，则是mt6891
            if [ "$(get_maxfreq 7)" -lt 2700000 ]; then
                echo "检测到mt6983但CPU7频率较低，判断为mt6891"
                cfgname="mtd1100"
            else
                echo "检测到mt6983且CPU7频率正常，判断为mt6893"
                cfgname="mtd1200"
            fi
        fi

        # 特殊处理mt6895，可能是mt6896
        if [ "$target" = "mt6895" ]; then
            if [[ $(getprop ro.soc.model | grep 6896) != '' ]]; then
                echo "检测到mt6895但ro.soc.model包含6896，判断为mt6896"
                cfgname="mtd8200"
            fi
        fi

        if [ "$cfgname" = "unsupported" ]; then
            target="$(getprop ro.product.board)"
            cfgname="$(get_config_name "$target")"
        fi

        # 如果平台支持，使用平台特定配置，否则使用默认配置
        if [ "$cfgname" != "unsupported" ] && [ -f "$MODULE_PATH/config/$cfgname.conf" ]; then
            cp -f "$MODULE_PATH/config/$cfgname.conf" "$USER_PATH/gpu_freq_table.conf"
            echo "Created platform-specific config from $cfgname.conf"
        else
            cp -f "$MODULE_PATH/gpu_freq_table.conf" "$USER_PATH/gpu_freq_table.conf"
            echo "Created default config from gpu_freq_table.conf"
        fi
        GPUGOV_CONFPATH="$USER_PATH/gpu_freq_table.conf"
    fi

    echo "⚙️ Using config $GPUGOV_CONFPATH"

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    # 启动GPU调速器
    # 直接使用 BIN_PATH
    if [ ! -x "$BIN_PATH/gpugovernor" ]; then
        echo "Error: Binary not executable, trying to fix permissions"
        chmod 0755 "$BIN_PATH/gpugovernor"
        if [ ! -x "$BIN_PATH/gpugovernor" ]; then
            echo "Error: Failed to set executable permission"
            exit 1
        fi
    fi

    # 使用统一的日志轮转函数
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"

    # 确保gpu_gov.log文件存在并设置正确权限
    if [ ! -f "$GPUGOV_LOGPATH" ]; then
        touch "$GPUGOV_LOGPATH"
        echo "$(date) - GPU Governor log file created" >> "$INIT_LOG"
    fi
    chmod 0666 "$GPUGOV_LOGPATH"

    echo "Starting gpu governor" >> "$INIT_LOG"
    sync

    # 读取日志等级设置
    log_level="info"
    if [ -f "$LOG_LEVEL_FILE" ]; then
        log_level=$(cat "$LOG_LEVEL_FILE")
        # 验证日志等级是否有效
        if [ "$log_level" != "debug" ] && [ "$log_level" != "info" ] && [ "$log_level" != "warn" ] && [ "$log_level" != "error" ]; then
            log_level="info" # 默认为info级别
        fi
        echo "Log level set to: $log_level" >> "$INIT_LOG"
    else
        echo "Log level file not found, using default: info" >> "$INIT_LOG"
    fi

    # 根据日志等级决定是否启用调试输出
    if [ "$log_level" = "debug" ]; then
        echo "Debug level enabled, console output will be shown"
        # 启动进程，确保日志记录正常工作
        echo "Starting gpugovernor with debug level"
        # 确保日志目录和文件权限正确
        chmod -R 0777 "$LOG_PATH" 2>/dev/null

        # 记录启动信息到主日志文件
        echo "$(date) - Starting GPU Governor with debug level"

        # 启动进程，使用绝对路径确保正确执行，确保输出重定向到主日志文件
        killall gpugovernor
        RUST_BACKTRACE=1 nohup "$BIN_PATH/gpugovernor" >"$GPUGOV_LOGPATH" 2>&1 &

    else
        echo "Using log level: $log_level"

        # 记录启动信息到主日志文件
        echo "$(date) - Starting GPU Governor with $log_level level"

        # 启动进程，使用绝对路径确保正确执行，确保输出重定向到主日志文件
        killall gpugovernor
        RUST_BACKTRACE=1 nohup "$BIN_PATH/gpugovernor" >"$GPUGOV_LOGPATH" 2>&1 &
    fi
    sync

    sleep 2
    if ! pgrep -f "gpugovernor" >/dev/null; then
        echo "Error: Process failed to start"
        exit 1
    fi

    rebuild_process_scan_cache
    change_task_cgroup "gpugovernor" "background" "cpuset"
    echo "✅ GPU Governor started successfully"

    # 再次检查日志大小
    rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
} >> "$INIT_LOG" 2>&1

# 检查并轮转GPU调速器主日志
rotate_log "$GPUGOV_LOGPATH" "$MAX_LOG_SIZE_MB"
