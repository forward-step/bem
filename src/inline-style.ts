export type CSSObject = Partial<CSSStyleDeclaration | {[key in string]: CSSObject}>;

/**
 * https://github.com/streamich/nano-css
 * @param tree 
 * @param css 
 * @param selector 当前的选择器
 * @param prelude 媒体查询
 */
function cssToTree (tree: any, css: any, selector: string, prelude:string) {
    const declarations: any = {};
    let hasDeclarations = false;
    let key, value;

    // 将CSS属性抽离出来
    for (key in css) {
        value = css[key];
        if (typeof value !== 'object') {
            hasDeclarations = true;
            declarations[key] = value;
        }
    }
    if (hasDeclarations) {
        if (!tree[prelude]) tree[prelude] = {};
        tree[prelude][selector] = declarations; // {'': {}}, key为媒体查询，vlaue为对象
    }
    for (key in css) {
        value = css[key];
        if (typeof value === 'object') {
            if (key[0] === '@') { // 提交到顶部
                cssToTree(tree, value, selector, key);
            } else {
                const hasCurrentSymbol = key.indexOf('&') > -1;
                const selectorParts = selector.split(',');
                if (hasCurrentSymbol) {
                    for (let i = 0; i < selectorParts.length; i++) {
                        selectorParts[i] = key.replace(/&/g, selectorParts[i]);
                    }
                } else {
                    for (let i = 0; i < selectorParts.length; i++) {
                        // selectorParts[i] = selectorParts[i] + ' ' + key;
                        selectorParts[i] = key.split(',').map(ietm => selectorParts[i] + ' ' + ietm).join(',');
                    }
                }
                cssToTree(tree, value, selectorParts.join(','), prelude);
            }
        }
    }
};

export default class InlineStyle {
    private style: HTMLStyleElement;
    private sheet: CSSStyleSheet;
    constructor() {
        this.style = document.createElement('style');
        document.head.appendChild(this.style);
        this.sheet = this.style.sheet as any;
    }
    destory() {
        while(this.sheet.cssRules.length) {
            this.sheet.deleteRule(0);
        }
    }
    private createRule(selector: string, prelude?: string) {
        let rawCss = `${selector}{}`;
        if(prelude) rawCss = `${prelude}{${rawCss}}`;
        const index = this.sheet.insertRule(rawCss, this.sheet.cssRules.length);
        const rule = this.sheet.cssRules[index];
        if(rule instanceof CSSMediaRule) {
            return rule.cssRules[0] as CSSStyleRule;
        }
        return rule as CSSStyleRule;
    }
    private getValue(str: string): [string, string] {
        return str.includes('!important')
            ? [str.replace('!important', ''), 'important']
            : [str, ''];
    }
    put(css: CSSObject) {
        const tree = {};
        cssToTree(tree, css, '', '');
        for (const [prelude, preludeObject] of Object.entries(tree)) {
            if(typeof preludeObject === 'object' && preludeObject !== null) {
                for (const [selector, selectorObject] of Object.entries(preludeObject)) {
                    const rule = this.createRule(selector, prelude);
                    for (const [key, value] of Object.entries(selectorObject)) {
                        rule.style.setProperty(key, ...this.getValue(value as string));
                    }
                }
            }
        }
    }
    /// 输出所有的CSSText
    get cssText(): string {
        if(!this.sheet) return '';
        let res: string = '';
        for(let index=0;index<this.sheet.cssRules.length;index++) {
            const rule = this.sheet.cssRules[index];
            res += rule.cssText + '\n';
        }
        return res;
    }
}