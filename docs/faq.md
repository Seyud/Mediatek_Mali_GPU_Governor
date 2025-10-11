# 常见问题 ❓

## 基础使用问题

**Q: 如何确认模块正常工作？**
A: 查看 `/data/adb/gpu_governor/log/gpu_gov.log` 日志文件，或者通过 WebUI 界面查看运行状态和日志，确认无频繁异常报错。

**Q: 游戏模式如何工作？**
A: 当检测到 `games.toml` 中列出的应用在前台运行时，会自动应用游戏模式；游戏模式下会使用游戏列表中对应的模式

**Q: 如何添加自定义游戏到列表？**
A: 编辑 `/data/adb/gpu_governor/game/games.toml` 文件，添加游戏的包名即可。或者通过 WebUI 界面的游戏列表页面进行添加。模块会在安装时自动扫描设备上已安装的游戏并生成初始游戏列表。

**Q: 如何调整日志等级？**
A: 有三种方式：1) 使用交互式菜单 `./action.sh` 选择日志等级；2) 通过 WebUI 界面的设置页面进行调整；3) 直接编辑 `/data/adb/gpu_governor/log/log_level` 文件。调整后会立即生效，无需重启模块。

**Q: 如何使用 WebUI？**
A: KernelSU/APatch 用户可在root管理器中点击本模块，选择"打开 WebUI"。Magisk 用户可安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 或 [SSU](https://ssu.oom-wg.dev/base/install) 应用来访问模块的 WebUI。

**Q: 配置文件和参数修改后需要重启吗？**
A: 不需要。模块支持配置文件热更新和多线程监控，所有更改（如频率表、游戏列表、日志等级等）均可实时生效，无需重启。
