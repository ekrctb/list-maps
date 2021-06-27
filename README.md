# <https://ekrctb.github.io/list-maps/>

## Run locally

First, download a osu! database dump file from <https://data.ppy.sh/>.

```shell
# Change this variable to the latest available dump.
DUMP_DATE=2021_06_01

curl -O "https://data.ppy.sh/${DUMP_DATE}_performance_fruits_top.tar.bz2"
tar -xf "${DUMP_DATE}_performance_fruits_top.tar.bz2"

# This environment variable will be used.
export OSU_DUMP_DIR="${DUMP_DATE}_performance_fruits_top"
```

Building the command requires [https://www.rust-lang.org/](Rust) with `cargo`.

Make sure your current directory is the top directory of this repository, then you can then build and run the command by `cargo run`:

```shell
# Build the command if not built yet, then run the command to print the usage
cargo run --release -- --help
```

```text
...

SUBCOMMANDS:
    find-score     Find scores using specified criteria.
    help           Prints this message or the help of the given subcommand(s)
    parse-test     Test dump file parsing
    render-maps    Output beatmap summary file to be used by the html/js interface.
```

Note that the environment variable `OSU_DUMP_DIR` is automatically used as the `--dump-dir` argument.

To get the usage of a subcommand, append `--help`:

```shell
cargo run --release -- find-score --help
```

```text
Find scores using specified criteria.

USAGE:
    list-maps --dump-dir <osu-dump-dir> find-score [FLAGS] [OPTIONS]

FLAGS:
    -h, --help       Prints help information
        --ctb        on the osu!catch specific map
        --no-dt      with DoubleTime (or NightCore) mod disabled.
        --no-ez      with Easy mod disabled.
...
```

To generate the file used by the frontend, run:

```shell
cargo run --release -- render-maps > ./data/summary.csv
```

To compile the frontend html and js files, run:

```shell
npm install
tsc
```
