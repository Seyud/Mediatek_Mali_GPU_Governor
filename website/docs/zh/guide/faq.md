# 常见问题

## 基础使用问题

### Q: 如何确认模块正常工作？

A: @@include(../_includes/log-check-zh.md)

### Q: 游戏模式如何工作？

A: 当检测到 `games.toml` 中列出的应用在前台运行时，会自动应用游戏模式；游戏模式下会使用游戏列表中对应的模式

### Q: 如何添加自定义游戏到列表？

A: 编辑 `/data/adb/gpu_governor/game/games.toml` 文件，添加游戏的包名即可。或者通过 WebUI 界面的游戏列表页面进行添加。模块会在安装时自动扫描设备上已安装的游戏并生成初始游戏列表。

### Q: 如何调整日志等级？

A: 有三种方式：
1. 使用交互式菜单 `./action.sh` 选择日志等级
2. 通过 WebUI 界面的设置页面进行调整
3. 直接编辑 `/data/adb/gpu_governor/log/log_level` 文件

调整后会立即生效，无需重启模块。

@@include(../_includes/webui-usage-zh.md)

### Q: 配置文件和参数修改后需要重启吗？

A: 不需要。模块支持配置文件热更新和多线程监控，所有更改（如频率表、游戏列表、日志等级等）均可实时生效，无需重启。

## 故障排除

### 模块无法启动

1. 检查设备是否支持 GPUFreq 驱动
2. 查看初始化日志 `/data/adb/gpu_governor/log/initsvc.log`
3. 确认设备已正确 Root
4. 检查是否有权限问题

### WebUI 无法访问

1. 确认已安装支持的 WebUI 应用（KsuWebUI 或 SSU）
2. 检查模块是否正常运行
3. 重启 Root 管理器
4. 查看模块日志是否有错误信息

### 游戏模式不生效

1. 检查游戏是否在 `games.toml` 列表中
2. 确认游戏包名是否正确
3. 查看日志确认游戏检测是否正常工作
4. 通过 WebUI 界面检查游戏列表配置

### 频率调节异常

1. 检查 GPU 频率表配置是否正确
2. 确认电压设置是否在安全范围内
3. 查看系统日志是否有内核错误
4. 尝试使用默认配置

### 性能问题

1. 检查日志等级是否设置过低（debug 级别可能影响性能）
2. 调整采样间隔以平衡性能和功耗
3. 检查是否有其他调频模块冲突
4. 根据实际使用情况调整模式配置

## 技术支持

如果遇到其他问题：

1. 查看完整的日志文件
2. 收集设备信息和错误日志
3. 联系开发者或在项目页面提交问题
4. 加入 Telegram 群组或 QQ 群组获得帮助

联系方式：
- [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/MTK_GPU)
- [![QQ群](https://img.shields.io/badge/QQ群-719872309-12B7F5?logo=qq&logoColor=white)](https://qun.qq.com/universal-share/share?ac=1&authKey=zwOHClW5YTIZobOTsqvF6lBaACPvS7%2F2Y0s%2FpQadAMss5d2nxcr46fmsm%2FFreVjt&busi_data=eyJncm91cENvZGUiOiI3MTk4NzIzMDkiLCJ0b2tlbiI6IjhQNUhYM1M4NUs4bFVwQmNsODRrUU1Xc0phR3dra1RUYnE0S0tMVFNzV3JUU2s3elgvSFRyUXJQdWtEQ1NVYSsiLCJ1aW4iOiIxMTA1NzgzMDMzIn0%3D&data=VgJU9DuiAPqB3ocg4Zlh8UShvQmDEgEfH4wvqCVXWOD8qcBSzYDPQuwUKVgLOIzZ-CWhtV69fyTHD4Q0GqWWKw&svctype=4&tempid=h5_group_info)