# pylint: disable=C0111, W0621
import time
from typing import Any, List

import requests
from mypy_extensions import TypedDict

# pylint: disable=C0103
Beatmap = TypedDict('Beatmap', {
    'approved': str,
    'approved_date': str,

    'artist': str,
    'title': str,
    'version': str,

    'beatmap_id': str,
    'beatmapset_id': str,
    'file_md5': str,

    'difficultyrating': str,
    'diff_size': str,
    'diff_overall': str,
    'diff_approach': str,
    'diff_drain': str,
    'hit_length': str,
    'max_combo': str,

    'mode': str,
})
User = TypedDict('User', {
    'user_id': str,
    'username': str,
})
Score = TypedDict('Score', {
    'date': str,
    'enabled_mods': str,
    'user_id': str,
    'username': str,

    'count300': str,
    'count100': str,
    'count50': str,
    'countmiss': str,
    'maxcombo': str,
    'countkatu': str,
    'countgeki': str,
    'perfect': str,
    'pp': str,
})


API_SECRET = open('script/API_SECRET').read()


def call_api(api_name: str, params: dict) -> Any:
    params['k'] = API_SECRET
    tries = 0
    while True:
        try:
            req = requests.get(
                'https://osu.ppy.sh/api/' + api_name,
                params=params)
            out = req.json()
            if 'error' in out:
                raise Exception("osu!api returned an error of " + out["error"])
            time.sleep(2)
            return out
        except Exception as exc:  # pylint: disable=W0703
            tries += 1
            print(repr(exc) + ' catched. sleep and retrying...')
            time.sleep(1 << min(tries, 10))


def get_beatmaps(since: str, limit: int = 500) -> List[Beatmap]:
    params = {
        'since': since,
        'm': '2',
        'a': '1',
        'limit': str(limit),
    }
    return call_api('get_beatmaps', params)


def get_scores(beatmap_id: str, limit: int = 100) -> List[Score]:
    params = {
        'b': beatmap_id,
        'm': '2',
        'limit': str(limit),
    }
    return call_api('get_scores', params)


def get_user(user_id: str) -> User:
    params = {
        'u': user_id,
        'type': 'id',
        'm': '2',
    }
    return call_api('get_user', params)[0]
