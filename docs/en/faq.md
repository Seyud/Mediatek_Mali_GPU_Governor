# FAQ ❓

## Basic Usage Questions

**Q: How to confirm the module is working properly?**
A: Check the `/data/adb/gpu_governor/log/gpu_gov.log` log file, or view the running status and logs through the WebUI interface, confirming no frequent abnormal errors.

**Q: How does game mode work?**
A: When apps listed in `games.toml` are detected running in the foreground, game mode will be automatically applied; in game mode, the corresponding mode in the game list will be used.

**Q: How to add custom games to the list?**
A: Edit the `/data/adb/gpu_governor/game/games.toml` file, add the game's package name. Or add through the game list page of the WebUI interface. The module will automatically scan installed games on the device and generate the initial game list during installation.

**Q: How to adjust log level?**
A: Three ways: 1) Use interactive menu `./action.sh` to select log level; 2) Adjust via WebUI settings page; 3) Directly edit `/data/adb/gpu_governor/log/log_level` file. Changes take effect immediately after adjustment, without restarting the module.

**Q: How to use WebUI?**
A: KernelSU/APatch users can click this module in the root manager and select "Open WebUI". Magisk users can install [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [SSU](https://ssu.oom-wg.dev/base/install) apps to access the module's WebUI.

**Q: Do I need to restart after modifying configuration files and parameters?**
A: No. The module supports configuration file hot-reload and multithreaded monitoring. All changes (such as frequency table, game list, log level, etc.) can take effect in real time without restarting.
