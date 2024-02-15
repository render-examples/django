#!/usr/bin/env bash
# exit on error
set -o errexit

# change this line for whichever package you use, such as pip, or poetry, etc.
pip install -r requirements.txt

# convert our static asset files on Render
python manage.py collectstatic --no-input

# apply any database migrations that are outstanding
python manage.py migrate