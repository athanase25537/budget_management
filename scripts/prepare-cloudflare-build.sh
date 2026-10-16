#!/usr/bin/env sh
set -eu

# Wrangler adds python_modules/ to the Python import path. Copy the
# application package there so it is available alongside Pywrangler's vendored
# third-party dependencies at runtime.
mkdir -p python_modules/backend
cp -R backend/. python_modules/backend/
