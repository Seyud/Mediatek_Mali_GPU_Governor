#!/system/bin/sh
# 删除配置文件
rm -f /data/gpu_freq_table.conf
# 删除日志目录（包含日志等级文件）
rm -rf /data/adb/gpu_governor/log
# 删除游戏目录（包含游戏列表和游戏模式文件）
rm -rf /data/adb/gpu_governor/game
