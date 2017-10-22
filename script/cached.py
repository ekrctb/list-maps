# pylint: disable=C0111, W0621
"""
Function memorization
"""
import bz2
import pickle
from datetime import datetime, timedelta
from typing import Any, Callable, Optional, TypeVar, cast

import pymongo
from mypy_extensions import TypedDict

# pylint: disable=C0103
FuncType = TypeVar('FuncType', bound=Callable[..., Any])
# pylint: disable=C0103
CacheEntry = TypedDict('CacheEntry', {
    'format_flags': int,
    'serialized_value': bytes,
    'expiration_date': datetime
    })


FORMAT_COMPRESS_VALUE = 1 << 1


class CachedFunction:
    # pylint: disable=R0913
    def __init__(self,
                 get_entry: Callable[[bytes], Optional[CacheEntry]],
                 set_entry: Callable[[str, bytes, Optional[CacheEntry]], None],
                 func: FuncType,
                 stale_after: Optional[timedelta],
                 compress: bool) -> None:
        self.get_entry = get_entry
        self.set_entry = set_entry
        self.func = func
        self.stale_after = stale_after
        self.compress = compress

    def __call__(self, *args, **kwargs):
        return self.cached_call(*args, **kwargs)

    def cached_call(self, *args, **kwargs):
        key = self.args_to_key(args, kwargs)
        entry = self.get_entry(key)
        if entry is not None and entry['expiration_date'] < datetime.utcnow():
            entry = self.remove_cache_by_key(key)
        if entry is None:
            value = self.func(*args, **kwargs)
            entry = self.make_entry(
                value,
                self.get_format(),
                self.get_expiration_date())
            self.set_entry(self.get_func_name(), key, entry)
        return self.get_entry_value(entry)

    def get_format(self) -> int:
        format_flags = 0
        if self.compress:
            format_flags |= FORMAT_COMPRESS_VALUE
        return format_flags

    def remove_cache_by_args(self, *args, **kwargs):
        key = self.args_to_key(args, kwargs)
        self.remove_cache_by_key(key)

    def get_func_name(self) -> str:
        return self.func.__name__

    def remove_cache_by_key(self, key: bytes) -> None:
        self.set_entry(self.get_func_name(), key, None)
        return None

    def repair_entry_format_by_key(self, key: bytes):
        entry = self.get_entry(key)
        if entry:
            value = self.get_entry_value(entry)
            format_flags = self.get_format()
            entry = self.make_entry(
                value,
                format_flags,
                self.get_expiration_date())
        self.set_entry(self.get_func_name(), key, entry)

    def repair_entry_format_by_args(self, *args, **kwargs):
        return self.repair_entry_format_by_key(self.args_to_key(args, kwargs))

    def get_expiration_date(self):
        if self.stale_after:
            return datetime.utcnow() + self.stale_after
        return datetime.max

    def make_entry(self, value: Any,
                   format_flags: int, expiration_date: datetime):
        serialized_value = self.serialize(
            value,
            (format_flags & FORMAT_COMPRESS_VALUE) != 0)

        # pylint: disable=E1102
        entry = CacheEntry(
            format_flags=format_flags,
            serialized_value=serialized_value,
            expiration_date=expiration_date)

        return entry

    def get_entry_value(self, entry: CacheEntry):
        format_flags = entry['format_flags']
        value = self.deserialize(
            entry['serialized_value'],
            (format_flags & FORMAT_COMPRESS_VALUE) != 0)
        return value

    def args_to_key(self, args, kwargs) -> bytes:
        return self.serialize(args + tuple(sorted(kwargs.items())), False)

    @staticmethod
    def serialize(value: Any, compress: bool) -> bytes:
        serialized = pickle.dumps(value)
        if compress:
            serialized = bz2.compress(serialized)
        return serialized

    @staticmethod
    def deserialize(serialized: bytes, compress: bool) -> Any:
        if compress:
            serialized = bz2.decompress(serialized)
        return pickle.loads(serialized)


# pylint: disable=R0903
class Memory:
    def __init__(self):
        self.client = pymongo.MongoClient()
        database = self.client.get_database('misc')
        self.collection = database.get_collection('python_cached')

    def cached(self,
               stale_after: Optional[timedelta] = None,
               compress: bool = False) -> Callable[[FuncType], FuncType]:
        def get_entry(key: bytes) -> Optional[CacheEntry]:
            result = self.collection.find_one({'key': key})
            if result is None:
                return None
            return CacheEntry(  # pylint: disable=E1102
                format_flags=result.get('format_flags', 0),
                serialized_value=result.get('serialized_value'),
                expiration_date=result.get('expiration_date'))

        def set_entry(func_name: str, key: bytes, entry: Optional[CacheEntry]):
            query = {
                'func_name': func_name,
                'key': key
            }
            if entry is None:
                self.collection.delete_one(query)
            else:
                self.collection.update_one(query, {'$set': {
                    'func_name': func_name,
                    'key': key,
                    'format_flags': entry['format_flags'],
                    'serialized_value': entry['serialized_value'],
                    'expiration_date': entry['expiration_date']
                }}, True)

        def wrap(func: FuncType):
            return CachedFunction(
                get_entry, set_entry, func,
                stale_after=stale_after,
                compress=compress)

        return wrap


def cached_function(cached: FuncType) -> CachedFunction:
    return cast(CachedFunction, cached)


def remove_cache(cached: FuncType) -> FuncType:
    return cached_function(cached).remove_cache_by_args    # type: ignore
