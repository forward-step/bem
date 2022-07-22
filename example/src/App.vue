<template>
    <!-- <p>under函数</p>
    <radio v-model="value" value="1" border dashed>虚线</radio>
    <radio v-model="value" value="2" border cap>胶囊</radio>
    <radio v-model="value" value="3" border dashed cap>虚线 + 胶囊</radio>
    <radio v-model="value" value="4" fill dashed>选中填充</radio>
    <radio v-model="value" value="5" fill cap>选中填充 + 胶囊</radio>
    <radio v-model="value" value="6" fill dashed cap>选中填充 + 胶囊</radio> -->
    <p>css函数</p>
    <check color="red"/>
    <!-- <check circle /> -->
</template>

<script setup lang="ts">
import { ref } from 'vue';
import check from './check.vue';
import radio from './radio.vue';
const value = ref('1');
</script>