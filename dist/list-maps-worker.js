"use strict";
var ListMaps;
(function (ListMaps) {
    importScripts('https://cdn.jsdelivr.net/pako/1.0.3/pako.min.js');
    onmessage = function (event) {
        var data = event.data;
        if (data.type === 'compress') {
            var compressed = pako.deflate(data.data);
            postMessage({
                type: 'callback',
                id: data.id,
                data: compressed
            });
        }
        else if (data.type === 'decompress') {
            var decompressed = pako.inflate(data.data);
            postMessage({
                type: 'callback',
                id: data.id,
                data: decompressed
            });
        }
    };
})(ListMaps || (ListMaps = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLXdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saXN0LW1hcHMtd29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxJQUFVLFFBQVEsQ0F1QmpCO0FBdkJELFdBQVUsUUFBUTtJQUVsQixhQUFhLENBQUMsaURBQWlELENBQUMsQ0FBQztJQUVqRSxTQUFTLEdBQUcsVUFBQyxLQUFtQjtRQUM1QixJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3hCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7WUFDMUIsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsV0FBVyxDQUFDO2dCQUNSLElBQUksRUFBRSxVQUFVO2dCQUNoQixFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFVBQVU7YUFDbkIsQ0FBQyxDQUFDO1NBQ047YUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssWUFBWSxFQUFFO1lBQ25DLElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLFdBQVcsQ0FBQztnQkFDUixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNYLElBQUksRUFBRSxZQUFZO2FBQ3JCLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQyxDQUFDO0FBRUYsQ0FBQyxFQXZCUyxRQUFRLEtBQVIsUUFBUSxRQXVCakIiLCJzb3VyY2VzQ29udGVudCI6WyJuYW1lc3BhY2UgTGlzdE1hcHMge1xuXG5pbXBvcnRTY3JpcHRzKCdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvcGFrby8xLjAuMy9wYWtvLm1pbi5qcycpO1xuXG5vbm1lc3NhZ2UgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgIGNvbnN0IGRhdGEgPSBldmVudC5kYXRhO1xuICAgIGlmIChkYXRhLnR5cGUgPT09ICdjb21wcmVzcycpIHtcbiAgICAgICAgY29uc3QgY29tcHJlc3NlZCA9IHBha28uZGVmbGF0ZShkYXRhLmRhdGEpO1xuICAgICAgICBwb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiAnY2FsbGJhY2snLFxuICAgICAgICAgICAgaWQ6IGRhdGEuaWQsXG4gICAgICAgICAgICBkYXRhOiBjb21wcmVzc2VkXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZGF0YS50eXBlID09PSAnZGVjb21wcmVzcycpIHtcbiAgICAgICAgY29uc3QgZGVjb21wcmVzc2VkID0gcGFrby5pbmZsYXRlKGRhdGEuZGF0YSk7XG4gICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdjYWxsYmFjaycsXG4gICAgICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgICAgIGRhdGE6IGRlY29tcHJlc3NlZFxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG59XG4iXX0=