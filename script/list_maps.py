# pylint: disable=C0111, W0621
import json
import math
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List   # pylint: disable=W0611

import cached
import osuapi

memory = cached.Memory()    # pylint: disable=C0103


@memory.cached(stale_after=timedelta(days=10))
def user_id_to_username(user_id: str) -> str:
    return osuapi.get_user(user_id)['username']


def map_display_format(beatmap):
    return '{artist} - {title} [{version}]'.format(**beatmap)


GET_BEATMAPS_LIMIT = 500


@memory.cached(compress=True)
def get_beatmaps_from(last_date: datetime) -> List[osuapi.Beatmap]:
    return osuapi.get_beatmaps(
        (last_date - timedelta(seconds=1)).strftime('%Y-%m-%d %H:%M:%S'),
        GET_BEATMAPS_LIMIT)


@memory.cached(stale_after=timedelta(days=1), compress=True)
def get_all_beatmaps() -> List[osuapi.Beatmap]:
    last_date = datetime(2007, 1, 1)
    all_beatmaps = []
    known_maps = set()  # type: set

    while True:
        maps = get_beatmaps_from(last_date)
        if len(maps) < GET_BEATMAPS_LIMIT:
            cached.remove_cache(get_beatmaps_from)(last_date)
        updated = False
        for beatmap in maps:
            approved_date = datetime.strptime(
                beatmap['approved_date'], '%Y-%m-%d %H:%M:%S')
            last_date = max(last_date, approved_date)

            md5 = beatmap['file_md5']
            if md5 in known_maps:
                continue

            known_maps.add(md5)
            all_beatmaps.append(beatmap)
            updated = True

        if not updated and len(maps) < GET_BEATMAPS_LIMIT:
            break

    return all_beatmaps


# pylint: disable=R0913
def calc_pp(stars, approach_rate, max_combo, combo, acc, miss):
    # https://pakachan.github.io/osustuff/ppcalculator.html
    final = pow((5 * stars / 0.0049) - 4, 2) / 100000
    length_bonus = 0.95 + 0.4 * min(1.0, max_combo / 3000.0)
    if max_combo > 3000:
        length_bonus += math.log10(max_combo / 3000.0) * 0.5
    final *= length_bonus
    final *= pow(0.97, miss)
    final *= pow(combo / max_combo, 0.8)
    if approach_rate > 9:
        final *= 1 + 0.1 * (approach_rate - 9.0)
    if approach_rate < 8:
        final *= 1 + 0.025 * (8.0 - approach_rate)
    final *= pow(acc / 100, 5.5)
    hd_bonus = 1.05 + 0.075 * (10.0 - min(10, approach_rate))
    fl_bonus = 1.35 * length_bonus
    return {
        'NM': final,
        'HD': final * hd_bonus,
        'FL': final * fl_bonus,
        'HDFL': final * hd_bonus * fl_bonus
    }


def calc_pp_for_map(beatmap: osuapi.Beatmap):
    stars = float(beatmap['difficultyrating'])
    approach_rate = float(beatmap['diff_approach'])
    max_combo = int(beatmap['max_combo'])
    return calc_pp(stars, approach_rate, max_combo, max_combo, 100, 0)['NM']


def calc_acc(score: osuapi.Score) -> float:
    c300 = float(score['count300'])
    c100 = float(score['count100'])
    c50 = float(score['count50'])
    ckatu = float(score['countkatu'])
    cmiss = float(score['countmiss'])
    return 100.0 * (c300 + c100 + c50) / (c300 + c100 + c50 + ckatu + cmiss)


MOD_NAME = {
    0: 'NM',
    8: 'HD',
    16: 'HR',
    64: 'DT',
    8 | 16: 'HDHR',
    8 | 64: 'HDDT'
}


@memory.cached(compress=True)
def get_top_scores(beatmap_id: str):
    return osuapi.get_scores(beatmap_id)


def summalize_beatmap(beatmap: osuapi.Beatmap,
                      scores: List[osuapi.Score]) -> tuple:
    mod_fc_nums = defaultdict(lambda: 0)    # type: defaultdict
    min_misses = 99999
    for score in scores:
        mods = int(score['enabled_mods'])
        mods &= ~(1 | 32 | 512 | 16384)    # NF | SD | NC | PF
        if (mods & 256) != 0:    # HalfTime
            continue
        min_misses = min(min_misses, int(score['countmiss']))
        mod_name = MOD_NAME.get(mods)
        if score['perfect'] == '1' and mod_name is not None:
            mod_fc_nums[mod_name] += 1

    return (
        int(beatmap['approved']),
        beatmap['approved_date'],
        int(beatmap['mode']),
        beatmap['beatmap_id'],
        beatmap['beatmapset_id'],
        map_display_format(beatmap),
        float(beatmap['difficultyrating']),
        float(calc_pp_for_map(beatmap)),
        float(beatmap['hit_length']),
        int(beatmap['max_combo']),
        float(beatmap['diff_approach']),
        float(beatmap['diff_size']),
        min_misses,
        mod_fc_nums['NM'],
        mod_fc_nums['HD'],
        mod_fc_nums['HR'],
        mod_fc_nums['HDHR'],
        mod_fc_nums['DT'],
        mod_fc_nums['HDDT'],
    )


def main():
    raw_list = get_all_beatmaps()
    filtered = [beatmap for beatmap in raw_list
                if float(beatmap['difficultyrating']) >= 4.0 and
                beatmap['approved'] in ['1', '2', '4']]
    filtered.sort(
        key=lambda beatmap: float(beatmap['difficultyrating']),
        reverse=True)

    summary = []
    for beatmap in filtered:
        print(beatmap['difficultyrating'], map_display_format(beatmap))
        scores = get_top_scores(beatmap['beatmap_id'])
        row = summalize_beatmap(beatmap, scores)
        summary.append(row)

    with open('data/summary.json', 'w') as file:
        json.dump(summary, file, separators=[',', ':'])


if __name__ == '__main__':
    main()
