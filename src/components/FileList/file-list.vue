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
        :popup-props="{ overlayClassName: 'filelist-contextmenu', onVisibleChange: (visible, context) => onDropdownVisibleChangeHandler(item, visible, context) }"
        :min-column-width="300"
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
import { computed, h, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { isEmpty, remove, slice, truncate } from "lodash";
import { DropdownOption, NotifyPlugin, PopupVisibleChangeContext, Button } from "tdesign-vue-next";
import { downloadFile } from "../../utils/util";

const props = withDefaults(defineProps<FileListProps>(), {
  charset: "utf-8",
});

const fileStore = useFileStore();
const acceptExtension = [".log.gz", ".tar.gz", ".log"];
const emit = defineEmits<FileListEmits>();
const currentOpenDropdownLogFile = shallowRef<LogFile | null>(null);
const firstFileItemIndex = ref(-1);

const dropdownOptions = computed<DropdownOption[]>(() => {
  let selectFileSize = fileStore.selectedFileList.length;
  let fileName = currentOpenDropdownLogFile.value?.file.name ?? "";
  return [
    { content: truncate(fileName, { length: 24 }), value: "file-info", divider: true },
    { content: "Merge download...", value: "merge-download", disabled: selectFileSize === 0, prefixIcon: () => h("span", { class: "material-symbols-outlined" }, "merge") },
    { content: selectFileSize === 0 ? "Remove" : `Remove ${selectFileSize} file(s)`, value: "remove", theme: "error", prefixIcon: () => h("span", { class: "material-symbols-outlined" }, "delete") },
  ];
});

onMounted(() => {
  document.body.addEventListener("click", unselectFileItem);
});

onBeforeUnmount(() => {
  document.body.removeEventListener("click", unselectFileItem);
});

const unselectFileItem = (event: MouseEvent) => {
  if (event.target !== null) {
    const closestElement = (event.target as Element).closest(".filelist-contextmenu");
    if (closestElement === null && !isEmpty(fileStore.selectedFileList)) {
      fileStore.selectedFileList = [];
    }
  }
};

const onDropdownVisibleChangeHandler = (item: LogFile, visible: boolean, context: PopupVisibleChangeContext) => {
  currentOpenDropdownLogFile.value = visible ? item : null;
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
      const logFile = {
        file,
        fileSize: prettyBytes(file.size),
        content: null,
        isTarGZ: fileExtension.endsWith(".gz"),
        fileLastModified: new Date(file.lastModified).toLocaleString(),
      };
      fileStore.fileList.push(logFile);
    }
  });
};

const onOpenLogFileHandler = async ($event: MouseEvent, item: LogFile) => {
  if ($event.shiftKey) return;
  emit("on-load-before", item);
  if (item.content == null) {
    const response = await loadFileContent(item);
    emit("on-loaded", item);
    item.content = response;
    fileStore.currentRecord = item;
  } else {
    fileStore.currentRecord = item;
  }
  emit("on-change", item);
};

const loadFileContent = async (item: LogFile) => {
  try {
    let buffer = null;
    if (item.isTarGZ) {
      const decompress = new DecompressZip();
      buffer = await decompress.toArrayBuffer(item.file);
    } else {
      buffer = await item.file.arrayBuffer();
    }
    const charsetTrasnformer = new CharsetTransformer({ label: props.charset });
    const response = charsetTrasnformer.decode(buffer);

    return response;
  } catch (error) {
    console.error(error);
    emit("on-load-error", item, error as Error);
    return null;
  }
};

const onDropdownClickHandler = async (item: LogFile, dropdownItem: DropdownOption, context: { e: MouseEvent }) => {
  context.e.stopPropagation();
  if (dropdownItem.value === "merge-download") {
    await fileMergeDownloadHandler();
  } else if (dropdownItem.value === "remove") {
    fileRemoveHandler(item);
  }
  fileStore.selectedFileList = [];
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
};

const fileMergeDownloadHandler = async () => {
  const contents: string[] = [];

  for (let element of fileStore.selectedFileList) {
    if (element.content == null) {
      const response = await loadFileContent(element);
      contents.push(response as string);
    } else {
      contents.push(element.content);
    }
  }

  const mergeFileBlob = new Blob([contents.join("")], { type: "text/plain;charset=utf8" });
  const blobSize = prettyBytes(mergeFileBlob.size);
  const onClickHandler = () => {
    downloadFile(mergeFileBlob, `log-merge-${Date.now()}.log`);
    NotifyPlugin.close(fileMergeNotify);
  };
  const fileMergeNotify = NotifyPlugin.success({
    title: "File Merged!",
    content: `${fileStore.selectedFileList.length} file(s) are merge successfully!`,
    duration: 30000,
    placement: "bottom-right",
    footer: () => [h("div", { class: "t-notification__detail" }, [h(Button, { theme: "primary", variant: "text", onClick: onClickHandler }, `Download (${blobSize})`)])],
  });
};

const onShiftClickHandler = ($event: MouseEvent, item: LogFile, index: number) => {
  if ($event.ctrlKey) return;

  if (fileStore.sortSelectedFileIndex.includes(index)) {
    const sliceArr = sliceFileList(firstFileItemIndex.value, index);
    fileStore.selectedFileList = sliceArr;
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      firstFileItemIndex.value = -1;
    }
  } else {
    if (isEmpty(fileStore.sortSelectedFileIndex)) {
      fileStore.selectedFileList.push(item);
      firstFileItemIndex.value = index;
    } else {
      const sliceArr = sliceFileList(firstFileItemIndex.value, index);
      fileStore.selectedFileList = sliceArr;
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
export interface FileListProps {
  charset: string;
}

export interface FileListEmits {
  (event: "on-load-before", file: LogFile): void;
  (event: "on-load-error", file: LogFile, error: Error): void;
  (event: "on-loaded", value: LogFile): void;
  (event: "on-change", value: LogFile): void;
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

<style lang="less">
.filelist-contextmenu {
  .t-dropdown__menu > div:first-child {
    .t-dropdown__item {
      pointer-events: none;
      &:hover,
      &:active {
        background-color: inherit !important;
      }
    }
  }
}
</style>
