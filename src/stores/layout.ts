/**
 * 布局管理：加载内置 JSON 布局、切换当前布局。
 * 通过 Vite 的 import.meta.glob 静态导入所有 JSON 文件。
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Layout } from '@/types';

// 静态导入 src/layouts/*.json
const layoutModules = import.meta.glob<{ default: Layout }>('@/layouts/*.json', {
  eager: true,
});

function loadAllLayouts(): Layout[] {
  const layouts: Layout[] = [];
  for (const mod of Object.values(layoutModules)) {
    layouts.push(mod.default);
  }
  layouts.sort((a, b) => a.id.localeCompare(b.id));
  return layouts;
}

export const useLayoutStore = defineStore('layout', () => {
  const layouts = ref<Layout[]>(loadAllLayouts());
  const currentId = ref<string>(layouts.value[0]?.id ?? '');

  const current = computed<Layout | undefined>(() =>
    layouts.value.find((l) => l.id === currentId.value),
  );

  function switchTo(id: string) {
    if (layouts.value.some((l) => l.id === id)) {
      currentId.value = id;
    }
  }

  return { layouts, currentId, current, switchTo };
});
