# 设置模块和脚本目录
MODDIR="${0%/*}"
SCRIPT_PATH="$MODDIR"
MODULE_PATH="${MODDIR%/*}"

BIN_PATH="$MODULE_PATH/bin"
FLAG_PATH="$MODULE_PATH/flag"

# 记录路径信息到日志文件
if [ -n "$LOG_FILE" ]; then
    echo "MODULE_PATH=$MODULE_PATH" >> "$LOG_FILE"
    echo "SCRIPT_PATH=$SCRIPT_PATH" >> "$LOG_FILE"
    echo "BIN_PATH=$BIN_PATH" >> "$LOG_FILE"
    sync
fi

USER_PATH="/data"
GPU_GOVERNOR_LOG_DIR="/data/adb/gpu_governor/log"
LOG_PATH="$GPU_GOVERNOR_LOG_DIR"
LOG_FILE="$GPU_GOVERNOR_LOG_DIR/initsvc.log"
GPUGOV_LOGPATH="$GPU_GOVERNOR_LOG_DIR/gpu_gov.log" # 主日志文件路径
GAMES_PATH="/data/adb/gpu_governor/game"
GAMES_FILE="$GAMES_PATH/games.toml"
LOG_LEVEL_FILE="$GPU_GOVERNOR_LOG_DIR/log_level"
CONFIG_PATH="/data/adb/gpu_governor/config"
CONFIG_TOML_FILE="$CONFIG_PATH/config.toml"
GPU_FREQ_TABLE_TOML_FILE="$CONFIG_PATH/gpu_freq_table.toml"
DVFS=/proc/mali/dvfs_enable