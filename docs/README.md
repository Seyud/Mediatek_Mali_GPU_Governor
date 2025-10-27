**简体中文** | [English](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/en/README.md)

# 天玑 GPU 调速器 🚀

[![Version](https://img.shields.io/github/v/release/Seyud/Mediatek_Mali_GPU_Governor?logo=github)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases/latest)
[![GitHub Downloads](https://img.shields.io/github/downloads/Seyud/Mediatek_Mali_GPU_Governor/total?logo=github&logoColor=green)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases)
[![Language](https://img.shields.io/badge/language-Rust-orange?logo=rust&logoColor=orange)](https://www.rust-lang.org/)
[![Telegram](https://img.shields.io/badge/chat-Telegram-2CA5E0?logo=telegram&logoColor=87CEEB)](https://t.me/MTK_GPU)
[![QQ群](https://img.shields.io/badge/QQ群-719872309-12B7F5?logo=qq&logoColor=white)](https://qun.qq.com/universal-share/share?ac=1&authKey=zwOHClW5YTIZobOTsqvF6lBaACPvS7%2F2Y0s%2FpQadAMss5d2nxcr46fmsm%2FFreVjt&busi_data=eyJncm91cENvZGUiOiI3MTk4NzIzMDkiLCJ0b2tlbiI6IjhQNUhYM1M4NUs4bFVwQmNsODRrUU1Xc0phR3dra1RUYnE0S0tMVFNzV3JUU2s3elgvSFRyUXJQdWtEQ1NVYSsiLCJ1aW4iOiIxMTA1NzgzMDMzIn0%3D&data=VgJU9DuiAPqB3ocg4Zlh8UShvQmDEgEfH4wvqCVXWOD8qcBSzYDPQuwUKVgLOIzZ-CWhtV69fyTHD4Q0GqWWKw&svctype=4&tempid=h5_group_info)

## 简介 📝

<img src="https://seyud.github.io/Mediatek_Mali_GPU_Governor/logo.png" style="width: 96px;" alt="logo">

天玑 GPU 调速器（Mediatek Mali GPU Governor）是一个专为联发科处理器设计的先进 GPU 调速器。采用 **Rust 语言** 开发的高性能核心引擎，通过智能监控 GPU 负载并动态调整频率，在游戏体验和功耗平衡之间达到最佳平衡。模块集成了现代化的 **WebUI 管理界面** 和 **完整的游戏模式检测**，为用户提供优秀的 GPU 调速解决方案。

## 相关开源项目 📦

**核心源码仓库**: [GPU-Governor-Core](https://github.com/Seyud/GPU-Governor-Core)

## 特性 ✨

### 核心功能

- 🎮 **智能游戏模式**：自动检测 `games.toml` 中配置的游戏应用，应用性能优化的 GPU 频率策略
- ⚙️ **自定义配置系统**：通过 `config.toml` 配置文件灵活调整调速策略，支持全局配置和四种模式配置项
- 📊 **实时负载监控**：基于 Rust 高性能实现，实时监控 GPU 负载
- 🔄 **自适应调频算法**：游戏模式使用激进升频策略，普通模式使用节能降频策略
- 🎯 **精确频率控制**：完全支持 GPUFreq v1/v2 驱动，自动检测驱动版本并适配
- ⚙️ **智能频率写入**：V2 驱动优化机制，减少不必要的频率写入操作
- 🎛️ **电压与内存联动**：支持 DDR 频率档位调节，电压与频率精确对应

### 用户界面与交互

- 🖥️ **现代化 WebUI**：基于 KernelSU API 的图形化管理界面，使用 Miuix 风格设计
- 🌓 **智能主题系统**：支持深色/浅色/自动模式，自动适应系统设置
- 🌐 **完整多语言支持**：支持中文和英文界面，自动检测系统语言设置
- 📊 **可视化配置编辑**：支持通过 WebUI 直接编辑频率表，自定义配置和游戏列表
- 🔧 **交互式控制脚本**：提供 `action.sh` 音量键控制脚本，支持服务管理和日志等级设置

### 技术特性

- 🦀 **Rust 核心引擎与多线程监控**：使用 Rust 语言开发，保证内存安全、零成本抽象和极致性能。主程序采用多线程架构，分别负责GPU负载监控、前台应用监控、频率表文件热更新、自定义配置监控、日志等级监控等，确保调速器实时响应系统状态变化。
- 🔧 **高度可定制化**：通过配置文件自定义 GPU 频率、电压和内存档位
- 📱 **广泛设备兼容**：支持 Dimensity 系列联发科处理器
- 📝 **专业日志系统**：支持 debug/info/warn/error 四级日志
- 🔄 **自动设备适配**：安装时自动检测设备型号并应用适配模块配置

## 文档导航 📚

- [安装要求](installation.md) - 设备要求和 WebUI 功能要求
- [配置文件](configuration.md) - 自定义配置、GPU 频率表、游戏列表和交互式控制菜单
- [日志系统](logging.md) - 日志文件说明和日志管理
- [支持的设备](supported-devices.md) - 兼容的设备列表
- [WebUI 界面](webui.md) - WebUI 功能特性和界面布局
- [常见问题](faq.md) - 常见问题解答

## 致谢 🙏

- **开发者**: 瓦力喀 @CoolApk, Tools-cx-app @GitHub
- **特别感谢**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @GitHub
- **测试反馈**: 内测群组全体群友
- **配置协助**: Fiagelia @CoolApk, 忘渐 @CoolApk

## 注意事项 ⚠️

- 修改 GPU 频率和电压可能会影响设备稳定性
- 不当的配置可能导致设备性能或稳定问题
- 如遇到问题，可以查看日志文件进行排查
