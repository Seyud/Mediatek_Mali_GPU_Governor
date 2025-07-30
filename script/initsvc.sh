#!/system/bin/sh

# 获取脚本目录
MODDIR=${0%/*}
 
MODULE_DIR="$MODDIR"
SCRIPT_DIR="$MODULE_DIR/script"

# 创建初始化日志目录
GPU_GOVERNOR_LOG_DIR="/data/adb/gpu_governor/log"
mkdir -p "$GPU_GOVERNOR_LOG_DIR" 2> /dev/null
INIT_LOG="$GPU_GOVERNOR_LOG_DIR/initsvc.log"

# 确保初始化日志文件存在
if [ ! -f "$INIT_LOG" ]; then
    touch "$INIT_LOG"
    chmod 0666 "$INIT_LOG"
fi

# 记录目录信息到初始化日志（首次写入，覆盖旧内容）
echo "$(date) - 🚀 Initialization started" > "$INIT_LOG"
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


# 等待系统启动完成
wait_until_login

# 确保日志目录和游戏目录存在并设置适当权限
mkdir -p "$LOG_PATH" 2> /dev/null
mkdir -p "$GAMES_PATH" 2> /dev/null

# 设置日志目录和游戏目录权限为777，确保任何进程都可以写入
chmod 0777 "$LOG_PATH" 2> /dev/null
chmod 0777 "$GAMES_PATH" 2> /dev/null

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 0666 "$LOG_LEVEL_FILE"
    log "Created log level file with default level: info"
fi

# 确保主日志文件存在
if [ ! -f "$GPUGOV_LOGPATH" ]; then
    touch "$GPUGOV_LOGPATH"
    chmod 0666 "$GPUGOV_LOGPATH"
fi

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
    chmod 0666 "$LOG_FILE" 2> /dev/null
} >> "$INIT_LOG"
sync

# 读取当前DVFS状态并记录到初始化日志
{
    echo "$(date) - Checking DVFS status"

    # 首先检查DVFS文件是否存在
    if [ ! -f "$DVFS" ]; then
        echo "DVFS control file does not exist: $DVFS"
        echo "This is normal for some devices or kernel versions"
    else
        # 文件存在，尝试读取状态
        dvfs_status=$(cat "$DVFS" 2> /dev/null | cut -f2 -d ' ')

        if [ -z "$dvfs_status" ]; then
            echo "Unable to read DVFS status from $DVFS"
        else
            # 检查DVFS状态
            if [[ "$dvfs_status" != "0" ]]; then
                # 显示警告信息
                echo "Warning: DVFS is currently enabled (status=$dvfs_status), disabling now..."

                # 尝试关闭DVFS
                if echo 0 > "$DVFS" 2> /dev/null; then
                    # 确认DVFS已关闭
                    new_status=$(cat "$DVFS" 2> /dev/null | cut -f2 -d ' ')
                    if [[ "$new_status" == "0" ]]; then
                        echo "DVFS successfully disabled"
                    else
                        echo "Warning: Failed to disable DVFS, current status is still $new_status"
                    fi
                else
                    echo "Warning: Unable to write to DVFS control file, permission denied"
                fi
            else
                echo "DVFS is already disabled"
            fi
        fi
    fi
} >> "$INIT_LOG" 2>&1

# 关闭DCS Policy并记录到初始化日志 (仅针对天玑9000)
{
    echo "$(date) - Checking DCS Policy status (Dimensity 9000 only)"

    DCS_MODE="/sys/kernel/ged/hal/dcs_mode"

    # 检测设备平台，判断是否为天玑9000 (mt6983)
    platform="$(getprop ro.hardware)"
    if [ "$platform" = "mt6983" ]; then
        echo "Detected Dimensity 9000 device (mt6983)"

        # 检查DCS Policy文件是否存在
        if [ ! -f "$DCS_MODE" ]; then
            echo "DCS Policy control file does not exist: $DCS_MODE"
            echo "This is normal for some devices or kernel versions"
        else
            # 文件存在，尝试读取状态
            dcs_status=$(cat "$DCS_MODE" 2> /dev/null)

            if [ -z "$dcs_status" ]; then
                echo "Unable to read DCS Policy status from $DCS_MODE"
            else
                # 检查DCS Policy状态
                if echo "$dcs_status" | grep -q "disabled"; then
                    echo "DCS Policy is already disabled"
                else
                    # 显示信息
                    echo "DCS Policy is currently enabled (status=$dcs_status), disabling now..."
                    echo "DCS Policy can cause GPU frequency fluctuations between min/max, disabling for better performance on Dimensity 9000"

                    # 尝试关闭DCS Policy
                    if echo 0 > "$DCS_MODE" 2> /dev/null; then
                        # 确认DCS Policy已关闭
                        new_status=$(cat "$DCS_MODE" 2> /dev/null)
                        if echo "$new_status" | grep -q "disabled"; then
                            echo "DCS Policy successfully disabled on Dimensity 9000"
                        else
                            echo "Warning: Failed to disable DCS Policy, current status is still $new_status"
                        fi
                    else
                        echo "Warning: Unable to write to DCS Policy control file, permission denied"
                    fi
                fi
            fi
        fi
    else
        echo "Platform is $platform (not mt6983/Dimensity 9000), skipping DCS Policy disable"
    fi
} >> "$INIT_LOG" 2>&1

# ==================== ENHANCED GPU GOVERNOR STARTUP ====================

# 添加busybox到PATH
[ -d "/data/adb/magisk" ] && export PATH="/data/adb/magisk:$PATH"
[ -d "/data/adb/ksu/bin" ] && export PATH="/data/adb/ksu/bin:$PATH"
[ -d "/data/adb/ap/bin" ] && export PATH="/data/adb/ap/bin:$PATH"

# 大部分用户是中文用户，默认设置为中文
language="zh"

# 尝试获取系统语言
locale=$(getprop persist.sys.locale || getprop ro.product.locale || getprop persist.sys.language)

# 如果系统语言是英文，设置语言为英文
if echo "$locale" | grep -qi "en"; then
    language="en"
fi

# 增强的日志函数，支持双语
enhanced_log() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local str
    [ "$language" = "en" ] && str="$timestamp $1" || str="$timestamp $2"
    echo "$str"
}

# 更新模块描述
update_description() {
    local description
    [ "$language" = "en" ] && description="$1" || description="$2"
    sed -i "/^description=/c\description=$description" "$MODULE_DIR/module.prop"
}

# 追加模块描述
append_description() {
    local description
    [ "$language" = "en" ] && description="$1" || description="$2"
    sed -i "/^description=/ s|\$|$description|" "$MODULE_DIR/module.prop"
}

# 获取状态描述
get_status_description() {
    local status="$1"
    case "$status" in
        "running")
            [ "$language" = "en" ] && echo "🚀 Running" || echo "🚀 运行中"
            ;;
        "stopped")
            [ "$language" = "en" ] && echo "❌ Stopped" || echo "❌ 已停止"
            ;;
        "error")
            [ "$language" = "en" ] && echo "😭 Error occurred, check logs for details" || echo "😭 出现错误，请检查日志以获取详细信息"
            ;;
        "starting")
            [ "$language" = "en" ] && echo "⚡ Starting" || echo "⚡ 启动中"
            ;;
        *)
            [ "$language" = "en" ] && echo "❓ Unknown status" || echo "❓ 未知状态"
            ;;
    esac
}

# GPU调速器相关路径
GPU_GOV_DIR="/data/adb/gpu_governor"
PID_FILE="$GPU_GOV_DIR/log/governor.pid"

# 检查GPU调速器是否已经在运行
if [ -f "$PID_FILE" ] && ps | grep -w "$(cat "$PID_FILE")" | grep -q "gpugovernor"; then
    enhanced_log "GPU Governor is already running" "GPU调速器已经在运行"
    exit 0
fi

# 更新状态为启动中
update_description "$(get_status_description "starting")" "$(get_status_description "starting")"

{

    enhanced_log "🚀 Starting gpu governor" "🚀 启动GPU调速器"

    # 检查频率表是否存在
    DEFAULT_GPUGOV_DIR="/data/adb/gpu_governor/config"
    GPUGOV_FREQ_TABLE="gpu_freq_table.toml"
    if [ -f "$DEFAULT_GPUGOV_DIR/$GPUGOV_FREQ_TABLE" ]; then
        enhanced_log "📄 Found gpu_freq_table.toml at $DEFAULT_GPUGOV_DIR/$GPUGOV_FREQ_TABLE" "📄 在 $DEFAULT_GPUGOV_DIR/$GPUGOV_FREQ_TABLE 找到 gpu_freq_table.toml"
        GPUGOV_CONFPATH="$DEFAULT_GPUGOV_DIR/$GPUGOV_FREQ_TABLE"
        enhanced_log "⚙️ Using config $GPUGOV_CONFPATH" "⚙️ 使用配置 $GPUGOV_CONFPATH"
    else
        enhanced_log "Error: gpu_freq_table.toml not found at $DEFAULT_GPUGOV_DIR/$GPUGOV_FREQ_TABLE, please reinstall the module." "错误: 在 $DEFAULT_GPUGOV_DIR/$GPUGOV_FREQ_TABLE 未找到 gpu_freq_table.toml，请重新安装模块。"
    fi


    # 启动GPU调速器
    # 直接使用 BIN_PATH
    if [ ! -x "$BIN_PATH/gpugovernor" ]; then
        enhanced_log "Error: Binary not executable, trying to fix permissions" "错误：二进制文件不可执行，尝试修复权限"
        chmod 0755 "$BIN_PATH/gpugovernor"
        if [ ! -x "$BIN_PATH/gpugovernor" ]; then
            enhanced_log "Error: Failed to set executable permission" "错误：设置可执行权限失败"
            update_description "$(get_status_description "error")" "$(get_status_description "error")"
            exit 1
        fi
    fi


    # GPU Governor日志文件现在由Rust程序自己创建和管理
    enhanced_log "GPU Governor will create and manage its own log file" "GPU调速器将自己创建和管理日志文件"

    enhanced_log "Starting gpu governor" "启动GPU调速器"
    sync

    # 读取日志等级设置
    log_level="info"
    if [ -f "$LOG_LEVEL_FILE" ]; then
        log_level=$(cat "$LOG_LEVEL_FILE")
        # 验证日志等级是否有效
        if [ "$log_level" != "debug" ] && [ "$log_level" != "info" ] && [ "$log_level" != "warn" ] && [ "$log_level" != "error" ]; then
            log_level="info" # 默认为info级别
        fi
        enhanced_log "Log level set to: $log_level" "日志等级设置为: $log_level"
    else
        enhanced_log "Log level file not found, using default: info" "未找到日志等级文件，使用默认: info"
    fi

    # 根据日志等级决定是否启用调试输出
    if [ "$log_level" = "debug" ]; then
        enhanced_log "Debug level enabled, Rust program will handle its own logging" "启用调试等级，Rust程序将自己处理日志记录"
        # 启动进程，确保日志记录正常工作
        echo "Starting gpugovernor with debug level"
        # 确保日志目录和文件权限正确
        chmod -R 0777 "$LOG_PATH" 2> /dev/null

        # 记录启动信息到主日志文件
        enhanced_log "Starting GPU Governor with debug level" "以调试等级启动GPU调速器"

        # 启动进程
        killall gpugovernor 2> /dev/null
        RUST_BACKTRACE=1 nohup "$BIN_PATH/gpugovernor" > /dev/null 2>&1 &

    else
        enhanced_log "Using log level: $log_level" "使用日志等级: $log_level"

        # 记录启动信息到主日志文件
        enhanced_log "Starting GPU Governor with $log_level level" "以 $log_level 等级启动GPU调速器"

        # 启动进程
        killall gpugovernor 2> /dev/null
        RUST_BACKTRACE=1 nohup "$BIN_PATH/gpugovernor" > /dev/null 2>&1 &
    fi

    gov_pid=$!
    sync

    sleep 2

    # 检查GPU调速器是否成功启动
    if pgrep -f "gpugovernor" > /dev/null; then
        enhanced_log "🚀 GPU Governor started successfully" "🚀 GPU调速器启动成功"
        update_description "$(get_status_description "running")" "$(get_status_description "running")"
        echo "$gov_pid" > "$PID_FILE"
        enhanced_log "GPU Governor PID: $gov_pid" "GPU调速器 PID: $gov_pid"
        append_description " PID: $gov_pid" " PID: $gov_pid"

        # 检查配置信息并追加到描述
        if [ -f "$GPU_GOV_DIR/game/game_list.txt" ]; then
            game_count=$(wc -l < "$GPU_GOV_DIR/game/game_list.txt" 2> /dev/null || echo "0")
            append_description " Games: $game_count" " 游戏数: $game_count"
        fi

        rebuild_process_scan_cache
        change_task_cgroup "gpugovernor" "background" "cpuset"
        enhanced_log "✅ GPU Governor started successfully" "✅ GPU调速器启动成功"
    else
        enhanced_log "😭 Error occurred while starting GPU Governor, check logs for details" "😭 启动GPU调速器时出现错误，请检查日志以获取详细信息"
        update_description "$(get_status_description "error")" "$(get_status_description "error")"
        exit 1
    fi

} >> "$INIT_LOG" 2>&1

