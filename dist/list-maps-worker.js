"use strict";
var ListMaps;
(function (ListMaps) {
    importScripts('https://cdn.jsdelivr.net/pako/1.0.3/pako.min.js');
    onmessage = (event) => {
        const data = event.data;
        if (data.type === 'compress') {
            const compressed = pako.deflate(data.data);
            postMessage({
                type: 'callback',
                id: data.id,
                data: compressed
            });
        }
        else if (data.type === 'decompress') {
            const decompressed = pako.inflate(data.data);
            postMessage({
                type: 'callback',
                id: data.id,
                data: decompressed
            });
        }
    };
})(ListMaps || (ListMaps = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tYXBzLXdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saXN0LW1hcHMtd29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFJQSxJQUFVLFFBQVEsQ0F1QmpCO0FBdkJELFdBQVUsUUFBUTtJQUVsQixhQUFhLENBQUMsaURBQWlELENBQUMsQ0FBQztJQUVqRSxTQUFTLEdBQUcsQ0FBQyxLQUFtQixFQUFFLEVBQUU7UUFDaEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztRQUN4QixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO1lBQzFCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLFdBQVcsQ0FBQztnQkFDUixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNYLElBQUksRUFBRSxVQUFVO2FBQ25CLENBQUMsQ0FBQztTQUNOO2FBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRTtZQUNuQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxXQUFXLENBQUM7Z0JBQ1IsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDWCxJQUFJLEVBQUUsWUFBWTthQUNyQixDQUFDLENBQUM7U0FDTjtJQUNMLENBQUMsQ0FBQztBQUVGLENBQUMsRUF2QlMsUUFBUSxLQUFSLFFBQVEsUUF1QmpCIiwic291cmNlc0NvbnRlbnQiOlsiXG5kZWNsYXJlIGZ1bmN0aW9uIGltcG9ydFNjcmlwdHMoXzogYW55KTogYW55O1xuZGVjbGFyZSBmdW5jdGlvbiBwb3N0TWVzc2FnZShfOiBhbnkpOiBhbnk7XG5cbm5hbWVzcGFjZSBMaXN0TWFwcyB7XG5cbmltcG9ydFNjcmlwdHMoJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9wYWtvLzEuMC4zL3Bha28ubWluLmpzJyk7XG5cbm9ubWVzc2FnZSA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGE7XG4gICAgaWYgKGRhdGEudHlwZSA9PT0gJ2NvbXByZXNzJykge1xuICAgICAgICBjb25zdCBjb21wcmVzc2VkID0gcGFrby5kZWZsYXRlKGRhdGEuZGF0YSk7XG4gICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdjYWxsYmFjaycsXG4gICAgICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgICAgIGRhdGE6IGNvbXByZXNzZWRcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChkYXRhLnR5cGUgPT09ICdkZWNvbXByZXNzJykge1xuICAgICAgICBjb25zdCBkZWNvbXByZXNzZWQgPSBwYWtvLmluZmxhdGUoZGF0YS5kYXRhKTtcbiAgICAgICAgcG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogJ2NhbGxiYWNrJyxcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkLFxuICAgICAgICAgICAgZGF0YTogZGVjb21wcmVzc2VkXG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbn1cbiJdfQ==