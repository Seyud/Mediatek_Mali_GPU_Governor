// 常量定义模块
export const PATHS = {
    LOG_PATH: '/data/adb/gpu_governor/log',
    CONFIG_PATH: '/data/adb/gpu_governor/config/gpu_freq_table.toml',
    CUSTOM_CONFIG_PATH: '/data/adb/gpu_governor/config/config.toml',
    CURRENT_MODE_PATH: '/data/adb/gpu_governor/config/current_mode',
    GAMES_FILE: '/data/adb/gpu_governor/game/games.toml',
    LOG_LEVEL_PATH: '/data/adb/gpu_governor/log/log_level'
};

export const VOLT_LIST = [
    65000, 64375, 63750, 63125, 62500, 61875, 61250, 60625, 60000,
    59375, 58750, 58125, 57500, 56875, 56250, 55625, 55000, 54375, 53750,
    53125, 52500, 51875, 51250, 50625, 50000, 49375, 48750, 48125, 47500,
    46875, 46250, 45625, 45000, 44375, 43750, 43125, 42500, 41875
];

export const VOLT_SETTINGS = {
    VOLT_STEP: 625,
    MAX_VOLT: 65000,
    MIN_VOLT: 41875
};