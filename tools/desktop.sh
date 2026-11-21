#!/bin/sh
# Start the bundled Bangkok map or check the bundled development tools.
set -eu

usage() {
    echo "Usage: sh tools/desktop.sh serve [--port PORT] | check | python [ARGS...]" >&2
}

mode=${1:-serve}
case "$mode" in
    serve|check|python) ;;
    *) usage; exit 2 ;;
esac
if [ "$#" -gt 0 ]; then shift; fi

cd "$(dirname "$0")/.."
root=$PWD
case "$(uname -s)/$(uname -m)" in
    Darwin/arm64) platform=darwin-arm64 ;;
    Linux/x86_64) platform=linux-x86_64 ;;
    *) echo "Use the desktop bundle on Apple Silicon macOS or x86-64 GNU/Linux." >&2; exit 1 ;;
esac

payload=$root/desktop
python_archive=$payload/runtimes/$platform.tar.gz
if [ ! -f "$python_archive" ]; then
    echo "Extract the Desktop mode ZIP and run this command from the extracted bundle." >&2
    exit 1
fi

cache=$root/build/desktop/$platform
runtime=$cache/python
environment=$cache/venv
wheels=$payload/wheels/$platform
if [ ! -f "$runtime/.ready" ] || { [ "$mode" != serve ] && [ ! -f "$environment/.ready" ]; }; then
    mkdir -p "$cache"
    if ! mkdir "$cache/preparing" 2>/dev/null; then
        echo "Desktop setup is already in progress in $cache." >&2
        exit 1
    fi
    trap 'rmdir "$cache/preparing"' 0
    trap 'exit 1' HUP INT TERM

    if [ ! -f "$runtime/.ready" ]; then
        mkdir -p "$runtime"
        tar -xzf "$python_archive" --strip-components 1 -C "$runtime"
        touch "$runtime/.ready"
    fi
    if [ "$mode" != serve ] && [ ! -f "$environment/.ready" ]; then
        "$runtime/bin/python3" -m venv "$environment"
        PIP_CONFIG_FILE=/dev/null "$environment/bin/python" -m pip --isolated --disable-pip-version-check             install --no-index --no-cache-dir --only-binary=:all: --require-hashes             --find-links "$wheels" -r "$wheels/requirements.txt"
        touch "$environment/.ready"
    fi
    rmdir "$cache/preparing"
    trap - 0 HUP INT TERM
fi

case "$mode" in
    serve)
        city=$payload/city
        exec "$runtime/bin/python3" -m simlife_map serve "$city/bangkok.map.json.gz" \
            --train-lines "$city/bangkok.trains.json" "$@"
        ;;
    check)
        PATH="$environment/bin:$PATH"
        export PATH
        exec "$environment/bin/python" tools/check_toolchain.py "$@"
        ;;
    python)
        PATH="$environment/bin:$PATH"
        export PATH
        exec "$environment/bin/python" "$@"
        ;;
esac
