import logging.config
from os import path, mkdir


def init_loggers(mew_path):
    file_output_path = path.join(mew_path, "server/.log")
    if not path.exists(file_output_path):
        mkdir(file_output_path)
    logging.config.fileConfig(path.join(mew_path, "server/config/logging.conf"))
