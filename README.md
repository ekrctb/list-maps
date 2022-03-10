# <https://ekrctb.github.io/list-maps/>

## Run locally

First, download an osu! database dump file from <https://data.ppy.sh/>.

```shell
# This environment variable will be used.
# Change this variable to the latest available dump.
export OSU_DUMP_DIR="2022_03_01_performance_catch_top_10000"

curl -O "https://data.ppy.sh/${OSU_DUMP_DIR}.tar.bz2"
tar -xf "${OSU_DUMP_DIR}.tar.bz2"
```

Building the command-line tool requires [https://www.rust-lang.org/](Rust) with `cargo`.

Make sure your current directory is the root directory of this repository, then you can build and run the command by `cargo run`:

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

The environment variable `OSU_DUMP_DIR` is automatically used as the `--dump-dir` argument.

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
...
```

To generate the data files used by the frontend, run `render-maps` subcommand:

```shell
mkdir -p data

# Maps with star ratings no less than 4 are included.
# Use `--min-stars` to change this.
cargo run --release -- render-maps --output-dir data
```

To frontend is written in TypeScript. To build JavaScript files, run:

```shell
npm install
tsc
```

To access the frontend, you need to run a web server locally, as it doesn't work under a file URI. For example:

```shell
python3 -m http.server
```
