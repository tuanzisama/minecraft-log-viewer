<template>
  <div class="main-page">
    <section class="main-header">
      <p>Minecraft Log Viewer</p>
      <div class="page-controll-box">
        <a href="https://github.com/tuanzisama/minecraft-log-viewer" target="_blank">Github</a>
        <a href="https://mcg.tuanzi.ink/" target="_blank">
          <span class="material-symbols-outlined"> palette </span>
        </a>
        <theme-switch v-model="appStore.theme" @on-change="onThemeChangeHandler" />
      </div>
    </section>
    <div class="main-container">
      <file-list
        @on-load-before="onLoadBeforeHandler"
        @on-load-error="onFileListLoadErrorHandler"
        @on-change="onFilelistChangeHandler"
        @on-removed="onRemovedHandler"
      />
      <div class="workspace-wrapper">
        <work-space-tab-bar />
        <work-space ref="workSpaceRef" v-model="editorValue" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, onMounted, ref } from "vue";
import ThemeSwitch from "../../components/ThemeSwitch";
import FileList from "../../components/FileList";
import { WorkSpaceTabBar, WorkSpace, WorkspaceExpose } from "../../components/Workspace";
import { useAppStore } from "../../plugins/store/modules/app";
import { LogFile, useFileStore } from "../../plugins/store/modules/file";
import { DialogPlugin } from "tdesign-vue-next";

const appStore = useAppStore();
const fileStore = useFileStore();

const editorValue = ref("");
const workSpaceRef = ref<WorkspaceExpose>();

const getWelcomeText = () => {
  return `[${new Date().toLocaleTimeString()}] [Minecraft Log Viewer] Welcome!`;
};

onMounted(() => {
  editorValue.value = getWelcomeText();
});

const onThemeChangeHandler = (val: string) => {
  document.documentElement.setAttribute("theme-mode", val);
  if (val === "light") {
    workSpaceRef.value?.getEditorRef()?.setTheme("vs");
  } else if (val === "dark") {
    workSpaceRef.value?.getEditorRef()?.setTheme("vs-dark");
  }
};

onMounted(() => {
  document.documentElement.setAttribute("theme-mode", appStore.theme);
});

const onLoadBeforeHandler = () => {
  editorValue.value = `[${new Date().toLocaleTimeString()}] [Minecraft Log Viewer] Loading...`;
};

const onFileListLoadErrorHandler = (logFile: LogFile, error: Error) => {
  DialogPlugin.alert({
    header: `Throw an exception when loading file.`,
    body: () => [
      h("div", { class: "load-exception-dialog" }, [
        h("p", {}, [h("span", "Name: "), h("span", logFile.file.name)]),
        h("p", {}, [h("span", "Size: "), h("span", logFile.fileSize)]),
        h("p", {}, [h("span", "Last-modified: "), h("span", logFile.fileLastModified)]),
        h("div", { class: "exception-box" }, [h("pre", error.message ?? "unknown error.")]),
      ]),
    ],
    confirmBtn: { content: "Fine", variant: "base", theme: "danger" },
  });
};

const onFilelistChangeHandler = (value: LogFile) => {
  workSpaceRef.value?.getEditorRef()?.scrollToVertex();
  editorValue.value = value.decode?.content() ?? "";
};

const onRemovedHandler = (logFiles: LogFile[]) => {
  if (fileStore.currentRecord !== null && logFiles.includes(fileStore.currentRecord)) {
    editorValue.value = getWelcomeText();
  }
};
</script>

<style lang="less" scoped>
.main-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--theme-background);
  color: var(--theme-font-color);
  transition: all 0.3s;
  a {
    text-decoration: none;
    color: var(--theme-font-color);
    &:visited {
      color: var(--theme-font-color);
    }
  }

  .main-header {
    width: 100%;
    height: 60px;
    font-size: 18px;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
    padding: var(--theme-padding);
    .flex-hcenter();
    .page-controll-box {
      .flex-hcenter();
      margin-left: auto;
      font-size: 16px;
      user-select: none;
      cursor: pointer;
      & > * {
        margin-left: 10px;
      }
    }
  }
  .main-container {
    width: 100%;
    flex: 1;
    height: 0;
    display: flex;
    padding: 0 var(--theme-padding) var(--theme-padding) var(--theme-padding);
    .workspace-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      .workspace-container {
        flex: 1;
        width: 100%;
        height: 0;
        overflow: hidden;
        .common-box();
      }
    }
  }
}
</style>

<style lang="less">
.load-exception-dialog {
  .exception-box {
    padding: 10px;
    border-radius: 10px;
    overflow-x: hidden;
    overflow-y: auto;
    .custom-scrollbar();
    background-color: var(--theme-box-background);
    margin-top: 20px;
    &__title {
      font-family: "JetBrains Mono", monospace;
    }
    pre {
      width: 100%;
      height: 100%;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}
</style>
