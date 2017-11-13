import logging
import logging.config
import logging.handlers
from os import path, mkdir

# `from log import *` will just include the default logging methods.
__all__ = ['debug', 'info', 'warn', 'error']

LOG_CONFIG_DIR = "server/config/server_log.conf"
LOG_DIR = "/var/log/mew/"

_lg = None


def init_loggers(mew_path):
    global _lg
    if not path.exists(LOG_DIR):
        mkdir(LOG_DIR)
    logging.config.fileConfig(path.join(mew_path, LOG_CONFIG_DIR))
    _lg = logging.getLogger("main")


def debug(msg, *args):
    _lg.debug(msg, *args)


def info(msg, *args):
    _lg.info(msg, *args)


def warn(msg, *args):
    _lg.warn(msg, *args)


def error(msg, *args):
    _lg.error(msg, *args)

def set_verbose():
    _lg.l