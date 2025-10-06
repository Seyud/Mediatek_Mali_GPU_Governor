#!/system/bin/sh

BASEDIR="$(dirname $(readlink -f "$0"))"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libcommon.sh
. $BASEDIR/libcgroup.sh

mkdir -p "$GPU_LOG" 2> /dev/null

# 确保初始化日志文件存在
if [ ! -f "$INIT_LOG" ]; then
    touch "$INIT_LOG"
    chmod 0666 "$INIT_LOG"
fi

# 记录目录信息到初始化日志（首次写入，覆盖旧内容）
echo "$(date) - 🚀 Initialization started" > "$INIT_LOG"

# 等待系统解锁
wait_until_login

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 0644 "$LOG_LEVEL_FILE"
    log "Created log level file with default level: info"
    current_log_level="info"
else
    current_log_level=$(cat "$LOG_LEVEL_FILE")
    # 验证日志等级是否有效
    if [ "$current_log_level" != "debug" ] && [ "$current_log_level" != "info" ] && [ "$current_log_level" != "warn" ] && [ "$current_log_level" != "error" ]; then
        current_log_level="info" # 默认为info级别
        echo "info" > "$LOG_LEVEL_FILE"
        log "Invalid log level found, reset to default: info"
    fi
fi
echo "Current log level: $current_log_level"

# 记录基本信息到日志
{
    echo "$(date)"
    echo "PATH=$PATH"
    echo "sh=$(which sh)"
    echo "Bootstraping MTK_GPU_GOVERNOR"
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
    # 检测设备平台，判断是否为天玑9000 (mt6983)
    if [ "$target" = "mt6983" ]; then
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
    fi
} >> "$INIT_LOG" 2>&1

# ==================== ENHANCED GPU GOVERNOR STARTUP ====================

# 添加busybox到PATH
[ -d "/data/adb/magisk" ] && export PATH="/data/adb/magisk:$PATH"
[ -d "/data/adb/ksu/bin" ] && export PATH="/data/adb/ksu/bin:$PATH"
[ -d "/data/adb/ap/bin" ] && export PATH="/data/adb/ap/bin:$PATH"

# 初始化语言设置
init_language

# 根据语言设置不同的updateJson地址
update_updatejson() {
    [ -f "$MODULE_PROP" ] || return
    
    if [ "$language" = "en" ]; then
        # 英文版本使用GitHub地址
        sed -i '/^updateJson=/c\updateJson=https://raw.githubusercontent.com/Seyud/Mediatek_Mali_GPU_Governor/main/Update.json' "$MODULE_PROP"
        echo "$(date) - Updated updateJson to GitHub URL " >> "$INIT_LOG"
    else
        # 中文版本使用Gitee地址（默认）
        sed -i '/^updateJson=/c\updateJson=https://gitee.com/Seyud/MMGG_deploy/raw/master/Update.json' "$MODULE_PROP"
        echo "$(date) - 已将 updateJson 更新为 Gitee 地址" >> "$INIT_LOG"
    fi
}

# 执行updateJson更新
update_updatejson

# 增强的日志函数，支持双语
enhanced_log() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local str
    [ "$language" = "en" ] && str="$timestamp $1" || str="$timestamp $2"
    echo "$str"
}

# 更新模块描述
update_description() {
    local description safe_description
    [ "$language" = "en" ] && description="$1" || description="$2"
    [ -f "$MODULE_PROP" ] || return
    # 转义 sed 特殊字符
    safe_description=$(printf '%s' "$description" | sed 's/[&/]/\\&/g')
    sed -i "/^description=/c\\description=$safe_description" "$MODULE_PROP"
}

# 追加模块描述（在原有末尾拼接）
append_description() {
    local description safe_append
    [ "$language" = "en" ] && description="$1" || description="$2"
    [ -f "$MODULE_PROP" ] || return
    safe_append=$(printf '%s' "$description" | sed 's/[&/]/\\&/g')
    sed -i "/^description=/ s|$|$safe_append|" "$MODULE_PROP"
}

# 获取状态描述
get_status_description() {
    local status="$1"
    local english chinese

    case "$status" in
        "running")
            english="🚀 Running"
            chinese="🚀 运行中"
            ;;
        "stopped")
            english="❌ Stopped"
            chinese="❌ 已停止"
            ;;
        "error")
            english="😭 Error occurred, check logs for details"
            chinese="😭 出现错误，请检查日志以获取详细信息"
            ;;
        "starting")
            english="⚡ Starting"
            chinese="⚡ 启动中"
            ;;
        *)
            english="❓ Unknown status"
            chinese="❓ 未知状态"
            ;;
    esac

    printf '%s|%s' "$english" "$chinese"
}

apply_status_description() {
    local status="$1"
    local callback="$2"
    local english chinese
    IFS='|' read -r english chinese <<EOF
$(get_status_description "$status")
EOF
    [ -z "$english" ] && english="❓ Unknown status"
    [ -z "$chinese" ] && chinese="❓ 未知状态"
    "$callback" "$english" "$chinese"
}

# 检查GPU调速器是否已经在运行
if [ -f "$PID_FILE" ] && ps | grep -w "$(cat "$PID_FILE")" | grep -q "gpugovernor"; then
    enhanced_log "GPU Governor is already running" "GPU调速器已经在运行"
    exit 0
fi

# 更新状态为启动中
apply_status_description "starting" update_description

{
    enhanced_log "🚀 Starting gpu governor" "🚀 启动GPU调速器"

    # 检查频率表是否存在
    if [ -f "$GPU_FREQ_TABLE_TOML_FILE" ]; then
        enhanced_log "📄 Found gpu_freq_table.toml at $GPU_FREQ_TABLE_TOML_FILE" "📄 在 $GPU_FREQ_TABLE_TOML_FILE 找到 gpu_freq_table.toml"
        enhanced_log "⚙️ Using config $GPU_FREQ_TABLE_TOML_FILE" "⚙️ 使用配置 $GPU_FREQ_TABLE_TOML_FILE"
    else
        enhanced_log "Error: gpu_freq_table.toml not found at $GPU_FREQ_TABLE_TOML_FILE, please reinstall the module." "错误: 在 $GPU_FREQ_TABLE_TOML_FILE 未找到 gpu_freq_table.toml，请重新安装模块。"
    fi

    if [ ! -x "$GPU_GOVERNOR_BIN" ]; then
        enhanced_log "Error: Binary not executable, trying to fix permissions" "错误：二进制文件不可执行，尝试修复权限"
        chmod 0755 "$GPU_GOVERNOR_BIN"
        if [ ! -x "$GPU_GOVERNOR_BIN" ]; then
            enhanced_log "Error: Failed to set executable permission" "错误：设置可执行权限失败"
            apply_status_description "error" update_description
            exit 1
        fi
    fi

    enhanced_log "GPU Governor will create and manage its own log file" "调速器核心将自行创建和管理主日志文件"
    enhanced_log "Starting gpu governor" "启动GPU调速器"
    sync

    if [ "$current_log_level" = "debug" ]; then
        enhanced_log "Debug level enabled, will print all behavior logs" "调试等级启用，调速器核心将打印所有行为日志"
        echo "Starting gpugovernor with debug level"

        killall gpugovernor 2> /dev/null
        RUST_BACKTRACE=1 nohup "$GPU_GOVERNOR_BIN" >/dev/null 2>&1 &

        enhanced_log "Starting GPU Governor with debug level" "GPU调速器以调试等级启动"
    else
        enhanced_log "Using log level: $current_log_level" "使用日志等级: $current_log_level"
        enhanced_log "Starting GPU Governor with $current_log_level level" "以 $current_log_level 等级启动GPU调速器"

        killall gpugovernor 2> /dev/null
        nohup "$GPU_GOVERNOR_BIN" >/dev/null 2>&1 &
    fi

    gov_pid=$!
    sync

    sleep 7

    # 检查GPU调速器是否成功启动
    if pgrep -f "gpugovernor" > /dev/null; then
        enhanced_log "🚀 GPU Governor started successfully" "🚀 GPU调速器启动成功"
        apply_status_description "running" update_description
        echo "$gov_pid" > "$PID_FILE"
        enhanced_log "GPU Governor PID: $gov_pid" "GPU调速器 PID: $gov_pid"
        append_description " PID: $gov_pid" " PID: $gov_pid"

        rebuild_process_scan_cache
        change_task_cgroup "gpugovernor" "background" "cpuset"
        enhanced_log "✅ GPU Governor started successfully" "✅ GPU调速器启动成功"
    else
        enhanced_log "😭 Error occurred while starting GPU Governor, check logs for details" "😭 启动GPU调速器时出现错误，请检查日志以获取详细信息"
        apply_status_description "error" update_description
        exit 1
    fi

} >> "$INIT_LOG" 2>&1
