# 安装指南

@@include(../_includes/requirements-zh.md)

## 安装步骤

1. 下载[最新版本的模块](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases/latest)
2. 在 Root 管理器中安装模块
3. 重启设备
4. 模块会自动检测设备型号并应用适配配置
5. 查看日志确认模块正常工作

## 验证安装

安装完成后，可以通过以下方式验证模块是否正常工作：

- @@include(../_includes/log-check-zh.md)
- 使用 `action.sh` 脚本查看模块状态

### action.sh 脚本使用

模块提供了 `action.sh` 脚本，支持通过音量键进行交互式操作：

**脚本功能**：

- **控制调速器服务**：启动或停止 GPU 调速器服务
- **设置日志等级**：选择 debug、info、warn 或 error 级别
- **查看模块状态**：显示模块版本、运行状态等信息

**操作方式**：

- 音量上键：向下选择选项（在菜单中递增选择项）
- 音量下键：确认选择

脚本会自动检测当前系统语言，并显示相应的中文或英文界面。

如果遇到问题，请查看日志文件或联系[技术支持](./faq.md#技术支持)。