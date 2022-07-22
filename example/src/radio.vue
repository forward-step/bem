<template>
    <label :class="clsname" v-bind="$attrs">
        <input class="input_radio" v-model="model" :value="value" aria-hidden="true" ref="radio" type="radio" @focus="focus=true;" @blur="focus=false;" />
        <span v-if="showIcon" class="circle"><span class="circle__inner"></span></span>
        <div><slot></slot></div>
    </label>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from 'vue';
import BEM from '../../src/index';

export default defineComponent({
    name: 'el-radio',
    props: {
        modelValue: { type: String as PropType<string>, default: '' },
        disabled: { type: Boolean as PropType<boolean>, default: false },
        // 选中的值
        value: { type: String as PropType<string>, default: '' },
        // 是否显示边框
        border: { type: Boolean as PropType<boolean>, default: false },
        // 是否填充按钮样式
        fill: { type: Boolean as PropType<boolean>, default: false },
        dashed: { type: Boolean as PropType<boolean>, default: false },
        cap: { type: Boolean as PropType<boolean>, default: false },
        size: { type: String as PropType<string>, default: 'medium' },
        // 是否显示icon
        showIcon: { type: Boolean as PropType<boolean>, default: true },
    },
    setup(props, ctx) {
        /// variable
        const radio = ref<HTMLInputElement>(); // radio input dom
        const focus = ref<boolean>(false);
        const model = computed({ // 当前值
            get() {
                return props.modelValue;
            },
            set(val: string) {
                ctx.emit('update:modelValue', val);
            },
        });
        /// class
        const bem = new BEM('el-radio');
        // if(import.meta.env.DEV && typeof window !== 'undefined') {
        //     if(!window.bems) window.bems = [];
        //     window.bems.push(bem);
        // }
        // const clsname = computed<string>(() =>
        //     bem
        //         .destory() // 必须销毁
        //         .addState({
        //             'disabled': props.disabled,
        //             'focus': focus.value,
        //             'checked': model.value === props.value,
        //         })
        //         .under({
        //             'border': props.border,
        //         }, {
        //             'dashed': props.dashed,
        //             'cap': props.cap,
        //             'large': props.size === 'large',
        //             'medium': props.size === 'medium',
        //             'small': props.size === 'small',
        //         })
        //         .under({
        //             'fill': props.fill,
        //         }, {
        //             'cap': props.cap,
        //             'large': props.size === 'large',
        //             'medium': props.size === 'medium',
        //             'small': props.size === 'small',
        //         })
        //         .toString()
        // );
        const clsname = computed<string>(() =>
            bem.emsc(
                '',
                {},
                {
                    disabled: props.disabled,
                    focus: focus.value,
                    checked: model.value === props.value,
                },
                [
                    BEM.UNDER,
                    {
                        border: props.border,
                    },
                    {
                        dashed: props.dashed,
                        cap: props.cap,
                        large: props.size === 'large',
                        medium: props.size === 'medium',
                        small: props.size === 'small',
                    },
                ],
                [
                    BEM.UNDER,
                    {
                        fill: props.fill,
                    },
                    {
                        cap: props.cap,
                        large: props.size === 'large',
                        medium: props.size === 'medium',
                        small: props.size === 'small',
                    },
                ]
            )
        );
        return {
            clsname, focus, radio, model,
        };
    },
});
</script>

<style lang="scss">
.el-radio {
    --primary: skyblue;
    --white: #fff;
    --gray: gray;
    --interval: 8px;
    /// 间距
    & + & {
        margin-left: calc(var(--interval) * 2);
    }
    /// common style
    position: relative;
    z-index: 0;
    display: inline-flex;
    line-height: 1;
    cursor: pointer;
    .circle {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        width: 16px;
        height: 16px;
        border: 1px solid var(--gray);
        border-radius: 50%;
        margin-right: var(--interval);
    }
    .circle__inner {
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: var(--primary);
        border-radius: 50%;
        transform: scale(0);
        transition: transform .2s;
    }
    .input_radio {
        position: absolute;
        z-index: -1;
        opacity: 0;
    }
    /// 选中状态
    &.is-checked {
        z-index: 1;
        .circle {
            border-color: var(--primary);
            background-color: var(--white);
        }
        .circle__inner {
            transform: scale(1);
        }
    }
    // 禁用状态
    &.is-disabled {
        cursor: not-allowed;
        color: var(--gray);
        &.is-checked {
            .circle {
                border-color: var(--gray);
            }
            .circle__inner {
                background-color: var(--gray);
            }
        }
    }
}
// 带边框
.el-radio--border {
    box-sizing: border-box;
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    &.is-dashed {
        border-style: dashed;
    }
    // 选中状态
    &.is-checked {
        border-color: var(--primary);
    }
}
// 填充状态
.el-radio--fill {
    box-sizing: border-box;
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    &.is-checked {
        background-color: var(--primary);
        color: var(--white);
    }
}
/// 尺寸
.el-radio--fill, .el-radio--border {
    &.is-large {
        padding: 8px 16px;
    }
    &.is-medium {
        padding: 6px 16px;
    }
    &.is-small {
        padding: 4px 16px;
    }
    &.is-cap {
        border-radius: 30px;
    }
}
</style>
