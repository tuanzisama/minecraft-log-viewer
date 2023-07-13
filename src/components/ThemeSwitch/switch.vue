<template>
  <div class="theme-switch-wrapper">
    <Transition>
      <span v-if="privateValue === 'light'" class="md-icon material-symbols-outlined" @click="onClickHandler('light')">light_mode</span>
      <span v-else class="md-icon material-symbols-outlined" @click="onClickHandler('dark')">dark_mode</span>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(defineProps<ThemeSwitchProps>(), {
  modelValue: "light",
});

const emit = defineEmits<ThemeSwitchEmits>();

const privateValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const onClickHandler = (val: ThemeSwitchProps["modelValue"]) => {
  const switchVal = val === "light" ? "dark" : "light";
  privateValue.value = switchVal;
  emit("on-change", switchVal);
};
</script>

<script lang="ts">
export interface ThemeSwitchProps {
  modelValue: "light" | "dark";
}

export interface ThemeSwitchEmits {
  (event: "update:modelValue", value: ThemeSwitchProps["modelValue"]): void;
  (event: "on-change", value: ThemeSwitchProps["modelValue"]): void;
}
</script>

<style lang="less" scoped>
.theme-switch-wrapper {
  width: 24px;
  height: 24px;
  position: relative;
  cursor: pointer;
  user-select: none;
  .md-icon {
    position: absolute;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
