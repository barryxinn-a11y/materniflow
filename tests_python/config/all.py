# -*- coding: utf-8 -*-

if __name__ == "__main__":
    from materniflow.tests import run_cov_test

    run_cov_test(
        __file__,
        "materniflow.config",
        is_folder=True,
        preview=False,
    )