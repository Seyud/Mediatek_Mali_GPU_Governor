#!/system/bin/sh

MODULE_PATH="$(dirname $(readlink -f "$0"))"
MODULE_PATH="${MODULE_PATH%\/script}"
SCRIPT_PATH="$MODULE_PATH/script"

# GPU调速器目录
GPU_GOV="/data/adb/gpu_governor"
GPU_CONFIG="$GPU_GOV/config"      # 配置文件目录
GPU_GAME="$GPU_GOV/game"          # 游戏列表目录
GPU_LOG="$GPU_GOV/log"            # 日志文件目录

# 配置文件
GPU_FREQ_TABLE_TOML_FILE="$GPU_CONFIG/gpu_freq_table.toml"
CONFIG_TOML_FILE="$GPU_CONFIG/config.toml"
GAME_LIST="$GPU_GAME/games.toml"

# 日志相关
INIT_LOG="$GPU_LOG/initsvc.log"
GPUGOV_LOG="$GPU_LOG/gpu_gov.log"
LOG_LEVEL_FILE="$GPU_LOG/log_level"
PID_FILE="$GPU_LOG/governor.pid"

# 模块目录
BIN_PATH="$MODULE_PATH/bin"
MODULE_CONFIG_PATH="$MODULE_PATH/config"

MODULE_GPU_FREQ_TABLE_FILE="$MODULE_CONFIG_PATH/gpu_freq_table.toml"
DEFAULT_CONFIG_FILE="$MODULE_CONFIG_PATH/config.toml"
GPU_GOVERNOR_BIN="$BIN_PATH/gpugovernor"
MODULE_PROP="$MODULE_PATH/module.prop"

DVFS="/proc/mali/dvfs_enable"
DCS_MODE="/sys/kernel/ged/hal/dcs_mode"

# 打印路径信息日志
if [ -n "$INIT_LOG" ] && [ -d "$(dirname "$INIT_LOG")" ]; then
    {
        echo "MODULE_PATH=$MODULE_PATH"
        echo "SCRIPT_PATH=$SCRIPT_PATH"
        echo "BIN_PATH=$BIN_PATH"
    } >> "$INIT_LOG"
    sync
fi
