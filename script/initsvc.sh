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
clear_log
log_info "🚀 Initialization started" "🚀 初始化开始"

# 等待系统解锁
wait_until_login

# 确保日志等级文件存在，默认为info级别
if [ ! -f "$LOG_LEVEL_FILE" ]; then
    echo "info" > "$LOG_LEVEL_FILE"
    chmod 0644 "$LOG_LEVEL_FILE"
    log_info "Created log level file with default level: info" "已创建日志等级文件，默认等级为 info"
    current_log_level="info"
else
    current_log_level=$(cat "$LOG_LEVEL_FILE")
    # 验证日志等级是否有效
    if [ "$current_log_level" != "debug" ] && [ "$current_log_level" != "info" ] && [ "$current_log_level" != "warn" ] && [ "$current_log_level" != "error" ]; then
        current_log_level="info" # 默认为info级别
        echo "info" > "$LOG_LEVEL_FILE"
        log_info "Invalid log level found, reset to default: info" "检测到无效日志等级，已重置为 info"
    fi
fi
log_info "📝 Current log level: $current_log_level" "📝 当前日志等级: $current_log_level"

# 记录基本信息到日志
log_info "📦 PATH: $PATH" "📦 PATH：$PATH"
log_info "🛠️ Shell path: $(which sh)" "🛠️ Shell 路径：$(which sh)"
log_info "🚀 Bootstrapping MTK_GPU_GOVERNOR" "🚀 初始化 MTK_GPU_GOVERNOR"
sync

# 读取当前DVFS状态并记录到初始化日志
log_info "🔍 Checking DVFS status" "🔍 正在检查 DVFS 状态"

# 首先检查DVFS文件是否存在
if [ ! -f "$DVFS" ]; then
    log_warn "⚠️ DVFS control file does not exist: $DVFS" "⚠️ 未找到 DVFS 控制文件：$DVFS"
    log_info "ℹ️ This is normal for some devices or kernel versions" "ℹ️ 对某些设备或内核版本属于正常情况"
else
    # 文件存在，尝试读取状态
    dvfs_status=$(cat "$DVFS" 2> /dev/null | cut -f2 -d ' ')

    if [ -z "$dvfs_status" ]; then
        log_warn "⚠️ Unable to read DVFS status from $DVFS" "⚠️ 无法从 $DVFS 读取 DVFS 状态"
    else
        # 检查DVFS状态
        if [[ "$dvfs_status" != "0" ]]; then
            # 显示警告信息
            log_warn "⚠️ DVFS is currently enabled (status=$dvfs_status), disabling now..." "⚠️ 检测到 DVFS 已启用（状态=$dvfs_status），即将关闭..."

            # 尝试关闭DVFS
            if echo 0 > "$DVFS" 2> /dev/null; then
                # 确认DVFS已关闭
                new_status=$(cat "$DVFS" 2> /dev/null | cut -f2 -d ' ')
                if [[ "$new_status" == "0" ]]; then
                    log_info "✅ DVFS successfully disabled" "✅ 成功关闭 DVFS"
                else
                    log_warn "⚠️ Failed to disable DVFS, current status is $new_status" "⚠️ 未能关闭 DVFS，当前状态为 $new_status"
                fi
            else
                log_error "⛔ Unable to write to DVFS control file, permission denied" "⛔ 无法写入 DVFS 控制文件，权限不足"
            fi
        else
            log_info "✅ DVFS is already disabled" "✅ DVFS 已关闭"
        fi
    fi
fi

# 关闭DCS Policy并记录到初始化日志 (仅针对天玑9000)
# 关闭DCS Policy并记录到初始化日志 (仅针对天玑9000)
if [ "$target" = "mt6983" ]; then
    log_info "🧠 Detected Dimensity 9000 device (mt6983)" "🧠 检测到天玑 9000 设备 (mt6983)"

    # 检查DCS Policy文件是否存在
    if [ ! -f "$DCS_MODE" ]; then
        log_warn "⚠️ DCS Policy control file does not exist: $DCS_MODE" "⚠️ 未找到 DCS Policy 控制文件：$DCS_MODE"
        log_info "ℹ️ This is normal for some devices or kernel versions" "ℹ️ 对某些设备或内核版本属于正常情况"
    else
        # 文件存在，尝试读取状态
        dcs_status=$(cat "$DCS_MODE" 2> /dev/null)

        if [ -z "$dcs_status" ]; then
            log_warn "⚠️ Unable to read DCS Policy status from $DCS_MODE" "⚠️ 无法从 $DCS_MODE 读取 DCS Policy 状态"
        else
            # 检查DCS Policy状态
            if echo "$dcs_status" | grep -q "disabled"; then
                log_info "✅ DCS Policy is already disabled" "✅ DCS Policy 已关闭"
            else
                # 显示信息
                log_warn "⚠️ DCS Policy is enabled (status=$dcs_status), disabling now..." "⚠️ 检测到 DCS Policy 已启用（状态=$dcs_status），即将关闭..."
                log_info "ℹ️ DCS Policy may cause GPU frequency swings; disabling for better performance" "ℹ️ DCS Policy 可能导致 GPU 频率波动，已禁用以提升性能"

                # 尝试关闭DCS Policy
                if echo 0 > "$DCS_MODE" 2> /dev/null; then
                    # 确认DCS Policy已关闭
                    new_status=$(cat "$DCS_MODE" 2> /dev/null)
                    if echo "$new_status" | grep -q "disabled"; then
                        log_info "✅ DCS Policy successfully disabled on Dimensity 9000" "✅ 已在天玑 9000 上成功关闭 DCS Policy"
                    else
                        log_warn "⚠️ Failed to disable DCS Policy, current status is $new_status" "⚠️ 未能关闭 DCS Policy，当前状态为 $new_status"
                    fi
                else
                    log_error "⛔ Unable to write to DCS Policy control file, permission denied" "⛔ 无法写入 DCS Policy 控制文件，权限不足"
                fi
            fi
        fi
    fi
fi

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
        log_info "🌐 updateJson switched to GitHub URL" "🌐 OTA仓库已切换到 GitHub 地址"
    else
        # 中文版本使用Gitee地址（默认）
        sed -i '/^updateJson=/c\updateJson=https://gitee.com/Seyud/MMGG_deploy/raw/master/Update.json' "$MODULE_PROP"
        log_info "🌐 updateJson switched to Gitee URL" "🌐 OTA仓库已切换到 Gitee 地址"
    fi
}

# 执行updateJson更新
update_updatejson

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
    log_info "✅ GPU Governor is already running" "✅ GPU调速器已经在运行"
    exit 0
fi

# 更新状态为启动中
apply_status_description "starting" update_description

log_info "🚀 Starting GPU governor" "🚀 启动GPU调速器"

# 检查频率表是否存在
if [ -f "$GPU_FREQ_TABLE_TOML_FILE" ]; then
    log_info "📄 Found gpu_freq_table.toml at $GPU_FREQ_TABLE_TOML_FILE" "📄 在 $GPU_FREQ_TABLE_TOML_FILE 找到频率表"
    log_info "⚙️ Using config $GPU_FREQ_TABLE_TOML_FILE" "⚙️ 使用频率表 $GPU_FREQ_TABLE_TOML_FILE"
else
    log_error "⛔ gpu_freq_table.toml not found at $GPU_FREQ_TABLE_TOML_FILE, please reinstall the module." "⛔ 在 $GPU_FREQ_TABLE_TOML_FILE 未找到 gpu_freq_table.toml，请重新安装模块。"
fi

if [ ! -x "$GPU_GOVERNOR_BIN" ]; then
    log_warn "⚠️ Binary not executable, trying to fix permissions" "⚠️ 二进制文件不可执行，正在尝试修复权限"
    chmod 0755 "$GPU_GOVERNOR_BIN"
    if [ ! -x "$GPU_GOVERNOR_BIN" ]; then
        log_error "⛔ Failed to set executable permission" "⛔ 设置可执行权限失败"
        apply_status_description "error" update_description
        exit 1
    fi
fi

log_info "🗂️ GPU Governor will manage its own log file" "🗂️ 调速器核心将自行管理主日志文件"
log_info "▶️ Starting GPU governor process" "▶️ 正在启动 GPU 调速器"
sync

if [ "$current_log_level" = "debug" ]; then
    log_info "🐞 Debug level enabled, verbose logging active" "🐞 调试等级已启用，将输出详细日志"

    killall gpugovernor 2> /dev/null
    RUST_BACKTRACE=1 nohup "$GPU_GOVERNOR_BIN" >/dev/null 2>&1 &

    log_info "🚀 GPU Governor launched with debug level" "🚀 GPU 调速器已以调试等级启动"
else
    log_info "📊 Using log level: $current_log_level" "📊 使用日志等级：$current_log_level"

    killall gpugovernor 2> /dev/null
    nohup "$GPU_GOVERNOR_BIN" >/dev/null 2>&1 &

    log_info "🚀 GPU Governor launched with $current_log_level level" "🚀 GPU 调速器已以 $current_log_level 等级启动"
fi

gov_pid=$!
sync

sleep 2.7

# 检查GPU调速器是否成功启动
if pgrep -f "gpugovernor" > /dev/null; then
    log_info "✅ GPU Governor started successfully" "✅ GPU调速器启动成功"
    apply_status_description "running" update_description
    echo "$gov_pid" > "$PID_FILE"
    log_info "🆔 GPU Governor PID: $gov_pid" "🆔 GPU调速器 PID：$gov_pid"
    append_description " PID: $gov_pid" " PID: $gov_pid"

    rebuild_process_scan_cache
    change_task_cgroup "gpugovernor" "background" "cpuset"
    log_info "📦 Process cgroup adjusted" "📦 已调整进程 cgroup 配置"
else
    log_error "😭 Error occurred while starting GPU Governor, check logs for details" "😭 启动GPU调速器时出现错误，请查看日志"
    apply_status_description "error" update_description
    exit 1
fi
