<template>
    <!-- 矩形，隐藏border-right和boder-top之后再稍微旋转一下就是✔ -->
    <div :class="clsname" :style="{
        background: bg,
    }"></div>
    <div>clsname:</div>
    <code>{{clsname}}</code>
    <div>cssText:</div>
    <code>{{cssText}}</code>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, watch } from 'vue';
import BEM from '../../src/index';

export default defineComponent({
    props: {
        // 是否为圆形边框
        circle: { type: Boolean as PropType<boolean>, default: false },
        /// 背景色和颜色
        color: { type: String as PropType<string>, default: 'black' },
        bg: { type: String as PropType<string>, default: '#fff' },
    },
    setup(props) {
        let bem = new BEM(`el-check`);
        const clsname = computed<string>(() =>
            bem
                .destory()
                .add({
                    circle: props.circle,
                })
                // css in js
                .css({
                    'background-color': props.bg,
                    '&--circle': {
                        border: `1px solid ${props.color}`,
                    },
                    '&::before': {
                        'border-color': props.color,
                    },
                    // 测试媒体查询
                    '@media only screen and (max-width: 600px)': {
                        'background-color': 'red',
                    },
                })
                .toString()
        );
        const cssText = computed(() => bem.cssText);
        return {
            clsname,
            cssText,
        };
    },
});
</script>

<style lang="scss">
.el-check {
    display: inline-block;
    position: relative;
    width: 16px;
    height: 16px;
    // background-color: var(--bg, #fff);
    &--circle {
        // border: 1px solid var(--color, black);
        padding: 3px;
        border-radius: 50%;
    }
    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 15px;
        height: 6px;
        border: 1px solid var(--color, black);
        border-top: 0;
        border-right: 0;
        transform: translate(-50%, -50%) rotate(-45deg) scale(1);
        transform-origin: center;
    }
}
</style>
