import logging
import sys
from flask import Flask


def setup_logging(app):
    fmt = logging.Formatter(
        "[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(fmt)
    handler.setLevel(logging.DEBUG)

    app.logger.handlers.clear()
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.DEBUG)

    root = logging.getLogger("taskflow")
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.DEBUG)


logger = logging.getLogger("taskflow")