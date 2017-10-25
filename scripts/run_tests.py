#!/usr/bin/python
import subprocess
from os import environ, path, chdir

mew_server_root = path.join(environ["MEW_PATH"], "server")
chdir(mew_server_root)
exit(subprocess.call("python -m unittest discover", shell=True, env=environ))