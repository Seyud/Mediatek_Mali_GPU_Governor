#!/system/bin/sh
# 基础路径
MODDIR="${0%/*}"
SCRIPT_PATH="$MODDIR"
MODULE_PATH="${MODDIR%/*}"

# 数据目录
GPU_BASE="/data/adb/gpu_governor"
GPU_LOG="$GPU_BASE/log"
GPU_GAME="$GPU_BASE/game"
GPU_CONFIG="$GPU_BASE/config"

# 路径变量
USER_PATH="/data"
BIN_PATH="$MODULE_PATH/bin"
FLAG_PATH="$MODULE_PATH/flag"
LOG_PATH="$GPU_LOG"

# 文件路径
LOG_FILE="$GPU_LOG/initsvc.log"
GPUGOV_LOGPATH="$GPU_LOG/gpu_gov.log"
LOG_LEVEL_FILE="$GPU_LOG/log_level"
CONFIG_TOML_FILE="$GPU_CONFIG/config.toml"
GPU_FREQ_TABLE_TOML_FILE="$GPU_CONFIG/gpu_freq_table.toml"
GAMES_PATH="$GPU_GAME"
GAMES_FILE="$GPU_GAME/games.toml"
DVFS="/proc/mali/dvfs_enable"

# 记录路径
if [ -n "$LOG_FILE" ] && [ -d "$(dirname "$LOG_FILE")" ]; then
    echo "MODULE_PATH=$MODULE_PATH" >> "$LOG_FILE"
    echo "SCRIPT_PATH=$SCRIPT_PATH" >> "$LOG_FILE"
    echo "BIN_PATH=$BIN_PATH" >> "$LOG_FILE"
    sync
fi