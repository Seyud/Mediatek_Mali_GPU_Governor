# Frequently Asked Questions

## Basic Usage Questions

### Q: How to confirm the module is working properly?

A: @@include(../_includes/log-check-en.md)

### Q: How does game mode work?

A: When applications listed in `games.toml` are detected running in foreground, game mode is automatically applied; game mode uses the corresponding mode from the games list.

### Q: How to add custom games to the list?

A: Edit `/data/adb/gpu_governor/game/games.toml` file and add game package names. Or add through WebUI interface games list page. The module automatically scans installed games on device during installation and generates initial games list.

### Q: How to adjust log level?

A: There are three ways:
1. Use interactive menu `./action.sh` to select log level
2. Adjust through WebUI interface settings page
3. Directly edit `/data/adb/gpu_governor/log/log_level` file

Changes take effect immediately after adjustment, no need to restart module.

@@include(../_includes/webui-usage-en.md)

### Q: Do I need to restart after modifying configuration files and parameters?

A: No. The module supports configuration hot reload and multithreaded monitoring, all changes (such as frequency table, games list, log level etc.) take effect in real time without restart.

## Troubleshooting

### Module Cannot Start

1. Check if device supports GPUFreq drivers
2. View initialization log `/data/adb/gpu_governor/log/initsvc.log`
3. Confirm device is properly rooted
4. Check for permission issues

### WebUI Cannot Be Accessed

1. Confirm supported WebUI app is installed (KsuWebUI or SSU)
2. Check if module is running normally
3. Restart root manager
4. View module logs for error information

### Game Mode Not Working

1. Check if game is in `games.toml` list
2. Confirm game package name is correct
3. View logs to confirm game detection is working normally
4. Check games list configuration through WebUI interface

### Frequency Adjustment Issues

1. Check if GPU frequency table configuration is correct
2. Confirm voltage settings are within safe range
3. View system logs for kernel errors
4. Try using default configuration

### Performance Issues

1. Check if log level is set too low (debug level may affect performance)
2. Adjust sampling interval to balance performance and power consumption
3. Check for conflicts with other frequency scaling modules
4. Adjust mode configuration based on actual usage

## Technical Support

If you encounter other problems:

1. View complete log files
2. Collect device information and error logs
3. Contact developers or submit issues on project page
4. Join Telegram group for help

Contact Information:
- [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/Mediatek_Mali_GPU_Governor)