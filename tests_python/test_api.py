# -*- coding: utf-8 -*-

from materniflow import api


def test_api():
    _ = api.one


if __name__ == "__main__":
    from materniflow.tests import run_cov_test

    run_cov_test(
        __file__,
        "materniflow.api",
        preview=False,
    )
