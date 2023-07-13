<template>
  <!-- <div class="main-page" theme-mode="light"> -->
  <div class="main-page" :theme-mode="themeMode">
    <section class="main-header">
      <p>Minecraft Log Viewer</p>
      <div class="page-controll-box">
        <a href="https://github.com/tuanzisama/minecraft-log-viewer" target="_blank">Github</a>
        <a href="https://mcg.tuanzi.ink/" target="_blank">
          <span class="material-symbols-outlined"> palette </span>
        </a>
        <theme-switch v-model="themeMode" @on-change="onThemeChangeHandler" />
      </div>
    </section>
    <div class="main-container">
      <div class="file-wrapper">
        <section class="file-controll-bar">
          <div class="filelist-info-box">Selected {{ fileList.length }} file(s)</div>
          <div class="file-upload-wrapper">
            <button @click="onReadySelectFileHandler">
              <span class="material-symbols-outlined"> add </span>
            </button>
          </div>
        </section>
        <ul class="filelist-container" @contextmenu.prevent>
          <li
            class="file-item"
            :class="{ 'is-active': currentLogFile === item }"
            v-for="(item, index) in fileList"
            :key="index"
            :title="item.file.name"
            @dblclick="onOpenLogFileHandler(item)"
          >
            <p class="file-item__name">{{ item.file.name }}</p>
          </li>
        </ul>
      </div>
      <div class="workspace-wrapper">
        <div class="fileinfo-container" @contextmenu.prevent>
          <div class="logfile-icon">
            <img src="logos/fabric.png" />
          </div>
          <div class="logfile-info">
            <span class="logfile-info__name">{{ currentLogFile?.file.name }}</span>
            <p class="logfile-info__desc">
              <span class="logfile-info__size">{{ currentLogFile?.fileSize }}</span>
              <span class="logfile-info__lastmodi">{{ currentLogFile?.lastModified }}</span>
            </p>
          </div>
        </div>
        <div class="workspace-container">
          <monaco-editor ref="monacoEditorRef" :theme="editorTheme" v-model="editorValue" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import MonacoEditor, { MonacoEditorExpose } from "../../components/MonacoEditor";
import { DecompressZip } from "../../utils/decompress";
import { CharsetTransformer } from "../../utils/charset-transformer";
import prettyBytes from "pretty-bytes";
import ThemeSwitch, { ThemeSwitchProps } from "../../components/ThemeSwitch";

const fileList = reactive<LogFileRecord[]>([]);
const acceptExtension = [".log.gz", ".tar.gz", ".log"];
const currentLogFile = ref<LogFileRecord | null>(null);
const editorValue = ref(`[${new Date().toLocaleTimeString()}] [Minecraft Log Viewer] Welcome!`);
const themeMode = ref<ThemeSwitchProps["modelValue"]>("light");
const monacoEditorRef = ref<MonacoEditorExpose>();

const editorTheme = computed(() => {
  if (themeMode.value === "light") return "vs";
  else if (themeMode.value === "dark") return "vs-dark";
});

onMounted(() => {
  themeMode.value = localStorage.getItem("theme-mode") ?? "light";
});

const onReadySelectFileHandler = () => {
  const inputEl = document.createElement("input");
  inputEl.setAttribute("type", "file");
  inputEl.setAttribute("accept", acceptExtension.join(","));
  inputEl.setAttribute("multiple", "");
  inputEl.addEventListener("change", onFileChangeHandler);
  inputEl.click();
};

const onFileChangeHandler = async (event: { target: any; }) => {
  [...event.target!.files].forEach(async (file: File) => {
    const fileExtension = file.name.substring(file.name.indexOf("."), file.name.length);

    if (acceptExtension.includes(fileExtension)) {
      fileList.push({
        file,
        fileSize: prettyBytes(file.size),
        content: null,
        isTGZ: fileExtension.endsWith(".gz"),
        lastModified: new Date(file.lastModified).toLocaleString(),
      });
    }
  });
};

const onOpenLogFileHandler = async (item: LogFileRecord) => {
  currentLogFile.value = item;

  if (item.content == null) {
    editorValue.value = `[${new Date().toLocaleTimeString()}] [Minecraft Log Viewer] Loading...`;

    let buffer = null;
    if (item.isTGZ) {
      const decompress = new DecompressZip();
      buffer = await decompress.toArrayBuffer(item.file);
    } else {
      buffer = await item.file.arrayBuffer();
    }

    const charsetTrasnformer = new CharsetTransformer({ label: "gb2312" });
    const response = charsetTrasnformer.decode(buffer);

    item.content = response;
  }

  monacoEditorRef.value?.scrollToVertex();
  editorValue.value = item.content;
};

const onThemeChangeHandler = (val: string) => {
  if (val === "light") {
    monacoEditorRef.value?.setTheme("vs");
  } else if (val === "dark") {
    monacoEditorRef.value?.setTheme("vs-dark");
  }
  localStorage.setItem("theme-mode", val);
};
</script>

<script lang="ts">
interface LogFileRecord {
  file: File;
  fileSize: string;
  lastModified: string;
  isTGZ: boolean;
  content: string | null;
}
</script>

<style lang="less" scoped>
.main-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--theme-background);
  color: var(--theme-font-color);
  --theme-padding: 20px;
  --theme-box-border-radius: 10px;
  transition: all 0.3s;
  &[theme-mode="light"] {
    --theme-background: #f8f8f9;
    --theme-box-background: darken(#f8f8f9, 10%);
    --theme-font-color: #17233d;
    --theme-file-item-hover: var(--theme-background);
    --theme-file-item-active: #b8b3b3;
  }
  &[theme-mode="dark"] {
    --theme-background: #192227;
    --theme-box-background: lighten(#192227, 10%);
    --theme-font-color: #fff;
    --theme-file-item-hover: var(--theme-background);
    --theme-file-item-active: #758085;
  }

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
    .file-wrapper {
      width: 250px;
      margin-right: var(--theme-padding);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      padding: calc(var(--theme-padding) / 2);
      .common-box();
      .file-controll-bar {
        flex-shrink: 0;
        position: relative;
        .flex-vhcenter();
        padding-bottom: calc(var(--theme-padding) / 2);
        margin-bottom: calc(var(--theme-padding) / 2);
        border-bottom: 1px solid #b8b8b8;
        .filelist-info-box {
          flex: 1;
          font-size: 12px;
        }
        .file-upload-wrapper {
          button {
            width: 40px;
            height: 40px;
            border: none;
            outline: none;
            background-color: var(--theme-background);
            border-radius: var(--theme-box-border-radius);
            color: var(--theme-font-color);
            cursor: pointer;
            transition: all 0.3s;
            .flex-vhcenter();
          }
        }
      }
      .filelist-container {
        flex: 1;
        height: 0;
        overflow-y: auto;
        .custom-scrollbar();
        .file-item {
          height: 23px;
          padding: 5px;
          cursor: pointer;
          .flex-hcenter();
          transition: all 0.1s;
          border-radius: 3px;
          user-select: none;
          &.is-active {
            background-color: var(--theme-file-item-active);
          }
          &:hover {
            background-color: var(--theme-file-item-hover);
          }
          &__name {
            font-family: "JetBrains Mono", monospace;
            font-size: 12px;
            font-weight: 200;
            .text-ellipsis();
          }
        }
      }
    }
    .workspace-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      .fileinfo-container {
        height: 60px;
        margin-bottom: var(--theme-padding);
        padding: calc(var(--theme-padding) / 2);
        .common-box();
        .flex-hcenter();
        .logfile-icon {
          width: 40px;
          height: 40px;
          background-color: var(--theme-background);
          border: 5px solid var(--theme-background);
          border-radius: 5px;
          margin-right: 10px;
          transition: all 0.3s;
          img {
            .img-contain();
          }
        }
        .logfile-info {
          display: flex;
          flex-direction: column;
          &__name {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 5px;
          }
          &__desc {
            font-size: 10px;
            font-size: 200;
            opacity: 0.6;
            span {
              margin-right: 5px;
            }
          }
        }
      }
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

.common-box() {
  border-radius: var(--theme-box-border-radius);
  background-color: var(--theme-box-background);
  transition: background-color 0.3s;
}
</style>
