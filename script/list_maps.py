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


def get_mod_names(mods: int):
    mod_names = []
    if (mods & 1) != 0:
        mod_names.append('NF')
    if (mods & 2) != 0:
        mod_names.append('EZ')
    if (mods & 8) != 0:
        mod_names.append('HD')
    if (mods & 16) != 0:
        mod_names.append('HR')
    if (mods & 32) != 0:
        mod_names.append((mods & 16384 != 0) and 'PF' or 'SD')
    if (mods & 64) != 0:
        mod_names.append((mods & 512 != 0) and 'NC' or 'DT')
    if (mods & 256) != 0:
        mod_names.append('HT')
    if (mods & 1024) != 0:
        mod_names.append('FL')
    return mod_names


def score_display_format(
        beatmap: osuapi.Beatmap, score: osuapi.Score, map_rank: int):
    mod_names = get_mod_names(int(score['enabled_mods']))
    accuracy = calc_acc(score)
    return ("{user} | {map_display}{mods} {accuracy:.2f}% {combo_or_fc}" +
            " {pp:.0f}pp #{map_rank}").format(
                user=score['username'],
                map_display=map_display_format(beatmap),
                mods=not mod_names and '' or ' +' + ''.join(mod_names),
                accuracy=accuracy,
                combo_or_fc=score['perfect'] != '0' and 'FC' or
                score['maxcombo'] + '/' + beatmap['max_combo'] + 'x' +
                score['countmiss'] + 'm',
                pp=float(score['pp'] or '0'),
                map_rank=map_rank)

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
    final *= pow(combo / max_combo, 0.8) if max_combo > 0 else 1
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
    max_combo = int(beatmap['max_combo'] or '0')
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
    8 | 64: 'HDDT',
    16 | 64: 'HRDT',
    8 | 16 | 64: 'HDHRDT'
}
ESSENTIAL_MODS_MASK = ~(1 | 32 | 512 | 16384)    # NF | SD | NC | PF


@memory.cached(compress=True)
def get_top_scores(beatmap_id: str):
    return osuapi.get_scores(beatmap_id)


def summalize_beatmap(beatmap: osuapi.Beatmap,
                      scores: List[osuapi.Score]) -> tuple:
    mod_fc_nums = defaultdict(lambda: 0)    # type: defaultdict
    min_misses = 99999
    for score in scores:
        mods = int(score['enabled_mods'])
        mods &= ESSENTIAL_MODS_MASK
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
        int(beatmap['max_combo'] or '0'),
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
                if (beatmap['approved'] in ['1', '2', '4']) and (
                    float(beatmap['difficultyrating']) >=
                    (beatmap['mode'] == '2' and 4.0 or 4.0))]
    filtered.sort(
        key=lambda beatmap: float(beatmap['difficultyrating']),
        reverse=True)

    summary = []
    for beatmap in filtered:
        print(beatmap['difficultyrating'], map_display_format(beatmap))
        # cached.remove_cache(get_top_scores)(beatmap['beatmap_id'])
        scores = get_top_scores(beatmap['beatmap_id'])
        row = summalize_beatmap(beatmap, scores)
        summary.append(row)

    with open('data/summary.json', 'w') as file:
        json.dump(summary, file, separators=[',', ':'])


def list_ar11_scores(filtered: List[osuapi.Beatmap]):
    for beatmap in filtered:
        original_ar = float(beatmap['diff_approach'])
        if original_ar * 1.4 < 10:
            continue
        scores = get_top_scores(beatmap['beatmap_id'])
        for map_rank_zo, score in enumerate(scores):
            mods = int(score['enabled_mods'])
            if (mods & 1) != 0:     # NoFail
                continue
            if (mods & 2) != 0:     # Easy
                continue
            if (mods & 64) == 0:    # DoubleTime
                continue
            if original_ar * ((mods & 16) != 0 and 1.4 or 1) < 10:
                continue
            print('{:.2f}☆ {}'.format(
                float(beatmap['difficultyrating']),
                score_display_format(beatmap, score, map_rank_zo + 1)))


def list_pp_ranking(filtered: List[osuapi.Beatmap]):
    threshold = 400
    ranking = []
    for beatmap in filtered:
        if beatmap['mode'] != '0':
            continue
        scores = get_top_scores(beatmap['beatmap_id'])
        for map_rank_zo, score in enumerate(scores):
            if float(score['pp'] or 'NaN') >= threshold:
                score['map_rank'] = map_rank_zo + 1
                score['beatmap'] = beatmap
                ranking.append(score)
    ranking.sort(key=lambda score: float(score['pp']), reverse=True)
    for rank_zo, score in enumerate(ranking):
        beatmap = score['beatmap']
        map_rank = score['map_rank']
        print('#{} {:.2f}pp: {:.2f}☆ {}'.format(
            rank_zo + 1,
            float(score['pp'] or 'NaN'),
            float(beatmap['difficultyrating']),
            score_display_format(beatmap, score, map_rank)))


if __name__ == '__main__':
    main()
