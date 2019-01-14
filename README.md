# https://ekrctb.github.io/list-maps/

## Building the site

Requires Rust Nightly.

Crate `API_SECRET` file at the working directory containing osu! api key <https://osu.ppy.sh/p/api>.

### Rendering json files
```
# Get ranked beatmaps
cargo run --release -- get-maps
# Get top 100 scores for each beatmap
cargo run --release -- get-scores
# Render summary.json
cargo run --release -- render-maps
# Render ranking.json
cargo run --release -- render-ranking
```

### Compiling js files
```
npm install
tsc -p .
```
