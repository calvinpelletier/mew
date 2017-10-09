#!/usr/bin/python
import subprocess
from os import environ, path, chdir

mew_server_root = path.join(environ["MEW_PATH"], "server")
chdir(mew_server_root)
environ["PYTHONPATH"] = mew_server_root
full_test_path = path.join(mew_server_root, "test/test_main.py")
exit(subprocess.call("python %s" % full_test_path, shell=True, env=environ))
