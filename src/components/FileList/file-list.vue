<template>
  <div class="file-wrapper">
    <section class="file-controll-bar">
      <div class="filelist-info-box">Selected {{ fileStore.fileList.length }} file(s)</div>
      <div class="file-upload-wrapper">
        <button @click="onReadySelectFileHandler">
          <span class="material-symbols-outlined"> add </span>
        </button>
      </div>
    </section>
    <ul class="filelist-container" @contextmenu.prevent>
      <t-dropdown
        :options="dropdownOptions"
        trigger="context-menu"
        placement="right-top"
        v-for="(item, index) in fileStore.fileList"
        :key="index"
        @click="(dropdownItem, context) => onDropdownClickHandler(item, dropdownItem, context)"
      >
        <li
          class="file-item"
          :class="{
            'is-active': fileStore.currentRecord === item,
            'is-selected': fileStore.sortSelectedFileIndex.includes(index),
          }"
          :title="item.file.name"
          @click.ctrl.stop="($event) => onCtrlClickHandler($event, item, index)"
          @click.shift.stop="($event) => onShiftClickHandler($event, item, index)"
          @dblclick="($event) => onOpenLogFileHandler($event, item)"
        >
          <p class="file-item__name">{{ item.file.name }}</p>
        </li>
      </t-dropdown>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { LogFile, useFileStore } from "../../plugins/store/modules/file";
import { DecompressZip } from "../../utils/decompress";
import { CharsetTransformer } from "../../utils/charset-transformer";
import prettyBytes from "pretty-bytes";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { isEmpty, remove, slice } from "lodash";
import { DropdownOption, NotifyPlugin } from "tdesign-vue-next";

const fileStore = useFileStore();
const acceptExtension = [".log.gz", ".tar.gz", ".log"];
const emit = defineEmits<FileListEmits>();
const dropdownOptions = [
  { content: "合并下载", value: "merge-download", divider: true, disabled: true },
  { content: "移除", value: "remove", theme: "error" },
] as DropdownOption[];

onMounted(() => {
  document.body.addEventListener("click", unselectFileItem);
});

onBeforeUnmount(() => {
  document.body.removeEventListener("click", unselectFileItem);
});

const unselectFileItem = () => {
  if (!isEmpty(fileStore.selectedFileList)) {
    fileStore.selectedFileList = [];
  }
};

const onReadySelectFileHandler = () => {
  const inputEl = document.createElement("input");
  inputEl.setAttribute("type", "file");
  inputEl.setAttribute("accept", acceptExtension.join(","));
  inputEl.setAttribute("multiple", "");
  inputEl.addEventListener("change", onFileChangeHandler);
  inputEl.click();
};

const onFileChangeHandler = async (event: { target: any }) => {
  [...event.target!.files].forEach(async (file: File) => {
    const fileExtension = file.name.substring(file.name.indexOf("."), file.name.length);

    if (acceptExtension.includes(fileExtension)) {
      fileStore.fileList.push({
        file,
        fileSize: prettyBytes(file.size),
        content: null,
        isTarGZ: fileExtension.endsWith(".gz"),
        fileLastModified: new Date(file.lastModified).toLocaleString(),
      });
    }
  });
};

const onOpenLogFileHandler = async ($event: MouseEvent, item: LogFile) => {
  if ($event.shiftKey) return;
  if (item.content == null) {
    emit("on-load-before", item);
    try {
      let buffer = null;
      if (item.isTarGZ) {
        const decompress = new DecompressZip();
        buffer = await decompress.toArrayBuffer(item.file);
      } else {
        buffer = await item.file.arrayBuffer();
      }

      const charsetTrasnformer = new CharsetTransformer({ label: "gb2312" });
      const response = charsetTrasnformer.decode(buffer);
      item.content = response;

      fileStore.currentRecord = item;
      emit("on-loaded", item);
    } catch (error) {
      console.error(error);
      emit("on-load-error", item, error as Error);
    }
  } else {
    fileStore.currentRecord = item;
    emit("on-loaded", item);
  }
};

const onDropdownClickHandler = (item: LogFile, dropdownItem: DropdownOption, context: { e: MouseEvent }) => {
  context.e.stopPropagation();
  if (dropdownItem.value === "remove") {
    fileRemoveHandler(item);
  }
};

const fileRemoveHandler = (item: LogFile) => {
  if (isEmpty(fileStore.sortSelectedFileIndex)) {
    remove(fileStore.fileList, item);
    NotifyPlugin("success", {
      title: "File removed!",
      content: `${item.file.name}`,
      duration: 3000,
      placement: "bottom-right",
    });
    emit("on-removed", [item]);
  } else {
    fileStore.removeFileListFromSelected();
    NotifyPlugin("success", {
      title: `${fileStore.selectedFileList.length} file(s) removed!`,
      duration: 3000,
      placement: "bottom-right",
    });
    emit("on-removed", [...fileStore.selectedFileList]);
  }
  fileStore.selectedFileList = [];
};

const firstFileItemIndex = ref(-1);
const onShiftClickHandler = ($event: MouseEvent, item: LogFile, index: number) => {
  if ($event.ctrlKey) return;

  if (fileStore.sortSelectedFileIndex.includes(index)) {
    remove(fileStore.selectedFileList, item);
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      firstFileItemIndex.value = -1;
    }
  } else {
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      fileStore.selectedFileList.push(item);
      firstFileItemIndex.value = index;
    } else {
      if (index === firstFileItemIndex.value + 1 || index === firstFileItemIndex.value - 1) {
        fileStore.sortSelectedFileIndex.push(index);
      } else {
        const sliceArr = sliceFileList(firstFileItemIndex.value, index);
        fileStore.selectedFileList = sliceArr;
      }
    }
  }
};

const onCtrlClickHandler = ($event: MouseEvent, item: LogFile, index: number) => {
  if ($event.shiftKey) return;
  if (fileStore.sortSelectedFileIndex.includes(index)) {
    remove(fileStore.selectedFileList, item);
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      firstFileItemIndex.value = -1;
    }
  } else {
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      firstFileItemIndex.value = index;
    }
    fileStore.selectedFileList.push(item);
  }
};

const sliceFileList = (start: number, end: number) => {
  if (start < end) return slice(fileStore.fileList, start, end + 1);
  else return slice(fileStore.fileList, end, start + 1);
};
</script>

<script lang="ts">
export interface ThemeSwitchProps {
  modelValue: "light" | "dark";
}

export interface FileListEmits {
  (event: "on-load-before", file: LogFile): void;
  (event: "on-load-error", file: LogFile, error: Error): void;
  (event: "on-loaded", value: LogFile): void;
  (event: "on-removed", value: LogFile[]): void;
}
</script>

<style lang="less" scoped>
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
        background-color: var(--theme-file-item-active-background);
        .file-item__name {
          font-weight: 700 !important;
        }
      }
      &.is-selected {
        background-color: var(--theme-file-item-selected-background) !important;
        color: var(--theme-file-item-selected-color) !important;
        .file-item__name {
          font-weight: 700 !important;
        }
      }
      &:hover:not(.is-active) {
        color: var(--theme-file-item-hover-color);
        .file-item__name {
          font-weight: 400 !important;
        }
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
</style>
