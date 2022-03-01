# BEM

## 复杂的类名控制

* add: 添加描述符
* addState: 添加状态描述。通过BEM.statePrefix可修改前缀
* addClass: 添加类名

以上函数均支持类型string、object、array

```html
<template>
    <button :class="clsname"><slot></slot></button>
</template>
<script setup lang="ts">
    import BEM from 'bem';
    import { computed } from 'vue';
    const bem = new BEM('el-button');
    const clsname = computed(() => 
        bem.destory() // 【【【清除缓存】】】
            .add({
                border: props.border, // .el-button--border
            })
            .addState({
                cap: props.cap, // .is-cap
                circle: props.circle, // .is-circle
                dashed: props.dashed, // .is-dashed
            })
            // .addClass({
            //     'is-cap': props.cap, // .is-cap
            //     'is-circle': props.circle, // .is-circle
            //     'is-dashed': props.dashed, // .is-dashed
            // })
            .toString() // .el-button[.el-button--border][.is-cap][.is-circle][.is-dashed]
    );
</script>
```

## 简化

> 对上述代码进行简化

emsc分别对应元素，描述符，状态，类名

```html
<template>
    <button :class="clsname"><slot></slot></button>
</template>
<script setup lang="ts">
    import BEM from 'bem';
    import { computed } from 'vue';
    const bem = new BEM('el-button');
    const clsname = computed(() => bem.emsc('', {
        border: props.border, // .el-button--border
    }, {
        cap: props.cap, // .is-cap
        circle: props.circle, // .is-circle
        dashed: props.dashed, // .is-dashed
    }));
</script>
```

## under函数

> 上述dasehd(边框)在只有在border(显示边框)的情况下，才有意义

under(描述符，状态，类名)
只有在描述符全部生效的的情况下，状态和类名才会被解析
以下代码中`.el-button--border`出现的条件下，`.is-dashed`才有可能出现

```html
<template>
    <button :class="clsname"><slot></slot></button>
</template>
<script setup lang="ts">
    import BEM from 'bem';
    import { computed } from 'vue';
    const bem = new BEM('el-button');
    const clsname = computed(() => 
        bem.destory() // 【【【清除缓存】】】
            .under({
                border: props.border, // .el-button--border
            }, {
                dashed: props.dashed, // .is-dashed
            })
            .toString() // .el-button[.el-button--border[.is-dashed]]
    );
</script>
```

## emsc中使用under

数组的第一项为under字符串，既认为调用under函数
under的调用不影响emsc的排列顺序，既除了非under函数，其余按照元素名、描述符、状态、类名的顺序进行解析

```html
<template>
    <button :class="clsname"><slot></slot></button>
</template>
<script setup lang="ts">
    import BEM from 'bem';
    import { computed } from 'vue';
    const bem = new BEM('el-button');
    const clsname = computed(() => bem.emsc('', {}, {
        cap: props.cap, // .is-cap
        circle: props.circle, // .is-circle
    }, [
        'under',
        {
            border: props.border, // .el-button--border
        }, {
            dashed: props.dashed, // .is-dashed
        }
    ]));
</script>
```

## CSS函数

添加CSS代码到style中，支持&、@at-root、媒体查询语法
commonCss和css的区别在于: css存在私有类名`.bem-0`，确保只在当前bem对象管理的HTML代码内生效

```js
const bem = new BEM('el-button');
bem.commonCss({
    'background-color': 'red',
}); // 解析为: .el-button { background-color: red; }
bem.css({
    'background-color': 'red',
}); // 解析为: .el-button.bem-0 { background-color: red; }
bem.destory(); // 销毁，删除所有操作，包括添加的CSS代码
```


# SCSS
element-ui中SCSS中的BEM
@include b(button) -- 添加前缀, ag-button
@include e(inner) -- 添加元素, ag-button__inner
@include m(primary) -- 描述符, ag-button--primary
@include when(border) -- 状态描述, ag-button.is-border