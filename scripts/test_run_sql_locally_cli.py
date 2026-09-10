# -*- coding: utf-8 -*-

import fire
from materniflow.sql_utils import execute_and_print_result
from materniflow.one.api import one


def main(sql: str):
    execute_and_print_result(engine=one.local_sqlite_engine, sql=sql)


if __name__ == "__main__":
    fire.Fire(main)
