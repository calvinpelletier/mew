import logging
import logging.config
import logging.handlers
from os import path, mkdir


def init_loggers(mew_path):
    logfile_dir = path.join(mew_path, "server/.log")
    logfile_path = path.join(logfile_dir, "out")
    if not path.exists(logfile_dir):
        mkdir(logfile_dir)
    logging.config.fileConfig(path.join(mew_path, "server/config/logging.conf"))

    # Create file handler for main logs
    file_handler = logging.handlers.RotatingFileHandler(logfile_path, maxBytes=5e7)
    formatter_w_date = \
        logging.Formatter("%(asctime)s [%(name)s - %(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    file_handler.setFormatter(formatter_w_date)
    logging.getLogger("main").addHandler(file_handler)
