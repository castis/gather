#!/bin/bash
pipenv run flask db upgrade
exec pipenv run "$@"
