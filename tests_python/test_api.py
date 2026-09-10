# -*- coding: utf-8 -*-

from learn_materniflow import api


def test_api():
    _ = api.one


if __name__ == "__main__":
    from learn_materniflow.tests import run_cov_test

    run_cov_test(
        __file__,
        "learn_materniflow.api",
        preview=False,
    )
