# Logging System 📊

Log files are stored in `/data/adb/gpu_governor/log/` directory, mainly including:

- **gpu_gov.log**: Main log file, managed by Rust core, records GPU governor running status

- **initsvc.log**: Initialization log, records module startup process and script initialization information

Log content can be viewed through the WebUI interface or directly through a file manager.

## Log Management

The module's main log has been fully implemented by the Rust core, including:

- Log file creation and writing

- Automatic log rotation and size control

- Real-time monitoring and response to log level changes
