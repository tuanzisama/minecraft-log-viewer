<template>
  <div class="editor-container" ref="editorRef"></div>
</template>

<script lang="ts" setup>
import { loader } from "./monaco";
import { editor } from "monaco-editor";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

const props = withDefaults(defineProps<MonacoEditorProps>(), {
  modelValue: "",
  theme: "vs",
});

const editorRef = ref();
const editorInstance = shallowRef<editor.IStandaloneCodeEditor | null>(null);
const monaco = shallowRef<typeof import("monaco-editor/esm/vs/editor/editor.api")>();
const emit = defineEmits(["update:modelValue"]);

const privateValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

watch(
  () => privateValue.value,
  (newVal) => {
    if (newVal !== getEditorModel()?.getValue()) {
      getEditorModel()?.setValue(newVal);
    }
  }
);

onMounted(() => {
  initEditorInstance();
});

onBeforeUnmount(() => {
  disposeEditorInstance();
});

const initEditorInstance = () => {
  loader.config({
    paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.40.0/min/vs" },
    "vs/nls": { availableLanguages: { "*": "zh-cn" } },
  });

  loader.init().then(($monaco) => {
    monaco.value = $monaco;
    const editor = $monaco.editor.create(editorRef.value, {
      value: privateValue.value,
      automaticLayout: true,
      language: "markdown",
      theme: props.theme,
    });

    editor.onDidChangeModelContent(() => {
      const value = getEditorModel()?.getValue();
      if (value) privateValue.value = value;
    });

    editorInstance.value = editor;
  });
};

const getEditorModel = (): editor.ITextModel | null => {
  return editorInstance.value?.getModel() ?? null;
  //   return monaco.editor.getModels()[0];
};

const disposeEditorInstance = () => {
  editorInstance.value?.dispose();
};

const scrollToVertex = () => {
  editorInstance.value?.setScrollTop(0);
  editorInstance.value?.setScrollLeft(0);
};

const setTheme = (theme: EditorThemeType) => {
  monaco.value?.editor.setTheme(theme);
};

defineExpose<MonacoEditorExpose>({
  $ref: editorRef,
  dispose: disposeEditorInstance,
  scrollToVertex,
  setTheme,
});
</script>

<script lang="ts">
import { Ref } from "vue";
export type EditorThemeType = "vs" | "vs-dark" | "hc-black" | "hc-light" | string;

export interface MonacoEditorProps {
  modelValue: string;
  theme: EditorThemeType;
}

export interface MonacoEditorExpose {
  $ref: Ref<editor.IStandaloneCodeEditor | null>;
  dispose: () => void;
  scrollToVertex: () => void;
  setTheme: (theme: EditorThemeType) => void;
}
</script>

<style lang="less" scoped>
.editor-container {
  width: 100%;
  height: 100%;
}
</style>
