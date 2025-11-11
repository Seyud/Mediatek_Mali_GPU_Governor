#!/system/bin/sh

BASEDIR="$(dirname $(readlink -f "$0"))"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libcommon.sh
. $BASEDIR/libcgroup.sh

initialize_logging() {
    mkdir -p "$GPU_LOG" 2> /dev/null
    if [ ! -f "$INIT_LOG" ]; then
        touch "$INIT_LOG"
        chmod 0666 "$INIT_LOG"
    fi
    clear_log
    log_info "🔛 Initialization started" "🔛 初始化开始"
}

ensure_log_level() {
    local level
    if [ ! -f "$LOG_LEVEL_FILE" ]; then
        echo "info" > "$LOG_LEVEL_FILE"
        chmod 0644 "$LOG_LEVEL_FILE"
        log_info "Created log level file with default level: info" "已创建日志等级文件，默认等级为 info"
        level="info"
    else
        level=$(cat "$LOG_LEVEL_FILE")
        case "$level" in
            debug|info|warn|error)
                ;;
            *)
                level="info"
                echo "info" > "$LOG_LEVEL_FILE"
                log_info "Invalid log level found, reset to default: info" "检测到无效日志等级，已重置为 info"
                ;;
        esac
    fi

    current_log_level="$level"
    log_info "📝 Current log level: $current_log_level" "📝 当前日志等级: $current_log_level"
}

log_environment_details() {
    log_info "📦 PATH: $PATH" "📦 PATH：$PATH"
    log_info "🛠️ Shell path: $(which sh)" "🛠️ Shell 路径：$(which sh)"
    log_info "▶️ Bootstrapping Mediatek_Mali_GPU_Governor" "▶️ 初始化天玑GPU调速器"
    sync
}

disable_dvfs_if_needed() {
    log_info "🔍 Checking DVFS status" "🔍 正在检查 DVFS 状态"

    if [ ! -f "$DVFS" ]; then
        log_warn "⚠️ DVFS control file does not exist: $DVFS" "⚠️ 未找到 DVFS 控制文件：$DVFS"
        log_info "ℹ️ This is normal for some devices or kernel versions" "ℹ️ 对某些设备或内核版本属于正常情况"
        return
    fi

    local dvfs_status
    dvfs_status=$(cut -f2 -d ' ' "$DVFS" 2> /dev/null)

    if [ -z "$dvfs_status" ]; then
        log_warn "⚠️ Unable to read DVFS status from $DVFS" "⚠️ 无法从 $DVFS 读取 DVFS 状态"
        return
    fi

    if [ "$dvfs_status" = "0" ]; then
        log_info "✅ DVFS is already disabled" "✅ DVFS 已关闭"
        return
    fi

    log_warn "⚠️ DVFS is currently enabled (status=$dvfs_status), disabling now..." "⚠️ 检测到 DVFS 已启用（状态=$dvfs_status），即将关闭..."

    if echo 0 > "$DVFS" 2> /dev/null; then
        local new_status
        new_status=$(cut -f2 -d ' ' "$DVFS" 2> /dev/null)
        if [ "$new_status" = "0" ]; then
            log_info "✅ DVFS successfully disabled" "✅ 成功关闭 DVFS"
        else
            log_warn "⚠️ Failed to disable DVFS, current status is $new_status" "⚠️ 未能关闭 DVFS，当前状态为 $new_status"
        fi
    else
        log_error "⛔ Unable to write to DVFS control file, permission denied" "⛔ 无法写入 DVFS 控制文件，权限不足"
    fi
}

disable_dcs_policy_if_needed() {
    if [ "$target" != "mt6983" ]; then
        return
    fi

    log_info "🧠 Detected Dimensity 9000 device (mt6983)" "🧠 检测到天玑 9000 设备 (mt6983)"

    if [ ! -f "$DCS_MODE" ]; then
        log_warn "⚠️ DCS Policy control file does not exist: $DCS_MODE" "⚠️ 未找到 DCS Policy 控制文件：$DCS_MODE"
        log_info "ℹ️ This is normal for some devices or kernel versions" "ℹ️ 对某些设备或内核版本属于正常情况"
        return
    fi

    local dcs_status
    dcs_status=$(cat "$DCS_MODE" 2> /dev/null)

    if [ -z "$dcs_status" ]; then
        log_warn "⚠️ Unable to read DCS Policy status from $DCS_MODE" "⚠️ 无法从 $DCS_MODE 读取 DCS Policy 状态"
        return
    fi

    if echo "$dcs_status" | grep -q "disabled"; then
        log_info "✅ DCS Policy is already disabled" "✅ DCS Policy 已关闭"
        return
    fi

    log_warn "⚠️ DCS Policy is enabled (status=$dcs_status), disabling now..." "⚠️ 检测到 DCS Policy 已启用（状态=$dcs_status），即将关闭..."
    log_info "ℹ️ DCS Policy may cause GPU frequency swings; disabling for better performance" "ℹ️ DCS Policy 可能导致 GPU 频率波动，已禁用以提升性能"

    if echo 0 > "$DCS_MODE" 2> /dev/null; then
        local new_status
        new_status=$(cat "$DCS_MODE" 2> /dev/null)
        if echo "$new_status" | grep -q "disabled"; then
            log_info "✅ DCS Policy successfully disabled on Dimensity 9000" "✅ 已在天玑 9000 上成功关闭 DCS Policy"
        else
            log_warn "⚠️ Failed to disable DCS Policy, current status is $new_status" "⚠️ 未能关闭 DCS Policy，当前状态为 $new_status"
        fi
    else
        log_error "⛔ Unable to write to DCS Policy control file, permission denied" "⛔ 无法写入 DCS Policy 控制文件，权限不足"
    fi
}

extend_path_with_tools() {
    [ -d "/data/adb/magisk" ] && export PATH="/data/adb/magisk:$PATH"
    [ -d "/data/adb/ksu/bin" ] && export PATH="/data/adb/ksu/bin:$PATH"
    [ -d "/data/adb/ap/bin" ] && export PATH="/data/adb/ap/bin:$PATH"
}

update_updatejson() {
    [ -f "$MODULE_PROP" ] || return

    if [ "$language" = "en" ]; then
        sed -i '/^updateJson=/c\updateJson=https://raw.githubusercontent.com/Seyud/Mediatek_Mali_GPU_Governor/main/Update.json' "$MODULE_PROP"
        log_info "🌐 updateJson switched to GitHub URL" "🌐 OTA仓库已切换到 GitHub 地址"
    else
        sed -i '/^updateJson=/c\updateJson=https://gitee.com/Seyud/MMGG_deploy/raw/master/Update.json' "$MODULE_PROP"
        log_info "🌐 updateJson switched to Gitee URL" "🌐 OTA仓库已切换到 Gitee 地址"
    fi
}

update_description() {
    local status_text base_description combined safe_combined
    [ "$language" = "en" ] && status_text="$1" || status_text="$2"
    [ -f "$MODULE_PROP" ] || return

    base_description="$module_base_description"

    if [ -n "$base_description" ]; then
        combined="$status_text $base_description"
    else
        combined="$status_text"
    fi
    safe_combined=$(printf '%s' "$combined" | sed 's/[&/]/\\&/g')
    sed -i "/^description=/c\\description=$safe_combined" "$MODULE_PROP"
}

get_status_description() {
    local status="$1"
    local english chinese

    case "$status" in
        "running")
            english="[🚀 Running]"
            chinese="[🚀运行中]"
            ;;
        "stopped")
            english="[❌ Stopped]"
            chinese="[❌已停止]"
            ;;
        "error")
            english="[😭 Initialization failed]"
            chinese="[😭初始化失败]"
            ;;
        "starting")
            english="[⚡ Starting]"
            chinese="[⚡启动中]"
            ;;
        *)
            english="[❓ Unknown status]"
            chinese="[❓未知状态]"
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

guard_running_instance() {
    if [ -f "$PID_FILE" ] && ps | grep -w "$(cat "$PID_FILE")" | grep -q "gpugovernor"; then
        log_info "✅ GPU Governor is already running" "✅ GPU调速器已经在运行"
        exit 0
    fi
}

ensure_governor_executable() {
    if [ -x "$GPU_GOVERNOR_BIN" ]; then
        return
    fi

    log_warn "⚠️ Binary not executable, trying to fix permissions" "⚠️ 二进制文件不可执行，正在尝试修复权限"
    chmod 0755 "$GPU_GOVERNOR_BIN"
    if [ ! -x "$GPU_GOVERNOR_BIN" ]; then
        log_error "⛔ Failed to set executable permission" "⛔ 设置可执行权限失败"
        apply_status_description "error" update_description
        exit 1
    fi
}

launch_governor() {
    apply_status_description "starting" update_description
    if [ ! -f "$GPU_FREQ_TABLE_TOML_FILE" ]; then
        log_error "⛔ gpu_freq_table.toml not found at $GPU_FREQ_TABLE_TOML_FILE, please reinstall the module." "⛔ 在 $GPU_FREQ_TABLE_TOML_FILE 未找到GPU频率表，请重新安装模块。"
        return
    fi

    log_info "🗂️ GPU Governor will manage its own log file" "🗂️ 调速器核心将自行管理主日志文件"
    sync

    killall gpugovernor 2> /dev/null

    if [ "$current_log_level" = "debug" ]; then
        log_info "🐞 Debug level enabled, verbose logging active" "🐞 调试等级已启用，将输出详细日志"
        RUST_BACKTRACE=1 nohup "$GPU_GOVERNOR_BIN" >/dev/null 2>&1 &
        log_info "🚀 GPU Governor launched with debug level" "🚀 GPU 调速器已以调试等级启动"
    else
        log_info "📊 Using log level: $current_log_level" "📊 使用日志等级：$current_log_level"
        nohup "$GPU_GOVERNOR_BIN" >/dev/null 2>&1 &
        log_info "🚀 GPU Governor launched with $current_log_level level" "🚀 GPU 调速器已以 $current_log_level 等级启动"
    fi

    gov_pid=$!
    sync
    return 0
}

finalize_startup() {
    sleep 2.7
    if _process_exists "gpugovernor"; then
        log_info "✅ GPU Governor started successfully" "✅ GPU调速器启动成功"
        apply_status_description "running" update_description
        echo "$gov_pid" > "$PID_FILE"
        log_info "🆔 GPU Governor PID: $gov_pid" "🆔 GPU调速器 PID：$gov_pid"
        rebuild_process_scan_cache
        change_task_cgroup "gpugovernor" "background" "cpuset"
        log_info "📦 Process cgroup adjusted" "📦 已调整进程 cgroup 配置"
    else
        log_error "😭 Abnormal startup of the GPU governor. Please check the main log " "😭 启动GPU调速器异常，请查看主日志"
        apply_status_description "error" update_description
        exit 1
    fi
}

main() {
    init_language
    initialize_logging
    wait_until_login
    ensure_log_level
    log_environment_details
    disable_dvfs_if_needed
    disable_dcs_policy_if_needed
    extend_path_with_tools
    update_updatejson
    guard_running_instance
    ensure_governor_executable
    launch_governor
    finalize_startup
}

main "$@"
