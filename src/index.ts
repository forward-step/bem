import InlineStyle, { CSSObject } from './inline-style';

/// 描述符、classname的参数
export type IModifier = string | null | undefined | boolean | number | IModifier[] | {
    [key in string | number]: any;
};
export type IClasses = IModifier;

/// 映射对象
export type IStyleObject = {
    [key in string]: any;
} | null;

/// BEM所需选项
export const bemOptions = {
    namespace: '', // 命名空间
    elementSeparator: '__', // 元素分隔符
    modifierSeparator: '--', // 描述符分隔符
    statePrefix: 'is-', // 状态前缀
}

const inlineStyle = new InlineStyle();
let counter: number = 0;

export default class BEM {
    static debug: boolean = false;
    static InlineStyle = InlineStyle;

    //#region BEM OPTIONS
    static namespace: string = bemOptions.namespace;
    static elementSeparator: string = bemOptions.elementSeparator;
    static modifierSeparator: string = bemOptions.modifierSeparator;
    static statePrefix: string = bemOptions.statePrefix;
    //#endregion

    //#region 数据结构
    private map: IStyleObject = null; // 映射对象
    private clsnames: Set<string> = new Set(); // 追加的classname
    private modifiers: Set<string> = new Set(); // 管理的描述符
    //#endregion

    constructor(
        private blockName: string, 
        private elementName: string = '', 
    ) {
        this.block(this.blockName);
    }
    [Symbol.toStringTag]() {
        return 'BEM';
    }
    destory() {
        inlineStyle.destory();
        this.map = null;
        this.clsnames.clear();
        this.modifiers.clear();
        return this;
    }
    

    //#region 管理block name
    block(name: string): BEM;
    block(): string;
    block(name?: string): BEM | string {
        if(!!name) {
            if(name.startsWith(BEM.namespace)) { // 避免携带了命名空间
                this.blockName = name;
            } else {
                this.blockName = `${BEM.namespace}${name}`;
            }
            return this;
        }
        return this.blockName;
    }
    //#endregion

    //#region 管理element name
    element(name: string): BEM;
    element(): string;
    element(name?: string, modifier: IModifier = {}, states: IClasses = {}, clsname: IClasses = {}): BEM | string {
        if(!!name) {
            return new BEM(this.blockName, name).add(modifier).addState(states).addClass(clsname); // 新对象, 与原来的互不相关, 所以也不用去销毁
        }
        return this.elementName;
    }
    //#endregion

    // emsc(name, [modifier, states, clsname]) -- 使用under函数的例子
    // emsc(name, modifier, states, clsname) -- 不适用under函数的例子
    // 同时使用俩种模式 - 数组不参与排序
    // emsc(name, modifier, states, clsname, [])
    emsc(name: string, ...args: IModifier[] | IModifier[][]) {
        const bem = new BEM(this.block(), name);
        let index = 0;
        args.forEach((arg) => {
            if(Array.isArray(arg) && arg.length > 1 && arg[0] === 'under') {
                bem.under(arg[1], arg[2], arg[3]);
            } else {
                if(index === 0) {
                    bem.add(arg);
                } else if(index === 1) {
                    bem.addState(arg);
                } else {
                    bem.addClass(arg);
                }
                index++;
            }
        });
        return bem.toString();
    }

    //#region 管理map
    bind(map: IStyleObject) {
        this.map = map;
        return this;
    }
    unbind() {
        this.map = null;
        return this;
    }
    //#endregion

    //#region 实现添加CSS代码
    private getUniqueClass(): string {
        return `bem-${(counter++).toString(36)}`;
    }
    commonCss(css: CSSObject) {
        inlineStyle.put({
            [`.${this.block()}`]: css,
        });
        return this;
    }
    css(css: CSSObject) {
        const unqiue = this.getUniqueClass();
        /**
         * 为什么要追加unique
         * 答: 不加的话，多个地方使用同一组件，后面的组件样式就会覆盖前面的样式
         * unique需要放在block name之前
         * 答: 这样子使用{'&--check': xxx}才会生成正确的样式 
         * eg .bem-0.blockname--check
         */
        inlineStyle.put({
            [`.${unqiue}.${this.block()}`]: css,
        });
        this.addClass(unqiue);
        return this;
    }
    get cssText() {
        return inlineStyle.cssText;
    }
    //#endregion

    //#region 实现数据的处理
    private *_handleValue(modifiers: IModifier | IClasses, bool: boolean = true): Generator<[boolean, string], BEM> {
        if(typeof modifiers === 'undefined' || modifiers === null) return this;
        else if(typeof modifiers === 'string' || typeof modifiers === 'number' || typeof modifiers === 'boolean') {
            yield [!!modifiers && bool, modifiers.toString()];
        }
        else if(Array.isArray(modifiers)) {
            for (const item of modifiers) {
                yield *this._handleValue(item, true);
            }
        }
        else {
            for (const [item, bool] of Object.entries(modifiers)) {
                yield *this._handleValue(item, !!bool);
            }
        }
        return this;
    }
    /**
     * @description 处理所有的值
     * @param values 
     * @param callback 处理函数
     * @returns {BEM}
     */
    private handleValue(values: IModifier | IClasses, callback: (bool: boolean, attr: string) => void) {
        const gen = this._handleValue(values);
        let res = gen.next();
        while(!res.done) {
            const [bool, item] = res.value;
            callback(bool, item);
            res = gen.next();
        }
        return this;
    }
    /**
     * @description 处理为true的值
     * @param modifiers 
     * @param callback 处理函数
     * @returns {BEM}
     */
    private handleTrueValue(modifiers: IModifier | IClasses, callback: (attr: string) => void): BEM {
        const gen = this._handleValue(modifiers);
        let res = gen.next();
        while(!res.done) {
            const [bool, item] = res.value;
            bool && callback(item);
            res = gen.next();
        }
        return this;
    }
    /**
     * @description 处理判断
     * @param values 描述符对象 or 类名对象
     * @param callback 通过的条件
     * @returns {boolean}
     */
    private handleValidator(values: IClasses | IModifier, callback: (bool: boolean, item: string) => boolean):boolean {
        const gen = this._handleValue(values);
        let res = gen.next();
        while(!res.done) {
            const [bool, item] = res.value;
            if(!callback(bool, item)) return false; // 不生效就返回false
            res = gen.next();
        }
        return true;
    }
    //#endregion

    //#region 描述符管理
    /**
     * @description 描述符描述数组全部为true && 真实存在
     * @param modifiers 
     * @returns {boolean}
     */
    has(modifiers: string | string[]): boolean {
        return this.valid(modifiers);
    }
    /**
     * @description 有效 ; 描述符描述对象全部为true && 真实存在
     * @param modifiers 
     * @returns {boolean}
     */
    valid(modifiers: IModifier): boolean {
        return this.handleValidator(modifiers, (bool, item) => bool && this.modifiers.has(item)); // 存在并且找得到
    }
    /**
     * @description 与描述一致就返回true, 否则返回false
     * @param modifiers 
     * @returns {boolean}
     */
    same(modifiers: IModifier): boolean {
        return this.handleValidator(modifiers, (bool, item) => (
            (
                bool && this.modifiers.has(item) // 存在就要找到
            ) || (
                !bool && !this.modifiers.has(item) // 不存在就要找不到
            )
        ));
    }

    /**
     * @description 添加描述符
     * @param modifiers 
     * @returns {BEM}
     */
    add(...modifiers: IModifier[]): BEM {
        return this.handleTrueValue(modifiers, (modifier) => {
            this.modifiers.add(modifier);
        });
    }

    /**
     * @description 删除存在的描述符
     * @param modifiers 
     * @returns {BEM}
     */
    remove(modifiers: IModifier): BEM {
        return this.handleTrueValue(modifiers, (modifier) => {
            this.modifiers.delete(modifier);
        });
    }

    /**
     * @description 切换描述符
     * @param modifiers 描述符
     * @returns {BEM}
     */
    toggle(modifiers: IModifier): BEM {
        return this.handleValue(modifiers, (bool, modifier) => {
            this.modifiers.has(modifier) ? this.modifiers.delete(modifier) : this.modifiers.add(modifier);
        });
    }
    //#endregion

    //#region clss管理
    /**
     * @description 类名描述全为true && 真实存在
     * @param classes 类名描述
     * @returns {boolean}
     */
    hasClass(classes: string | string[]): boolean {
        return this.validClass(classes);
    }
    /**
     * @description 类名描述全为true && 真实存在
     * @param classes 类名描述
     * @returns {boolean}
     */
    validClass(classes: IClasses): boolean {
        return this.handleValidator(classes, (bool, clsname) => bool && this.clsnames.has(clsname)); // 存在并且找得到
    }
    /**
     * @description 当前类名是否与描述一致
     * @param classes 类名描述
     * @returns {boolean}
     */
    sameClass(classes: IClasses): boolean {
        return this.handleValidator(classes, (bool, clsname) => (
            (
                bool && this.clsnames.has(clsname) // 存在就要找到
            ) || (
                !bool && this.clsnames.has(clsname) // 不存在就要找不到
            )
        ))
    }
    /**
     * @description 添加类名
     * @param classes 类名
     * @returns {BEM}
     */
    addClass(classes: IClasses): BEM {
        this.handleTrueValue(classes, (clsname) => {
            this.clsnames.add(clsname);
        });
        return this;
    }
    /**
     * @description 删除类名
     * @param classes 类名
     * @returns {BEM}
     */
    removeClass(classes: IClasses): BEM {
        this.handleTrueValue(classes, (clsname) => {
            this.clsnames.delete(clsname);
        });
        return this;
    }
    /**
     * @description 切换类名
     * @param classes 类名
     * @returns {BEM}
     */
    toggleClass(classes: IClasses):BEM {
        this.handleValue(classes, (bool, clsname) => {
            this.clsnames.has(clsname) ? this.clsnames.delete(clsname) : this.clsnames.add(clsname);
        });
        return this;
    }
    //#endregion

    //#region 状态管理
    /**
     * 将状态描述转换为类名描述
     * @param states 状态描述对象
     * @returns 类名描述对象
     */
    private state2class(states: string): string;
    private state2class(states: string[]): string[];
    private state2class(states: string | string[]): string | string[];
    private state2class(states: IClasses): IClasses;
    private state2class(states: any) {
        if(typeof states === 'string') {
            return `${BEM.statePrefix}${states}`;
        } else if(Array.isArray(states)) {
            return states.map(state => `${BEM.statePrefix}${state}`);
        } else {
            const result: IClasses = [];
            this.handleValue(states, (bool, clsname) => {
                result.push({
                    [`${BEM.statePrefix}${clsname}`]: bool,
                });
            });
            return result;
        }
    }
    hasState(states: string | string[]): boolean {
        return this.hasClass(this.state2class(states));
    }
    validState(states: IClasses): boolean {
        return this.validClass(this.state2class(states));
    }
    sameState(states: IClasses): boolean {
        return this.sameClass(this.state2class(states));
    }
    addState(states: IClasses):BEM {
        return this.addClass(this.state2class(states));
    }
    removeState(states: IClasses): BEM {
        return this.removeClass(this.state2class(states));
    }
    toggleState(states: IClasses): BEM {
        return this.toggleClass(this.state2class(states));
    }
    //#endregion

    //#region 描述符和class的联系
    // 1. 添加描述符
    // 2. 只有在全部描述符有效的情况下才会添加额外的class和state
    under(modifiers: IModifier, states: IClasses = {}, classes: IClasses = {}) {
        if(this.add(modifiers).valid(modifiers)) {
            this.addState(states);
            this.addClass(classes);
        }
        return this;
    }
    //#endregion

    //#region 输出字符串
    private getBE(): string {
        return !!this.elementName ? `${this.blockName}${BEM.elementSeparator}${this.elementName}` : this.blockName;
    }
    private clsname2string(): string[] {
        return Array.from(this.clsnames);
    }
    private modifier2string(): string[] {
        const result: string[] = [];
        let be = this.getBE();
        result.push(be);
        for (const modifier of this.modifiers) {
            modifier && result.push(`${be}${BEM.modifierSeparator}${modifier}`);
        }
        return result;
    }
    toString(): string {
        let result = [...this.modifier2string(), ...this.clsname2string()];
        return (
            this.map === null ? result : result.map(key => {
                if(this.map === null) throw new Error('BEM: something is error');
                const item = this.map[key];
                !item && BEM.debug && console.debug(`${item} is not found from map`);
                return item;
            })
        ).join(' ').trim();
    }
    //#endregion

    //#region 查询DOM元素
    queryModifierString(modifiers: IModifier): string {
        const m = new Set<string>([]); // 去重
        this.handleTrueValue(modifiers, (modifier) => {
            m.add(`${this.getBE()}${BEM.modifierSeparator}${modifier}`);
        });
        let result = '';
        m.forEach(item => result += `.${item}`);
        return result;
    }
    queryStateString(states: IClasses): string {
        const s = new Set<string>([]); // 去重
        this.handleTrueValue(states, (state) => {
            s.add(`${BEM.statePrefix}${state}`);
        });
        let result = '';
        s.forEach(item => result += `.${item}`);
        return result;
    }
    //#endregion
}
