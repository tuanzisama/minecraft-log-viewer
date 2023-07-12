<template>
  <div class="editor-container" ref="editorRef"></div>
</template>

<script lang="ts" setup>
// import * as monaco from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { editor } from "monaco-editor";
import "monaco-editor/esm/vs/basic-languages/monaco.contribution";
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

const props = withDefaults(defineProps<MonacoEditorProps>(), {
  modelValue: "",
});

const editorRef = ref();
const editorInstance = shallowRef<editor.IStandaloneCodeEditor | null>(null);
const emit = defineEmits(["update:modelValue"]);

const privateValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

watch(
  () => privateValue.value,
  (newVal) => {
    if (newVal !== getEditorModel()?.getValue()) {
      getEditorModel().setValue(newVal);
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
  const editor = monaco.editor.create(editorRef.value, {
    value: privateValue.value,
    automaticLayout: true,
    language: "markdown",
    theme: "vs-dark",
  });

  editor.onDidChangeModelContent(() => {
    const value = getEditorModel().getValue();
    privateValue.value = value;
  });

  editorInstance.value = editor;
};

const getEditorModel = (): editor.ITextModel => {
  return monaco.editor.getModels()[0];
};

const disposeEditorInstance = () => {
  editorInstance.value?.dispose();
};

defineExpose<MonacoEditorExpose>({
  ref: editorRef,
  dispose: disposeEditorInstance,
});
</script>

<script lang="ts">
import { Ref } from "vue";

interface MonacoEditorProps {
  modelValue: string;
}

interface MonacoEditorExpose {
  ref: Ref<editor.IStandaloneCodeEditor | null>;
  dispose: () => void;
}
</script>

<style lang="less" scoped>
.editor-container {
  width: 100%;
  height: 100%;
}
</style>
