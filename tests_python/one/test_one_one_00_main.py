# -*- coding: utf-8 -*-

from materniflow.one.one_00_main import one


def test_one():
    _ = one


if __name__ == "__main__":
    from materniflow.tests import run_cov_test

    run_cov_test(
        __file__,
        "materniflow.one.one_00_main",
        preview=False,
    )
