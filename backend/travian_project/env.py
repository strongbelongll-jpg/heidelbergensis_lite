# -*- coding: utf-8 -*-
"""Чтение файла .env без сторонних библиотек.

Строки KEY=VALUE, пустые и начинающиеся с # пропускаются, кавычки вокруг
значения снимаются. Переменные, уже заданные в окружении (docker-compose,
системные), НЕ перезаписываются - файл только дополняет их.
"""
import os


def zagruzit_env(put, environ=None):
    """Прочитать файл .env в словарь окружения. Нет файла - ничего не делаем."""
    if environ is None:
        environ = os.environ
    zagruzheno = {}
    try:
        with open(put, encoding="utf-8") as fh:
            stroki = fh.read().splitlines()
    except OSError:
        return zagruzheno
    for stroka in stroki:
        stroka = stroka.strip()
        if not stroka or stroka.startswith("#") or "=" not in stroka:
            continue
        key, value = stroka.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if key and key not in environ:
            environ[key] = value
            zagruzheno[key] = value
    return zagruzheno
