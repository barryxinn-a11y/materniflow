# -*- coding: utf-8 -*-

if __name__ == "__main__":
    from learn_materniflow.tests import run_cov_test

    run_cov_test(
        __file__,
        "learn_materniflow",
        is_folder=True,
        preview=False,
    )